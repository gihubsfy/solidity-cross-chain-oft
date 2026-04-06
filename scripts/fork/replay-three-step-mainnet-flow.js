const { replayTransactionOnFork } = require("./replay-utils");

const POLYGON_SOURCE_TX = "0x66fdd4c84e47a80db7124979c76591078e57dbf984958d64f7b60147ae3d3db8";
const BASE_RECEIVE_TX = "0xdccbd94bd8dc9c875108e6b30dbd9842c7d8d1ac05bd64a3c4b06e9b854b1d7f";
const BASE_SELL_TX = "0xaa38ca9584c265838fd0da4564b01dc3d4ce98e0f54f87d62e76bea26002efb3";

const USER = "0x3e0954d9b32f823aff2f66173ffed5f453dedd93";
const POLYGON_USDT = "0xc2132d05d31c914a87c6611c10748aeb04b58e8f";
const POLYGON_USDC = "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359";
const POLYGON_HANDL = "0xf4c3fac9c98aa62474998e299495b699dfdb00eb";
const BASE_HANDL = "0x3bbcb624cb9a1f73163a886f460f47603e5e4425";
const BASE_USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";

async function main() {
  console.log("[1/3] Replay Polygon source swap + bridge");
  const source = await replayTransactionOnFork({
    chain: "polygon",
    txHash: POLYGON_SOURCE_TX,
    watchTokens: [POLYGON_USDT, POLYGON_USDC, POLYGON_HANDL],
    watchAccounts: [USER],
  });
  console.log(JSON.stringify(source, null, 2));

  console.log("[2/3] Replay Base receive leg");
  const receive = await replayTransactionOnFork({
    chain: "base",
    txHash: BASE_RECEIVE_TX,
    watchTokens: [BASE_HANDL],
    watchAccounts: [USER],
  });
  console.log(JSON.stringify(receive, null, 2));

  console.log("[3/3] Replay Base sell leg");
  const sell = await replayTransactionOnFork({
    chain: "base",
    txHash: BASE_SELL_TX,
    watchTokens: [BASE_HANDL, BASE_USDC],
    watchAccounts: [USER],
  });
  console.log(JSON.stringify(sell, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});