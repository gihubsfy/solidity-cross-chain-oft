const hre = require("hardhat");

function defaultRouteId() {
  return hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes(process.env.ROUTE_LABEL || "amoy-base-sepolia-direct"));
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const workflowAddress = process.env.WORKFLOW_ADDRESS;
  const swapAdapter = process.env.SWAP_ADAPTER_ADDRESS;
  const oftToken = process.env.OFT_TOKEN_ADDRESS;
  const payoutToken = process.env.PAYOUT_TOKEN_ADDRESS;
  const caller = process.env.CALLER_ADDRESS || deployer.address;
  const routeId = process.env.ROUTE_ID || defaultRouteId();

  if (!workflowAddress || !swapAdapter || !oftToken || !payoutToken) {
    throw new Error("Missing WORKFLOW_ADDRESS, SWAP_ADAPTER_ADDRESS, OFT_TOKEN_ADDRESS, or PAYOUT_TOKEN_ADDRESS");
  }

  const workflow = await hre.ethers.getContractAt("UnifiedOFTWorkflow", workflowAddress);

  await (await workflow.setCallerApproval(caller, true)).wait();
  await (await workflow.setSwapAdapterApproval(swapAdapter, true)).wait();
  await (
    await workflow.setDestinationRoute(routeId, {
      oftToken,
      payoutToken,
      swapAdapter,
      enabled: true,
    })
  ).wait();

  console.log("network:", hre.network.name);
  console.log("deployer:", deployer.address);
  console.log("caller approved:", caller);
  console.log("routeId:", routeId);
  console.log("destination route configured");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});