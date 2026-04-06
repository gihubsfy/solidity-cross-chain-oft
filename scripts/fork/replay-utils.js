const hre = require("hardhat");
const { ethers } = hre;

function defaultRpcForChain(chain) {
  if (chain === "polygon") return process.env.POLYGON_MAINNET_RPC_URL || "https://polygon-bor-rpc.publicnode.com";
  if (chain === "base") return process.env.BASE_MAINNET_RPC_URL || "https://mainnet.base.org";
  throw new Error(`Unsupported chain: ${chain}`);
}

async function resetFork(rpcUrl, blockNumber) {
  try {
    await hre.network.provider.request({
      method: "hardhat_reset",
      params: [{ forking: { jsonRpcUrl: rpcUrl, blockNumber } }],
    });
  } catch (error) {
    const msg = String(error && error.message ? error.message : error);
    if (msg.includes("historical state") || msg.includes("not available")) {
      throw new Error(
        `Fork reset failed at block ${blockNumber}. The configured RPC does not expose the required historical state. Please set an archive-capable RPC in POLYGON_MAINNET_RPC_URL or BASE_MAINNET_RPC_URL.`
      );
    }
    throw error;
  }
}

async function setRichBalance(address) {
  await hre.network.provider.request({
    method: "hardhat_setBalance",
    params: [address, "0x3635C9ADC5DEA00000"],
  });
}

async function impersonate(address) {
  await hre.network.provider.request({ method: "hardhat_impersonateAccount", params: [address] });
  return ethers.getSigner(address);
}

async function stopImpersonate(address) {
  await hre.network.provider.request({ method: "hardhat_stopImpersonatingAccount", params: [address] });
}

async function getTokenBalances(provider, tokens, accounts) {
  const erc20Abi = ["function balanceOf(address) view returns (uint256)"];
  const result = {};

  for (const token of tokens) {
    result[token] = {};
    const contract = new ethers.Contract(token, erc20Abi, provider);
    for (const account of accounts) {
      result[token][account] = (await contract.balanceOf(account)).toString();
    }
  }

  return result;
}

async function replayTransactionOnFork(options) {
  const { chain, txHash, watchTokens = [], watchAccounts = [] } = options;
  const rpcUrl = options.rpcUrl || defaultRpcForChain(chain);
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const tx = await provider.getTransaction(txHash);
  const receipt = await provider.getTransactionReceipt(txHash);

  if (!tx || !receipt) {
    throw new Error(`Transaction not found: ${txHash}`);
  }

  const forkBlock = Math.max(1, tx.blockNumber - 1);
  await resetFork(rpcUrl, forkBlock);

  const forkProvider = hre.ethers.provider;
  if (watchTokens.length && watchAccounts.length) {
    console.log("beforeBalances:", JSON.stringify(await getTokenBalances(forkProvider, watchTokens, watchAccounts), null, 2));
  }

  await setRichBalance(tx.from);
  const signer = await impersonate(tx.from);

  const replayTx = {
    to: tx.to,
    data: tx.data,
    value: tx.value,
    gasLimit: tx.gasLimit,
  };

  if (tx.type === 0 && tx.gasPrice) {
    replayTx.gasPrice = tx.gasPrice;
  }

  const sent = await signer.sendTransaction(replayTx);
  const replayReceipt = await sent.wait();

  if (watchTokens.length && watchAccounts.length) {
    console.log("afterBalances:", JSON.stringify(await getTokenBalances(forkProvider, watchTokens, watchAccounts), null, 2));
  }

  await stopImpersonate(tx.from);

  return {
    chain,
    txHash,
    originalBlock: tx.blockNumber,
    forkBlock,
    from: tx.from,
    to: tx.to,
    replayHash: replayReceipt.transactionHash,
    status: replayReceipt.status,
    gasUsed: replayReceipt.gasUsed.toString(),
  };
}

module.exports = {
  replayTransactionOnFork,
};
