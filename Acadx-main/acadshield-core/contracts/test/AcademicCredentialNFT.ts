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

  it("mints token IDs from contract state and anchors the supplied file digest", async function () {
    const { issuer, holder, contract } = await deploy();
    const credentialRef = ethers.keccak256(ethers.toUtf8Bytes("credential-1"));
    const documentHash = ethers.sha256(ethers.toUtf8Bytes("original document bytes"));
    const tx = await contract.connect(issuer).mintCredential(holder.address, credentialRef, documentHash, "ipfs://metadata-cid");
    await expect(tx).to.emit(contract, "CredentialMinted").withArgs(credentialRef, 1, holder.address, documentHash, "ipfs://metadata-cid");
    expect(await contract.ownerOf(1)).to.equal(holder.address);
    expect(await contract.tokenForCredential(credentialRef)).to.equal(1);
    expect(await contract.isCredentialValid(credentialRef, documentHash)).to.equal(true);
    expect(await contract.isCredentialValid(credentialRef, ethers.ZeroHash)).to.equal(false);
  });

  it("rejects unauthorized minting and holder transfers", async function () {
    const { holder, other, contract } = await deploy();
    const credentialRef = ethers.keccak256(ethers.toUtf8Bytes("credential-2"));
    const documentHash = ethers.sha256(ethers.toUtf8Bytes("bytes"));
    await expect(contract.connect(holder).mintCredential(holder.address, credentialRef, documentHash, "ipfs://cid"))
      .to.be.reverted;
    const [, issuer] = await ethers.getSigners();
    await contract.connect(issuer).mintCredential(holder.address, credentialRef, documentHash, "ipfs://cid");
    await expect(contract.connect(holder).transferFrom(holder.address, other.address, 1))
      .to.be.revertedWithCustomError(contract, "NonTransferable");
  });

  it("supports issuer revocation without deleting the token", async function () {
    const { issuer, holder, contract } = await deploy();
    const credentialRef = ethers.keccak256(ethers.toUtf8Bytes("credential-3"));
    const documentHash = ethers.sha256(ethers.toUtf8Bytes("bytes"));
    await contract.connect(issuer).mintCredential(holder.address, credentialRef, documentHash, "ipfs://cid");
    await expect(contract.connect(issuer).revokeCredential(credentialRef)).to.emit(contract, "CredentialRevoked");
    expect(await contract.isCredentialValid(credentialRef, documentHash)).to.equal(false);
    expect(await contract.ownerOf(1)).to.equal(holder.address);
  });
});
