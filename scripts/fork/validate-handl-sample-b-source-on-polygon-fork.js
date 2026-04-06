const hre = require("hardhat");
const { replayTransactionOnFork } = require("./replay-utils");

const POLYGON_SOURCE_TX = "0x3a9c899228a2623593b2354ccb43908f5cc2e81f6e187f4bf2d16fcd8e151d26";
const USER = "0x3e0954d9b32f823aff2f66173ffed5f453dedd93";
const POLYGON_USDT = "0xc2132d05d31c914a87c6611c10748aeb04b58e8f";
const POLYGON_USDC = "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359";
const POLYGON_HANDL = "0xf4c3fac9c98aa62474998e299495b699dfdb00eb";
const QUICKSWAP_ROUTER = "0xa5e0829caced8ffdd4de3c43696c57f7d7a678ff";

async function main() {
  const source = await replayTransactionOnFork({
    chain: "polygon",
    txHash: POLYGON_SOURCE_TX,
    watchTokens: [POLYGON_USDT, POLYGON_USDC, POLYGON_HANDL],
    watchAccounts: [USER],
  });

  const [deployer] = await hre.ethers.getSigners();
  const Workflow = await hre.ethers.getContractFactory("UnifiedOFTWorkflow");
  const workflow = await Workflow.deploy(deployer.address);
  await workflow.deployed();

  const SwapAdapter = await hre.ethers.getContractFactory("UniswapV2SwapAdapter");
  const swapAdapter = await SwapAdapter.deploy(deployer.address, QUICKSWAP_ROUTER);
  await swapAdapter.deployed();

  const Bridge = await hre.ethers.getContractFactory("ForkBridgeRecorderAdapter");
  const bridge = await Bridge.deploy(deployer.address);
  await bridge.deployed();

  const routeId = hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes("fork-polygon-handl-sample-b"));
  await (await workflow.setCallerApproval(USER, true)).wait();
  await (await workflow.setSwapAdapterApproval(swapAdapter.address, true)).wait();
  await (await workflow.setBridgeAdapterApproval(bridge.address, true)).wait();
  await (
    await workflow.setSourceRoute(routeId, {
      tokenIn: POLYGON_USDT,
      oftToken: POLYGON_HANDL,
      swapAdapter: swapAdapter.address,
      bridgeAdapter: bridge.address,
      dstEid: 40245,
      enabled: true,
    })
  ).wait();

  await hre.network.provider.request({ method: "hardhat_setBalance", params: [USER, "0x3635C9ADC5DEA00000"] });
  await hre.network.provider.request({ method: "hardhat_impersonateAccount", params: [USER] });
  const user = await hre.ethers.getSigner(USER);

  const tokenIn = await hre.ethers.getContractAt([
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address owner) view returns (uint256)"
  ], POLYGON_USDT, user);

  const amountIn = hre.ethers.BigNumber.from("10000000");
  await (await tokenIn.approve(workflow.address, amountIn)).wait();

  const path = hre.ethers.utils.defaultAbiCoder.encode(["address[]"], [[POLYGON_USDT, POLYGON_USDC, POLYGON_HANDL]]);
  const recipient = hre.ethers.utils.hexZeroPad(USER, 32);
  const options = "0x000301001101000000000000000000000000000000c350";

  const tx = await workflow.connect(user).swapAndBridge(routeId, amountIn, 1, recipient, path, options, "0x", { value: 0 });
  const receipt = await tx.wait();

  const lastReq = await bridge.lastRequest();
  await hre.network.provider.request({ method: "hardhat_stopImpersonatingAccount", params: [USER] });

  console.log(JSON.stringify({
    replay: source,
    deployedWorkflow: workflow.address,
    deployedSwapAdapter: swapAdapter.address,
    deployedBridgeRecorder: bridge.address,
    bridgeRecordedToken: lastReq.token,
    bridgeRecordedAmount: lastReq.amountLD.toString(),
    forkValidationTx: receipt.transactionHash,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
