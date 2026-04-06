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
  const mode = (process.env.DEST_ADAPTER_MODE || "aggregator").toLowerCase();

  const workflow = await deploy("UnifiedOFTWorkflow", [owner]);

  let adapter;
  if (mode === "fixed-pair") {
    const pair = process.env.DEST_PAIR_ADDRESS;
    if (!pair) {
      throw new Error("Missing DEST_PAIR_ADDRESS for fixed-pair mode");
    }
    adapter = await deploy("FixedPairSwapAdapter", [owner, pair]);
  } else {
    adapter = await deploy("AggregatorAdapter", [owner]);
  }

  console.log("network:", hre.network.name);
  console.log("deployer:", deployer.address);
  console.log("owner:", owner);
  console.log("adapterMode:", mode);
  console.log("workflow:", workflow.address);
  console.log("destinationAdapter:", adapter.address);
  if (mode === "fixed-pair") {
    console.log("pair:", process.env.DEST_PAIR_ADDRESS);
  }
  console.log("next: set approved target/spender if aggregator mode, then init destination route");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});