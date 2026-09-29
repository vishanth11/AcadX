import { ethers, network } from "hardhat";
import fs from "node:fs";
import path from "node:path";

async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();
  const factory = await ethers.getContractFactory("AcademicCredentialNFT");
  const contract = await factory.deploy(deployer.address);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const tx = await contract.authorizeIssuer(deployer.address);
  await tx.wait();
  const manifest = {
    contractName: "AcademicCredentialNFT",
    address,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    network: network.name,
    deployer: deployer.address,
    deploymentTransaction: contract.deploymentTransaction()?.hash ?? null,
    deployedAt: new Date().toISOString(),
  };
  const outPath = path.resolve(__dirname, "..", "deployments", `${network.name}.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: "w" });
  console.log(`AcademicCredentialNFT deployed at ${address} on ${network.name}; manifest: ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
