const fs = require("fs");
const https = require("https");
const crypto = require("crypto");
const hre = require("hardhat");
const { ethers } = hre;

const USER = process.env.FORK_USER || "0x1e274433D138708C36aF002395aEf3C173a35eC6";
const ROUTE_NAME = process.env.ROUTE_NAME || "fork-polygon-aggregator-route";
const PAYLOAD_FILE = process.env.PAYLOAD_FILE || "polygon_handl_usdt_to_oft_swap.json";
const TOKEN_IN = process.env.TOKEN_IN || "0xc2132d05d31c914a87c6611c10748aeb04b58e8f";
const TOKEN_OUT = process.env.TOKEN_OUT || "0xf4c3fac9c98aa62474998e299495b699dfdb00eb";
const CHAIN_ID = process.env.CHAIN_ID || "137";
const BRIDGE_EID = Number(process.env.BRIDGE_EID || "30184");
const BRIDGE_OPTIONS = process.env.BRIDGE_OPTIONS || "0x000301001101000000000000000000000000000000c350";
const OKX_CONFIG = process.env.OKX_CONFIG || "D:/探索/crypto_chance/okx_swap/config.json";

function readPayload() {
  return JSON.parse(fs.readFileSync(PAYLOAD_FILE, "utf8").replace(/^\uFEFF/, ""));
}

function readOkxConfig() {
  const cfg = JSON.parse(fs.readFileSync(OKX_CONFIG, "utf8").replace(/^\uFEFF/, ""));
  return {
    apiKey: String(cfg["OK-ACCESS-KEY"] || "").trim(),
    secret: String(cfg["SECRET-KEY"] || "").trim(),
    passphrase: String(cfg["OK-ACCESS-PASSPHRASE"] || "").trim(),
  };
}

function sign(secret, ts, method, path) {
  return crypto.createHmac("sha256", secret).update(ts + method + path).digest("base64");
}

function okxGet(path) {
  const { apiKey, secret, passphrase } = readOkxConfig();
  return new Promise((resolve, reject) => {
    const ts = new Date().toISOString().replace("Z", "").slice(0, 23) + "Z";
    const req = https.request(
      {
        hostname: "web3.okx.com",
        path,
        method: "GET",
        headers: {
          "OK-ACCESS-KEY": apiKey,
          "OK-ACCESS-SIGN": sign(secret, ts, "GET", path),
          "OK-ACCESS-PASSPHRASE": passphrase,
          "OK-ACCESS-TIMESTAMP": ts,
          "Content-Type": "application/json",
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(body || "{}") });
          } catch (error) {
            reject(error);
          }
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

async function detectSpender(tokenAddress, amount) {
  const path = `/api/v6/dex/aggregator/approve-transaction?chainIndex=${CHAIN_ID}&tokenContractAddress=${tokenAddress}&approveAmount=${amount}`;
  const resp = await okxGet(path);
  const data = resp.body?.data?.[0]?.data;
  if (!data || !String(data).startsWith("0x095ea7b3")) {
    return null;
  }

  const encodedArgs = "0x" + String(data).slice(10);
  const [spender] = ethers.utils.defaultAbiCoder.decode(["address", "uint256"], encodedArgs);
  return spender;
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

  const rpcUrl = process.env.POLYGON_MAINNET_RPC_URL || "https://polygon.drpc.org";
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

  const Bridge = await ethers.getContractFactory("ForkBridgeRecorderAdapter");
  const bridge = await Bridge.deploy(deployer.address);
  await bridge.deployed();

  const target = swapData.tx.to;
  const amountIn = ethers.BigNumber.from(swapData.routerResult.fromTokenAmount);
  const detectedSpender = process.env.AGGREGATOR_SPENDER ? null : await detectSpender(TOKEN_IN, amountIn.toString());
  const spender = process.env.AGGREGATOR_SPENDER || detectedSpender || target;

  await (await swapAdapter.setApprovedTarget(target, true)).wait();
  await (await swapAdapter.setApprovedSpender(spender, true)).wait();

  const routeId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(ROUTE_NAME));
  await (await workflow.setCallerApproval(USER, true)).wait();
  await (await workflow.setSwapAdapterApproval(swapAdapter.address, true)).wait();
  await (await workflow.setBridgeAdapterApproval(bridge.address, true)).wait();
  await (
    await workflow.setSourceRoute(routeId, {
      tokenIn: TOKEN_IN,
      oftToken: TOKEN_OUT,
      swapAdapter: swapAdapter.address,
      bridgeAdapter: bridge.address,
      dstEid: BRIDGE_EID,
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

  const userBalanceBefore = await tokenIn.balanceOf(USER);
  if (userBalanceBefore.lt(amountIn)) {
    throw new Error(`User ${USER} token balance ${userBalanceBefore.toString()} is lower than required amount ${amountIn.toString()}`);
  }

  await (await tokenIn.approve(workflow.address, amountIn)).wait();

  const encodedExec = ethers.utils.defaultAbiCoder.encode(
    ["tuple(address spender,address target,uint256 value,bytes callData)"],
    [[spender, target, ethers.BigNumber.from(swapData.tx.value || "0"), swapData.tx.data]]
  );

  const recipient = ethers.utils.hexZeroPad(USER, 32);
  const minBridgeAmount = ethers.BigNumber.from(process.env.MIN_BRIDGE_AMOUNT || swapData.tx.minReceiveAmount || "1");

  const tx = await workflow.connect(user).swapAndBridge(routeId, amountIn, minBridgeAmount, recipient, encodedExec, BRIDGE_OPTIONS, "0x", { value: 0 });
  const receipt = await tx.wait();

  const lastReq = await bridge.lastRequest();
  const userBalanceAfter = await tokenIn.balanceOf(USER);
  await hre.network.provider.request({ method: "hardhat_stopImpersonatingAccount", params: [USER] });

  console.log(JSON.stringify({
    forkBlock,
    rpcUrl,
    payloadFile: PAYLOAD_FILE,
    user: USER,
    tokenIn: TOKEN_IN,
    tokenOut: TOKEN_OUT,
    amountIn: amountIn.toString(),
    minBridgeAmount: minBridgeAmount.toString(),
    approvedTarget: target,
    approvedSpender: spender,
    detectedSpender,
    deployedWorkflow: workflow.address,
    deployedAggregatorAdapter: swapAdapter.address,
    deployedBridgeRecorder: bridge.address,
    userTokenInBefore: userBalanceBefore.toString(),
    userTokenInAfter: userBalanceAfter.toString(),
    bridgeRecordedToken: lastReq.token,
    bridgeRecordedAmount: lastReq.amountLD.toString(),
    validationTx: receipt.transactionHash,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});



