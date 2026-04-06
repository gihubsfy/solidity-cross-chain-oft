const hre = require("hardhat");

function defaultRouteId() {
  return hre.ethers.utils.keccak256(
    hre.ethers.utils.toUtf8Bytes(process.env.ROUTE_LABEL || "amoy-base-sepolia-direct")
  );
}

async function main() {
  const workflowAddress = process.env.WORKFLOW_ADDRESS;
  const routeId = process.env.ROUTE_ID || defaultRouteId();
  const mode = process.env.ROUTE_MODE;
  const swapAdapter = process.env.SWAP_ADAPTER_ADDRESS;

  if (!workflowAddress || !mode || !swapAdapter) {
    throw new Error("Missing WORKFLOW_ADDRESS, ROUTE_MODE, or SWAP_ADAPTER_ADDRESS");
  }

  const workflow = await hre.ethers.getContractAt("UnifiedOFTWorkflow", workflowAddress);

  await (await workflow.setSwapAdapterApproval(swapAdapter, true)).wait();

  if (mode === "source") {
    const bridgeAdapter = process.env.BRIDGE_ADAPTER_ADDRESS;
    const tokenIn = process.env.TOKEN_IN_ADDRESS;
    const oftToken = process.env.OFT_TOKEN_ADDRESS;
    const dstEid = Number(process.env.DST_EID);
    if (!bridgeAdapter || !tokenIn || !oftToken || !dstEid) {
      throw new Error("Missing source route env values");
    }
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
  } else if (mode === "destination") {
    const oftToken = process.env.OFT_TOKEN_ADDRESS;
    const payoutToken = process.env.PAYOUT_TOKEN_ADDRESS;
    if (!oftToken || !payoutToken) {
      throw new Error("Missing destination route env values");
    }
    await (
      await workflow.setDestinationRoute(routeId, {
        oftToken,
        payoutToken,
        swapAdapter,
        enabled: true,
      })
    ).wait();
  } else {
    throw new Error("ROUTE_MODE must be source or destination");
  }

  console.log("network:", hre.network.name);
  console.log("routeId:", routeId);
  console.log("mode:", mode);
  console.log("swapAdapter:", swapAdapter);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});