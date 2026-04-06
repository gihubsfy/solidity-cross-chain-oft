const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const endpoint = process.env.ENDPOINT_V2;
  const owner = process.env.OWNER_ADDRESS || deployer.address;
  const name = process.env.OFT_NAME || "Test Omnichain Token";
  const symbol = process.env.OFT_SYMBOL || "TOFT";
  const initialSupply = process.env.OFT_INITIAL_SUPPLY || "1000000000000000000000000";

  if (!endpoint) {
    throw new Error("Missing ENDPOINT_V2 in environment");
  }

  const Factory = await hre.ethers.getContractFactory("TestOFT");
  const oft = await Factory.deploy(name, symbol, endpoint, owner, initialSupply);
  await oft.deployed();

  console.log("network:", hre.network.name);
  console.log("deployer:", deployer.address);
  console.log("owner:", owner);
  console.log("endpoint:", endpoint);
  console.log("oft:", oft.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});