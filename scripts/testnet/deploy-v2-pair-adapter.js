const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const owner = process.env.OWNER_ADDRESS || deployer.address;
  const factory = process.env.FACTORY_ADDRESS;

  if (!factory) {
    throw new Error("Missing FACTORY_ADDRESS");
  }

  const Factory = await hre.ethers.getContractFactory("V2PairSwapAdapter");
  const adapter = await Factory.deploy(owner, factory);
  await adapter.deployed();

  console.log("network:", hre.network.name);
  console.log("deployer:", deployer.address);
  console.log("owner:", owner);
  console.log("factory:", factory);
  console.log("adapter:", adapter.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});