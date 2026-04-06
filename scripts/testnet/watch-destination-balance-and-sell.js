const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

function routeId() {
  return process.env.ROUTE_ID || hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes(process.env.ROUTE_LABEL || "amoy-base-sepolia-direct"));
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

function transferTopic() {
  return hre.ethers.utils.id("Transfer(address,address,uint256)");
}

function normalizeAddressTopic(address) {
  return hre.ethers.utils.hexZeroPad(address.toLowerCase(), 32).toLowerCase();
}

function makeState() {
  return {
    lastSeenBalance: "0",
    lastCheckedAt: "",
    lastScannedBlock: 0,
    pending: [],
    processedIncoming: {},
  };
}

function loadState(file) {
  if (!fs.existsSync(file)) {
    return makeState();
  }

  const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  return {
    ...makeState(),
    ...parsed,
    pending: Array.isArray(parsed.pending) ? parsed.pending : [],
    processedIncoming: parsed.processedIncoming || {},
  };
}

function saveState(file, state) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(state, null, 2));
}

async function getExpectedAmountOut(factoryAddress, tokenIn, tokenOut, amountIn, provider) {
  const factory = await hre.ethers.getContractAt(
    ["function getPair(address,address) external view returns (address)"],
    factoryAddress,
    provider
  );
  const pairAddress = await factory.getPair(tokenIn, tokenOut);
  if (pairAddress === hre.ethers.constants.AddressZero) {
    throw new Error("Pair not found for token path");
  }

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

async function findNewIncomingTransfers(provider, oftTokenAddress, watchAddress, fromBlock, toBlock) {
  if (fromBlock > toBlock) {
    return [];
  }

  const logs = await provider.getLogs({
    address: oftTokenAddress,
    fromBlock,
    toBlock,
    topics: [transferTopic(), null, normalizeAddressTopic(watchAddress)],
  });

  return logs.map((log) => {
    const amount = bn(log.data);
    return {
      incomingTxHash: log.transactionHash,
      blockNumber: log.blockNumber,
      amount: amount.toString(),
      status: "detected",
      attempts: 0,
      sellTxHash: "",
      soldAmount: "0",
      expectedOut: "0",
      minAmountOut: "0",
      error: "",
      detectedAt: new Date().toISOString(),
      soldAt: "",
    };
  });
}

async function processPending({
  state,
  stateFile,
  provider,
  workflow,
  oftToken,
  payoutToken,
  factoryAddress,
  oftTokenAddress,
  payoutTokenAddress,
  recipient,
  rid,
  swapData,
  slippageBps,
  maxRetries,
}) {
  for (const item of state.pending) {
    if (item.status === "sold" || item.status === "skipped" || item.status === "failed-max-retries") {
      continue;
    }

    if (item.attempts >= maxRetries) {
      item.status = "failed-max-retries";
      continue;
    }

    const currentBalance = await oftToken.balanceOf(recipient);
    if (currentBalance.isZero()) {
      item.status = "waiting-balance";
      continue;
    }

    try {
      const amountToSell = currentBalance;
      const expectedOut = await getExpectedAmountOut(factoryAddress, oftTokenAddress, payoutTokenAddress, amountToSell, provider);
      const minAmountOut = expectedOut.mul(10000 - slippageBps).div(10000);

      item.attempts += 1;
      item.status = "selling";
      item.soldAmount = amountToSell.toString();
      item.expectedOut = expectedOut.toString();
      item.minAmountOut = minAmountOut.toString();
      saveState(stateFile, state);

      await (await oftToken.approve(workflow.address, amountToSell)).wait();
      const tx = await workflow.swapReceivedOFT(rid, amountToSell, minAmountOut, recipient, swapData);
      const receipt = await tx.wait();

      const payoutAfter = await payoutToken.balanceOf(recipient);
      item.sellTxHash = receipt.transactionHash;
      item.status = "sold";
      item.soldAt = new Date().toISOString();
      item.error = "";
      state.processedIncoming[item.incomingTxHash] = {
        sellTxHash: receipt.transactionHash,
        soldAmount: amountToSell.toString(),
        expectedOut: expectedOut.toString(),
        minAmountOut: minAmountOut.toString(),
        payoutAfter: payoutAfter.toString(),
        soldAt: item.soldAt,
      };
      saveState(stateFile, state);
    } catch (error) {
      item.attempts += 1;
      item.status = "retrying";
      item.error = String(error && error.message ? error.message : error);
      saveState(stateFile, state);
    }
  }
}

async function main() {
  const [signer] = await hre.ethers.getSigners();

  const workflowAddress = process.env.WORKFLOW_ADDRESS;
  const oftTokenAddress = process.env.OFT_TOKEN_ADDRESS;
  const payoutTokenAddress = process.env.PAYOUT_TOKEN_ADDRESS;
  const factoryAddress = process.env.FACTORY_ADDRESS;
  const recipient = process.env.RECIPIENT_ADDRESS || signer.address;
  const watchAddress = process.env.WATCH_ADDRESS || signer.address;
  const stateFile = process.env.WATCH_STATE_FILE || path.join("scripts", "testnet", "state", `${hre.network.name}-watcher.json`);
  const pollMs = Number(process.env.POLL_INTERVAL_MS || "15000");
  const minWatchAmount = bn(process.env.MIN_WATCH_AMOUNT || "1");
  const slippageBps = Number(process.env.SELL_SLIPPAGE_BPS || "500");
  const once = (process.env.WATCH_ONCE || "false").toLowerCase() === "true";
  const maxRetries = Number(process.env.MAX_SELL_RETRIES || "3");

  if (!workflowAddress || !oftTokenAddress || !payoutTokenAddress || !factoryAddress) {
    throw new Error("Missing WORKFLOW_ADDRESS, OFT_TOKEN_ADDRESS, PAYOUT_TOKEN_ADDRESS, or FACTORY_ADDRESS");
  }

  if (watchAddress.toLowerCase() !== signer.address.toLowerCase()) {
    throw new Error("WATCH_ADDRESS must be the same as the signer address for automatic selling");
  }

  const workflow = await hre.ethers.getContractAt("UnifiedOFTWorkflow", workflowAddress);
  const oftToken = await hre.ethers.getContractAt(
    ["function balanceOf(address) view returns (uint256)", "function approve(address spender, uint256 amount) external returns (bool)"],
    oftTokenAddress
  );
  const payoutToken = await hre.ethers.getContractAt(["function balanceOf(address) view returns (uint256)"], payoutTokenAddress);
  const rid = routeId();
  const swapData = encodePath([oftTokenAddress, payoutTokenAddress]);
  const provider = hre.ethers.provider;

  const state = loadState(stateFile);

  console.log("network:", hre.network.name);
  console.log("signer:", signer.address);
  console.log("watchAddress:", watchAddress);
  console.log("recipient:", recipient);
  console.log("routeId:", rid);
  console.log("stateFile:", stateFile);
  console.log("pollMs:", pollMs);
  console.log("slippageBps:", slippageBps);
  console.log("maxRetries:", maxRetries);
  console.log("minWatchAmount:", minWatchAmount.toString());

  while (true) {
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = state.lastScannedBlock > 0 ? state.lastScannedBlock + 1 : Math.max(0, currentBlock - 20);
    const newTransfers = await findNewIncomingTransfers(provider, oftTokenAddress, watchAddress, fromBlock, currentBlock);

    for (const transfer of newTransfers) {
      if (!state.processedIncoming[transfer.incomingTxHash] && !state.pending.find((p) => p.incomingTxHash === transfer.incomingTxHash)) {
        state.pending.push(transfer);
      }
    }

    const balance = await oftToken.balanceOf(watchAddress);
    const payoutBefore = await payoutToken.balanceOf(recipient);
    state.lastSeenBalance = balance.toString();
    state.lastCheckedAt = new Date().toISOString();
    state.lastScannedBlock = currentBlock;
    saveState(stateFile, state);

    console.log(`[watch] block=${currentBlock} oft=${balance.toString()} payoutBefore=${payoutBefore.toString()} pending=${state.pending.length}`);

    if (state.pending.length === 0 && balance.gte(minWatchAmount) && !balance.isZero()) {
      const syntheticTxHash = `synthetic-balance-${currentBlock}`;
      if (!state.processedIncoming[syntheticTxHash]) {
        state.pending.push({
          incomingTxHash: syntheticTxHash,
          blockNumber: currentBlock,
          amount: balance.toString(),
          status: "detected-balance-only",
          attempts: 0,
          sellTxHash: "",
          soldAmount: "0",
          expectedOut: "0",
          minAmountOut: "0",
          error: "",
          detectedAt: new Date().toISOString(),
          soldAt: "",
        });
      }
    }

    await processPending({
      state,
      stateFile,
      provider,
      workflow,
      oftToken,
      payoutToken,
      factoryAddress,
      oftTokenAddress,
      payoutTokenAddress,
      recipient,
      rid,
      swapData,
      slippageBps,
      maxRetries,
    });

    if (once) {
      break;
    }

    await sleep(pollMs);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
