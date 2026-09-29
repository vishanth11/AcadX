import { expect } from "chai";
import { ethers } from "hardhat";

describe("AcademicCredentialNFT", function () {
  async function deploy() {
    const [admin, issuer, holder, other] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("AcademicCredentialNFT");
    const contract = await factory.deploy(admin.address);
    await contract.waitForDeployment();
    await contract.connect(admin).authorizeIssuer(issuer.address);
    return { admin, issuer, holder, other, contract };
  }

  it("mints token IDs from contract state, maintains full credential relationship and emits CredentialMinted", async function () {
    const { issuer, holder, contract } = await deploy();
    const credentialId = "b2dbdaf9-a002-4eb7-b087-8d03745be233";
    const documentHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    const metadataUri = "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";

    const tx = await contract.connect(issuer)["mintCredential(address,string,string,string)"](
      holder.address,
      credentialId,
      documentHash,
      metadataUri
    );

    // Verify event matches CredentialMinted(tokenId, credentialId, issuer, holder, documentHash)
    await expect(tx).to.emit(contract, "CredentialMinted").withArgs(1, credentialId, issuer.address, holder.address, documentHash);

    // Verify token ownership & lookup
    expect(await contract.ownerOf(1)).to.equal(holder.address);
    expect(await contract.tokenForCredentialId(credentialId)).to.equal(1);
    expect(await contract.tokenURI(1)).to.equal(metadataUri);

    // Verify full relationship mapping on-chain
    const record = await contract.getCredentialRecord(1);
    expect(record.tokenId).to.equal(1);
    expect(record.credentialId).to.equal(credentialId);
    expect(record.documentHash).to.equal(documentHash);
    expect(record.issuer).to.equal(issuer.address);
    expect(record.holder).to.equal(holder.address);
    expect(record.metadataURI).to.equal(metadataUri);
    expect(record.revoked).to.equal(false);

    // Verify validity checks
    expect(await contract["isCredentialValid(string,string)"](credentialId, documentHash)).to.equal(true);
    expect(await contract["isCredentialValid(string,string)"](credentialId, "wronghash")).to.equal(false);
  });

  it("rejects unauthorized minting and holder transfers", async function () {
    const { holder, other, contract } = await deploy();
    const credentialId = "cred-unauth";
    const documentHash = "hash-unauth";
    await expect(contract.connect(holder)["mintCredential(address,string,string,string)"](holder.address, credentialId, documentHash, "ipfs://cid"))
      .to.be.reverted;

    const [, issuer] = await ethers.getSigners();
    await contract.connect(issuer)["mintCredential(address,string,string,string)"](holder.address, credentialId, documentHash, "ipfs://cid");
    await expect(contract.connect(holder).transferFrom(holder.address, other.address, 1))
      .to.be.revertedWithCustomError(contract, "NonTransferable");
  });

  it("supports issuer revocation without deleting the token", async function () {
    const { issuer, holder, contract } = await deploy();
    const credentialId = "cred-revoke-test";
    const documentHash = "hash-revoke-test";
    await contract.connect(issuer)["mintCredential(address,string,string,string)"](holder.address, credentialId, documentHash, "ipfs://cid");
    await expect(contract.connect(issuer)["revokeCredential(string)"](credentialId))
      .to.emit(contract, "CredentialRevoked")
      .withArgs(1, credentialId, issuer.address);

    expect(await contract["isCredentialValid(string,string)"](credentialId, documentHash)).to.equal(false);
    expect(await contract.ownerOf(1)).to.equal(holder.address);
  });
});
