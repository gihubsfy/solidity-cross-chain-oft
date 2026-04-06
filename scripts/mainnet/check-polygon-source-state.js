const hre = require("hardhat");

function routeId() {
  return process.env.ROUTE_ID || hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes(process.env.ROUTE_LABEL || "polygon-base-handl-usdt"));
}

async function main() {
  const workflowAddress = process.env.WORKFLOW_ADDRESS || "0x85B11FD310e001bD0931eE4d97e267831cdD49Df";
  const bridgeAdapterAddress = process.env.BRIDGE_ADAPTER_ADDRESS || "0x556638CB4f529e3ED7F1547b26dda3Be8b980548";
  const oftToken = process.env.OFT_TOKEN_ADDRESS || "0xf4c3fac9c98aa62474998e299495b699dfdb00eb";
  const rid = routeId();

  const workflow = await hre.ethers.getContractAt("UnifiedOFTWorkflow", workflowAddress);
  const bridge = await hre.ethers.getContractAt("LayerZeroOFTBridgeAdapter", bridgeAdapterAddress);
  const route = await workflow.sourceRoutes(rid);
  const supported = await bridge.supportedOfts(oftToken);

  console.log(JSON.stringify({
    routeId: rid,
    workflow: workflowAddress,
    bridgeAdapter: bridgeAdapterAddress,
    sourceRoute: {
      tokenIn: route.tokenIn,
      oftToken: route.oftToken,
      swapAdapter: route.swapAdapter,
      bridgeAdapter: route.bridgeAdapter,
      dstEid: route.dstEid.toString(),
      enabled: route.enabled,
    },
    supportedOft: supported,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});