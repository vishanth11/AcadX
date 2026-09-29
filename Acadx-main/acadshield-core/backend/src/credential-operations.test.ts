import { CredentialOperation, PrismaClient } from "@prisma/client";
import { Interface, JsonRpcProvider, Wallet } from "ethers";
import { prepareOperation, settleOperation } from "./credential-operations";

const client = { $transaction: jest.fn(), $queryRaw: jest.fn(), credentialOperation: { findFirst: jest.fn(), create: jest.fn(), updateMany: jest.fn() }, credential: { findUnique: jest.fn(), update: jest.fn() }, auditLog: { create: jest.fn() } };
const provider = { getNetwork: jest.fn(), getTransactionReceipt: jest.fn(), broadcastTransaction: jest.fn(), waitForTransaction: jest.fn() };
const address = "0x" + "11".repeat(20), reference = "0x" + "22".repeat(32);
const abi = ["event CredentialRevoked(bytes32 indexed credentialRef, uint256 indexed tokenId, address indexed issuer)"];
const operation = { id: "operation", credentialId: "credential", institutionId: "institution", actorId: "actor", kind: "REVOKE", chainId: 1, status: "PREPARED", rawTransaction: "0xab", transactionHash: "0xhash", details: { contractAddress: address, reference, reason: "Issuer correction" } } as unknown as CredentialOperation;
beforeEach(() => {
  client.$transaction.mockImplementation(async fn => fn(client));
  client.credential.findUnique.mockResolvedValue({ status: "ACTIVE", institutionId: "institution" });
  client.credentialOperation.findFirst.mockResolvedValue(null);
  client.credentialOperation.updateMany.mockResolvedValue({ count: 1 });
  client.credentialOperation.create.mockImplementation(async ({ data }) => ({ id: "operation", ...data }));
  provider.getNetwork.mockResolvedValue({ chainId: 1n });
  provider.getTransactionReceipt.mockResolvedValue(null);
  provider.waitForTransaction.mockResolvedValue(null);
});
it("persists signed bytes and reserves nonce before any broadcast", async () => {
  const signer = { address, getNonce: jest.fn().mockResolvedValue(7), populateTransaction: jest.fn().mockResolvedValue({}), signTransaction: jest.fn().mockResolvedValue("0xab") };
  const prepared = await prepareOperation(client as unknown as PrismaClient, signer as unknown as Wallet, { credentialId: "credential", institutionId: "institution", actorId: "actor", kind: "REVOKE", chainId: 1, details: { contractAddress: address, reference }, transaction: {} });
  expect(prepared.rawTransaction).toBe("0xab"); expect(prepared.nonce).toBe(7);
  expect(client.$queryRaw).toHaveBeenCalledTimes(2);
  expect(provider.broadcastTransaction).not.toHaveBeenCalled();
});
it("rejects a second operation on the same credential before signing", async () => {
  client.credentialOperation.findFirst.mockResolvedValue({ id: "previous" });
  const signer = { address, signTransaction: jest.fn() };
  await expect(prepareOperation(client as unknown as PrismaClient, signer as unknown as Wallet, { credentialId: "credential", institutionId: "institution", actorId: "actor", kind: "MINT", chainId: 1, details: { contractAddress: address, reference }, transaction: {} })).rejects.toThrow("OPERATION_PENDING:previous");
  expect(signer.signTransaction).not.toHaveBeenCalled();
});
it("replays identical saved bytes after a lost RPC acknowledgement", async () => {
  provider.broadcastTransaction.mockRejectedValue(new Error("timeout"));
  const result = await settleOperation(client as unknown as PrismaClient, operation, provider as unknown as JsonRpcProvider, abi, true);
  expect(result.status).toBe("PENDING"); expect(provider.broadcastTransaction).toHaveBeenCalledWith("0xab");
  expect(client.credential.update).not.toHaveBeenCalled();
});
it("records reverted receipts without changing credential state", async () => {
  provider.getTransactionReceipt.mockResolvedValue({ status: 0, confirmations: async () => 2 });
  expect((await settleOperation(client as unknown as PrismaClient, operation, provider as unknown as JsonRpcProvider, abi, true)).status).toBe("FAILED");
  expect(client.credential.update).not.toHaveBeenCalled();
});
it("rejects a receipt without the expected contract event", async () => {
  provider.getTransactionReceipt.mockResolvedValue({ status: 1, confirmations: async () => 2, logs: [] });
  await expect(settleOperation(client as unknown as PrismaClient, operation, provider as unknown as JsonRpcProvider, abi, true)).rejects.toThrow("OPERATION_RECEIPT_MISMATCH");
  expect(client.credential.update).not.toHaveBeenCalled();
});
it("commits the lifecycle change and audit event with journal completion", async () => {
  const iface = new Interface(abi);
  const log = iface.encodeEventLog(iface.getEvent("CredentialRevoked")!, [reference, 1, address]);
  provider.getTransactionReceipt.mockResolvedValue({ status: 1, confirmations: async () => 2, logs: [{ ...log, address }], blockNumber: 123 });
  expect((await settleOperation(client as unknown as PrismaClient, operation, provider as unknown as JsonRpcProvider, abi, true)).status).toBe("CONFIRMED");
  expect(client.$transaction).toHaveBeenCalledTimes(1);
  expect(client.credential.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "REVOKED" }) }));
  expect(client.auditLog.create).toHaveBeenCalled(); expect(provider.broadcastTransaction).not.toHaveBeenCalled();
});
it("does not apply a completed operation twice", async () => {
  expect((await settleOperation(client as unknown as PrismaClient, { ...operation, status: "CONFIRMED" }, provider as unknown as JsonRpcProvider, abi, true)).status).toBe("CONFIRMED");
  expect(provider.getNetwork).not.toHaveBeenCalled(); expect(client.credential.update).not.toHaveBeenCalled();
});
