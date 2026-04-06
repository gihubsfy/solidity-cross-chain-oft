const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const adapterAddress = process.env.AGGREGATOR_ADAPTER_ADDRESS;
  const target = process.env.AGGREGATOR_TARGET_ADDRESS;
  const spender = process.env.AGGREGATOR_SPENDER_ADDRESS;

  if (!adapterAddress || !target || !spender) {
    throw new Error("Missing AGGREGATOR_ADAPTER_ADDRESS, AGGREGATOR_TARGET_ADDRESS, or AGGREGATOR_SPENDER_ADDRESS");
  }

  const adapter = await hre.ethers.getContractAt("AggregatorAdapter", adapterAddress);
  await (await adapter.setApprovedTarget(target, true)).wait();
  await (await adapter.setApprovedSpender(spender, true)).wait();

  console.log("network:", hre.network.name);
  console.log("deployer:", deployer.address);
  console.log("aggregatorAdapter:", adapterAddress);
  console.log("approvedTarget:", target);
  console.log("approvedSpender:", spender);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});