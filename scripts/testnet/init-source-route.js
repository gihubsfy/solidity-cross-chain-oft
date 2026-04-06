const hre = require("hardhat");

function defaultRouteId() {
  return hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes(process.env.ROUTE_LABEL || "amoy-base-sepolia-direct"));
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const workflowAddress = process.env.WORKFLOW_ADDRESS;
  const swapAdapter = process.env.SWAP_ADAPTER_ADDRESS;
  const bridgeAdapter = process.env.BRIDGE_ADAPTER_ADDRESS;
  const tokenIn = process.env.TOKEN_IN_ADDRESS;
  const oftToken = process.env.OFT_TOKEN_ADDRESS;
  const dstEid = Number(process.env.DST_EID || "40245");
  const caller = process.env.CALLER_ADDRESS || deployer.address;
  const routeId = process.env.ROUTE_ID || defaultRouteId();

  if (!workflowAddress || !swapAdapter || !bridgeAdapter || !tokenIn || !oftToken || !dstEid) {
    throw new Error("Missing WORKFLOW_ADDRESS, SWAP_ADAPTER_ADDRESS, BRIDGE_ADAPTER_ADDRESS, TOKEN_IN_ADDRESS, OFT_TOKEN_ADDRESS, or DST_EID");
  }

  const workflow = await hre.ethers.getContractAt("UnifiedOFTWorkflow", workflowAddress);
  const bridge = await hre.ethers.getContractAt("LayerZeroOFTBridgeAdapter", bridgeAdapter);

  await (await workflow.setCallerApproval(caller, true)).wait();
  await (await workflow.setSwapAdapterApproval(swapAdapter, true)).wait();
  await (await workflow.setBridgeAdapterApproval(bridgeAdapter, true)).wait();
  await (await bridge.setSupportedOft(oftToken, true)).wait();
  await (
    await workflow.setSourceRoute(routeId, {
      tokenIn,
      oftToken,
      swapAdapter,
      bridgeAdapter,
      dstEid,
      enabled: true,
    })
  ).wait();

  console.log("network:", hre.network.name);
  console.log("deployer:", deployer.address);
  console.log("caller approved:", caller);
  console.log("routeId:", routeId);
  console.log("source route configured");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});