const { replayTransactionOnFork } = require("./replay-utils");

async function main() {
  const chain = process.env.FORK_CHAIN;
  const txHash = process.env.TX_HASH;
  const watchTokens = (process.env.WATCH_TOKENS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const watchAccounts = (process.env.WATCH_ACCOUNTS || "").split(",").map((s) => s.trim()).filter(Boolean);

  if (!chain || !txHash) {
    throw new Error("Missing FORK_CHAIN or TX_HASH");
  }

  const result = await replayTransactionOnFork({
    chain,
    txHash,
    watchTokens,
    watchAccounts,
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});