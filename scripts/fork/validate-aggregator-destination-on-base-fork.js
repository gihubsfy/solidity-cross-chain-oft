const fs = require("fs");
const hre = require("hardhat");
const { ethers } = hre;

const USER = process.env.FORK_USER || "0xa4463789e8f3c6a599b3dfb608dde55513bcf289";
const ROUTE_NAME = process.env.ROUTE_NAME || "fork-base-aggregator-route";
const PAYLOAD_FILE = process.env.PAYLOAD_FILE || "base_zro_to_usdc_swap.json";
const TOKEN_IN = process.env.TOKEN_IN || "0x6985884c4392d348587b19cb9eaaf157f13271cd";
const TOKEN_OUT = process.env.TOKEN_OUT || "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";

function readPayload() {
  return JSON.parse(fs.readFileSync(PAYLOAD_FILE, "utf8").replace(/^\uFEFF/, ""));
}

async function main() {
  const payload = readPayload();
  const swapData = payload.data?.[0];
  if (!swapData || !swapData.tx || !swapData.routerResult) {
    throw new Error(`Invalid payload file: ${PAYLOAD_FILE}`);
  }

  const forkBlock = Number(process.env.FORK_BLOCK || swapData.routerResult.contextSlot || 0);
  if (!forkBlock) {
    throw new Error("Missing FORK_BLOCK and payload does not provide routerResult.contextSlot");
  }

  const rpcUrl = process.env.BASE_MAINNET_RPC_URL || "https://mainnet.base.org";
  await hre.network.provider.request({
    method: "hardhat_reset",
    params: [{ forking: { jsonRpcUrl: rpcUrl, blockNumber: forkBlock } }],
  });

  const [deployer] = await ethers.getSigners();
  const Workflow = await ethers.getContractFactory("UnifiedOFTWorkflow");
  const workflow = await Workflow.deploy(deployer.address);
  await workflow.deployed();

  const SwapAdapter = await ethers.getContractFactory("AggregatorAdapter");
  const swapAdapter = await SwapAdapter.deploy(deployer.address);
  await swapAdapter.deployed();

  const target = swapData.tx.to;
  const spender = process.env.AGGREGATOR_SPENDER || target;
  await (await swapAdapter.setApprovedTarget(target, true)).wait();
  await (await swapAdapter.setApprovedSpender(spender, true)).wait();

  const routeId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(ROUTE_NAME));
  await (await workflow.setCallerApproval(USER, true)).wait();
  await (await workflow.setSwapAdapterApproval(swapAdapter.address, true)).wait();
  await (
    await workflow.setDestinationRoute(routeId, {
      oftToken: TOKEN_IN,
      payoutToken: TOKEN_OUT,
      swapAdapter: swapAdapter.address,
      enabled: true,
    })
  ).wait();

  await hre.network.provider.request({ method: "hardhat_setBalance", params: [USER, "0x3635C9ADC5DEA00000"] });
  await hre.network.provider.request({ method: "hardhat_impersonateAccount", params: [USER] });
  const user = await ethers.getSigner(USER);

  const tokenIn = await ethers.getContractAt(
    [
      "function approve(address spender, uint256 amount) external returns (bool)",
      "function balanceOf(address owner) view returns (uint256)",
    ],
    TOKEN_IN,
    user
  );

  const tokenOut = await ethers.getContractAt([
    "function balanceOf(address owner) view returns (uint256)"
  ], TOKEN_OUT, user);

  const amountIn = ethers.BigNumber.from(process.env.AMOUNT_IN || swapData.routerResult.fromTokenAmount);
  const userTokenInBefore = await tokenIn.balanceOf(USER);
  const userTokenOutBefore = await tokenOut.balanceOf(USER);
  if (userTokenInBefore.lt(amountIn)) {
    throw new Error(`User ${USER} token balance ${userTokenInBefore.toString()} is lower than required amount ${amountIn.toString()}`);
  }

  await (await tokenIn.approve(workflow.address, amountIn)).wait();

  const encodedExec = ethers.utils.defaultAbiCoder.encode(
    ["tuple(address spender,address target,uint256 value,bytes callData)"],
    [[spender, target, ethers.BigNumber.from(swapData.tx.value || "0"), swapData.tx.data]]
  );

  const minAmountOut = ethers.BigNumber.from(process.env.MIN_AMOUNT_OUT || "1");
  const tx = await workflow.connect(user).swapReceivedOFT(routeId, amountIn, minAmountOut, USER, encodedExec);
  const receipt = await tx.wait();

  const userTokenInAfter = await tokenIn.balanceOf(USER);
  const userTokenOutAfter = await tokenOut.balanceOf(USER);
  await hre.network.provider.request({ method: "hardhat_stopImpersonatingAccount", params: [USER] });

  console.log(JSON.stringify({
    forkBlock,
    rpcUrl,
    payloadFile: PAYLOAD_FILE,
    user: USER,
    tokenIn: TOKEN_IN,
    tokenOut: TOKEN_OUT,
    amountIn: amountIn.toString(),
    approvedTarget: target,
    approvedSpender: spender,
    deployedWorkflow: workflow.address,
    deployedAggregatorAdapter: swapAdapter.address,
    userTokenInBefore: userTokenInBefore.toString(),
    userTokenInAfter: userTokenInAfter.toString(),
    userTokenOutBefore: userTokenOutBefore.toString(),
    userTokenOutAfter: userTokenOutAfter.toString(),
    validationTx: receipt.transactionHash,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
