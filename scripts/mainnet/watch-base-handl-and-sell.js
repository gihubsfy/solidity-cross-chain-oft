const hre = require("hardhat");

function routeId() {
  return process.env.ROUTE_ID || hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes(process.env.ROUTE_LABEL || "polygon-base-handl-usdt"));
}

function encodePath(pathAddresses) {
  return hre.ethers.utils.defaultAbiCoder.encode(["address[]"], [pathAddresses]);
}

function bn(value) {
  return hre.ethers.BigNumber.from(value);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getExpectedAmountOut(pairAddress, tokenIn, tokenOut, amountIn, provider) {
  const pair = await hre.ethers.getContractAt(
    [
      "function token0() external view returns (address)",
      "function token1() external view returns (address)",
      "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
    ],
    pairAddress,
    provider
  );

  const token0 = await pair.token0();
  const [reserve0, reserve1] = await pair.getReserves();
  let reserveIn;
  let reserveOut;
  if (token0.toLowerCase() === tokenIn.toLowerCase()) {
    reserveIn = reserve0;
    reserveOut = reserve1;
  } else {
    reserveIn = reserve1;
    reserveOut = reserve0;
  }

  const amountInWithFee = amountIn.mul(997);
  const numerator = amountInWithFee.mul(reserveOut);
  const denominator = reserveIn.mul(1000).add(amountInWithFee);
  return numerator.div(denominator);
}

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const workflowAddress = process.env.WORKFLOW_ADDRESS || "0x85B11FD310e001bD0931eE4d97e267831cdD49Df";
  const oftTokenAddress = process.env.OFT_TOKEN_ADDRESS || "0x3bbcb624cb9a1f73163a886f460f47603e5e4425";
  const payoutTokenAddress = process.env.PAYOUT_TOKEN_ADDRESS || "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
  const pairAddress = process.env.DEST_PAIR_ADDRESS || "0x186696a647c554c7dbea30e295259aa46d40effc";
  const recipient = process.env.RECIPIENT_ADDRESS || signer.address;
  const watchAddress = process.env.WATCH_ADDRESS || signer.address;
  const minWatchAmount = bn(process.env.MIN_WATCH_AMOUNT || "1");
  const slippageBps = Number(process.env.SELL_SLIPPAGE_BPS || "500");
  const pollMs = Number(process.env.POLL_INTERVAL_MS || "15000");
  const maxPolls = Number(process.env.MAX_POLLS || "120");
  const rid = routeId();

  if (watchAddress.toLowerCase() !== signer.address.toLowerCase()) {
    throw new Error("WATCH_ADDRESS must equal signer address for automated sell");
  }

  const workflow = await hre.ethers.getContractAt("UnifiedOFTWorkflow", workflowAddress);
  const oftToken = await hre.ethers.getContractAt([
    "function balanceOf(address owner) view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)"
  ], oftTokenAddress);
  const payoutToken = await hre.ethers.getContractAt([
    "function balanceOf(address owner) view returns (uint256)"
  ], payoutTokenAddress);

  const swapData = encodePath([oftTokenAddress, payoutTokenAddress]);

  for (let i = 0; i < maxPolls; i += 1) {
    const balance = await oftToken.balanceOf(watchAddress);
    const payoutBefore = await payoutToken.balanceOf(recipient);
    console.log(`[watch] poll=${i + 1}/${maxPolls} oft=${balance.toString()} payout=${payoutBefore.toString()}`);

    if (balance.gte(minWatchAmount) && !balance.isZero()) {
      const expectedOut = await getExpectedAmountOut(pairAddress, oftTokenAddress, payoutTokenAddress, balance, hre.ethers.provider);
      const minAmountOut = expectedOut.mul(10000 - slippageBps).div(10000);

      await (await oftToken.approve(workflowAddress, balance)).wait();
      const tx = await workflow.swapReceivedOFT(rid, balance, minAmountOut, recipient, swapData);
      const receipt = await tx.wait();
      const payoutAfter = await payoutToken.balanceOf(recipient);

      console.log(JSON.stringify({
        network: hre.network.name,
        signer: signer.address,
        routeId: rid,
        soldAmount: balance.toString(),
        expectedOut: expectedOut.toString(),
        minAmountOut: minAmountOut.toString(),
        payoutBefore: payoutBefore.toString(),
        payoutAfter: payoutAfter.toString(),
        txHash: receipt.transactionHash,
      }, null, 2));
      return;
    }

    await sleep(pollMs);
  }

  throw new Error(`Timed out waiting for OFT balance on ${watchAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});