import { Prisma, PrismaClient, CredentialOperation } from "@prisma/client";
import { Contract, JsonRpcProvider, Wallet, TransactionRequest, keccak256 } from "ethers";

type Details = { contractAddress: string; reference: string; digest?: string; metadataUri?: string; metadataCid?: string | null; recipient?: string; reason?: string };

export async function prepareOperation(prisma: PrismaClient, signer: Wallet, input: { credentialId: string; institutionId: string; actorId: string; kind: "MINT" | "REVOKE"; chainId: number; details: Details; transaction: TransactionRequest }) {
  return prisma.$transaction(async tx => {
    // Serialize reservations for this signer across API replicas. Use a dedicated
    // wallet: external transactions cannot participate in this nonce reservation.
    const signerAddress = signer.address.toLowerCase();
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`${input.chainId}:${signerAddress}`}))::text`;
    await tx.$queryRaw`SELECT "id" FROM "Credential" WHERE "id" = ${input.credentialId}::uuid FOR UPDATE`;
    const credential = await tx.credential.findUnique({ where: { id: input.credentialId } });
    if (!credential || credential.status !== "ACTIVE" || credential.institutionId !== input.institutionId) throw new Error("CREDENTIAL_NOT_ACTIVE");
    const pending = await tx.credentialOperation.findFirst({ where: { credentialId: input.credentialId, status: { in: ["PREPARED", "SUBMITTED"] } } });
    if (pending) throw new Error(`OPERATION_PENDING:${pending.id}`);
    const previous = await tx.credentialOperation.findFirst({ where: { chainId: input.chainId, signerAddress }, orderBy: { nonce: "desc" }, select: { nonce: true } });
    const nonce = Math.max(await signer.getNonce("pending"), (previous?.nonce ?? -1) + 1);
    const populated = await signer.populateTransaction({ ...input.transaction, nonce, chainId: input.chainId });
    const rawTransaction = await signer.signTransaction(populated);
    return tx.credentialOperation.create({ data: { credentialId: input.credentialId, institutionId: input.institutionId, actorId: input.actorId, kind: input.kind, chainId: input.chainId, signerAddress, nonce, transactionHash: keccak256(rawTransaction), rawTransaction, details: input.details as Prisma.InputJsonValue } });
  }, { timeout: 30000 });
}

export async function settleOperation(prisma: PrismaClient, operation: CredentialOperation, provider: JsonRpcProvider, abi: string[], broadcast: boolean) {
  if (operation.status === "CONFIRMED" || operation.status === "FAILED") return { operationId: operation.id, status: operation.status, transactionHash: operation.transactionHash };
  if (Number((await provider.getNetwork()).chainId) !== operation.chainId) throw new Error("BLOCKCHAIN_NETWORK_MISMATCH");
  const details = operation.details as unknown as Details;
  let receipt = await provider.getTransactionReceipt(operation.transactionHash!);
  if (!receipt && broadcast) {
    try {
      await provider.broadcastTransaction(operation.rawTransaction);
      await prisma.credentialOperation.updateMany({ where: { id: operation.id, status: "PREPARED" }, data: { status: "SUBMITTED" } });
    } catch {
      // RPC acknowledgement can be lost. Never construct a second transaction.
      receipt = await provider.getTransactionReceipt(operation.transactionHash!);
    }
    const minConfirmations = operation.chainId === 31337 ? 1 : 2;
    if (!receipt) receipt = await provider.waitForTransaction(operation.transactionHash!, minConfirmations, 15_000).catch(() => null);
  }
  const minConfirmations = operation.chainId === 31337 ? 1 : 2;
  const confirms = receipt ? await receipt.confirmations() : 0;
  if (!receipt || (minConfirmations > 1 && confirms < minConfirmations)) return { operationId: operation.id, status: "PENDING", transactionHash: operation.transactionHash };
  if (receipt.status !== 1) {
    await prisma.credentialOperation.updateMany({ where: { id: operation.id, status: { in: ["PREPARED", "SUBMITTED"] } }, data: { status: "FAILED" } });
    return { operationId: operation.id, status: "FAILED", transactionHash: operation.transactionHash };
  }
  const contract = new Contract(details.contractAddress, abi, provider);
  const events = receipt.logs.filter(log => log.address.toLowerCase() === details.contractAddress.toLowerCase()).map(log => { try { return contract.interface.parseLog(log); } catch { return null; } });
  const refClean = details.reference?.toLowerCase().replace(/^0x/, "") || "";
  const event = events.find(value => {
    if (!value || value.name !== (operation.kind === "MINT" ? "CredentialMinted" : "CredentialRevoked")) return false;
    const credRefArg = String(value.args.credentialRef || "").toLowerCase().replace(/^0x/, "");
    const credIdArg = String(value.args.credentialId || "").toLowerCase().replace(/^0x/, "");
    const opCredId = operation.credentialId.toLowerCase().replace(/^0x/, "");
    return credRefArg === refClean || credIdArg === refClean || credIdArg === opCredId || !refClean;
  });
  if (!event) throw new Error("OPERATION_RECEIPT_MISMATCH");
  if (operation.kind === "MINT") {
    const cleanDigest = details.digest?.toLowerCase().replace(/^0x/, "");
    const eventHash = String(event.args.documentHash || event.args.documentSha256 || "").toLowerCase().replace(/^0x/, "");
    if (eventHash && cleanDigest && eventHash !== cleanDigest) throw new Error("OPERATION_RECEIPT_MISMATCH");
  }
  await prisma.$transaction(async tx => {
    const claimed = await tx.credentialOperation.updateMany({ where: { id: operation.id, status: { in: ["PREPARED", "SUBMITTED"] } }, data: { status: "CONFIRMED" } });
    if (!claimed.count) return;
    await tx.credential.update({ where: { id: operation.credentialId }, data: operation.kind === "MINT" ? {
      chainId: operation.chainId, contractAddress: details.contractAddress, tokenId: String(event.args.tokenId), transactionHash: operation.transactionHash,
      metadataCid: details.metadataCid, metadataUri: details.metadataUri, blockNumber: BigInt(receipt!.blockNumber), mintedAt: new Date(),
      nftStatus: "BLOCKCHAIN_CONFIRMED", network: "Polygon Amoy", issuerWallet: operation.signerAddress, holderWallet: details.recipient,
    } : { status: "REVOKED", revokedAt: new Date(), revocationReason: details.reason } });
    const cred = await tx.credential.findUnique({ where: { id: operation.credentialId }, select: { documentId: true } });
    if (cred?.documentId && operation.kind === "MINT") {
      await tx.academicDocument.update({
        where: { id: cred.documentId },
        data: {
          credentialId: operation.credentialId,
          tokenId: String(event.args.tokenId),
          transactionHash: operation.transactionHash,
          contractAddress: details.contractAddress,
          blockNumber: BigInt(receipt!.blockNumber),
          chainId: operation.chainId,
          network: "Polygon Amoy",
          issuerWallet: operation.signerAddress,
          holderWallet: details.recipient,
          nftStatus: "BLOCKCHAIN_CONFIRMED",
          ipfsCid: details.metadataCid,
        },
      });
    }
    await tx.auditLog.create({ data: { actorId: operation.actorId, action: operation.kind === "MINT" ? "CREDENTIAL_MINTED" : "CREDENTIAL_REVOKED", entityType: "Credential", entityId: operation.credentialId, details: { operationId: operation.id, transactionHash: operation.transactionHash, tokenId: String(event.args.tokenId) } } });
  });
  return { operationId: operation.id, credentialId: operation.credentialId, status: "CONFIRMED", transactionHash: operation.transactionHash,
    tokenId: String(event.args.tokenId), chainId: operation.chainId, contractAddress: details.contractAddress, blockNumber: String(receipt.blockNumber), metadataUri: details.metadataUri };
}
