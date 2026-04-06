const hre = require("hardhat");

async function deploy(name, args = []) {
  const Factory = await hre.ethers.getContractFactory(name);
  const contract = await Factory.deploy(...args);
  await contract.deployed();
  return contract;
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const owner = process.env.OWNER_ADDRESS || deployer.address;

  const workflow = await deploy("UnifiedOFTWorkflow", [owner]);
  const bridgeAdapter = await deploy("LayerZeroOFTBridgeAdapter", [owner]);
  const aggregatorAdapter = await deploy("AggregatorAdapter", [owner]);

  console.log("network:", hre.network.name);
  console.log("deployer:", deployer.address);
  console.log("owner:", owner);
  console.log("workflow:", workflow.address);
  console.log("bridgeAdapter:", bridgeAdapter.address);
  console.log("aggregatorAdapter:", aggregatorAdapter.address);
  console.log("next: set approved target/spender on aggregatorAdapter, set supported OFT on bridgeAdapter, then init source route");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});