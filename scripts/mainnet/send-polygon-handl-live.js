const fs = require("fs");
const hre = require("hardhat");
const { getApproveTransaction, getSwapTransaction } = require("./okx-utils");

function routeId() {
  return process.env.ROUTE_ID || hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes(process.env.ROUTE_LABEL || "polygon-base-handl-usdt"));
}

function addressToBytes32(address) {
  return hre.ethers.utils.hexZeroPad(address, 32);
}

function encodeLzReceiveOption(gas, value) {
  const TYPE_3 = hre.ethers.utils.hexZeroPad(hre.ethers.utils.hexlify(3), 2);
  const WORKER_ID = hre.ethers.utils.hexZeroPad(hre.ethers.utils.hexlify(1), 1);
  const OPTION_TYPE = hre.ethers.utils.hexZeroPad(hre.ethers.utils.hexlify(1), 1);
  const gasHex = hre.ethers.utils.hexZeroPad(hre.ethers.BigNumber.from(gas).toHexString(), 16);
  const valueHex = hre.ethers.BigNumber.from(value).isZero()
    ? "0x"
    : hre.ethers.utils.hexZeroPad(hre.ethers.BigNumber.from(value).toHexString(), 16);
  const optionBody = gasHex + valueHex.slice(2);
  const optionSize = hre.ethers.utils.hexZeroPad(hre.ethers.utils.hexlify((optionBody.length - 2) / 2 + 1), 2);
  return TYPE_3 + WORKER_ID.slice(2) + optionSize.slice(2) + OPTION_TYPE.slice(2) + optionBody.slice(2);
}

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const workflowAddress = process.env.WORKFLOW_ADDRESS || "0x85B11FD310e001bD0931eE4d97e267831cdD49Df";
  const bridgeAdapterAddress = process.env.BRIDGE_ADAPTER_ADDRESS || "0x556638CB4f529e3ED7F1547b26dda3Be8b980548";
  const tokenInAddress = process.env.TOKEN_IN_ADDRESS || "0xc2132d05d31c914a87c6611c10748aeb04b58e8f";
  const oftTokenAddress = process.env.OFT_TOKEN_ADDRESS || "0xf4c3fac9c98aa62474998e299495b699dfdb00eb";
  const recipient = process.env.RECIPIENT_ADDRESS || signer.address;
  const amountIn = hre.ethers.BigNumber.from(process.env.AMOUNT_IN || "1000000");
  const slippage = process.env.OKX_SLIPPAGE || "0.5";
  const payloadFile = process.env.PAYLOAD_FILE || "";
  const explicitSpender = process.env.AGGREGATOR_SPENDER || "";
  const receiveGas = process.env.LZ_RECEIVE_GAS || "80000";
  const receiveValue = process.env.LZ_RECEIVE_VALUE || "0";
  const okxConfig = process.env.OKX_CONFIG || "D:/探索/crypto_chance/okx_swap/config.json";
  const chainId = process.env.CHAIN_ID || "137";
  const rid = routeId();

  const workflow = await hre.ethers.getContractAt("UnifiedOFTWorkflow", workflowAddress);
  const bridgeAdapter = await hre.ethers.getContractAt("LayerZeroOFTBridgeAdapter", bridgeAdapterAddress);
  const tokenIn = await hre.ethers.getContractAt(
    [
      "function approve(address spender, uint256 amount) external returns (bool)",
      "function balanceOf(address owner) view returns (uint256)"
    ],
    tokenInAddress
  );

  const balance = await tokenIn.balanceOf(signer.address);
  if (balance.lt(amountIn)) {
    throw new Error(`Insufficient tokenIn balance: have ${balance.toString()} need ${amountIn.toString()}`);
  }

  let spender;
  let swapData;

  if (payloadFile) {
    const payload = JSON.parse(fs.readFileSync(payloadFile, "utf8").replace(/^\uFEFF/, ""));
    swapData = payload.data?.[0];
    spender = explicitSpender;
    if (!swapData?.tx) {
      throw new Error(`Invalid PAYLOAD_FILE: ${payloadFile}`);
    }
    if (!spender) {
      throw new Error("Missing AGGREGATOR_SPENDER when PAYLOAD_FILE is provided");
    }
  } else {
    const approveResp = await getApproveTransaction({
      chainId,
      tokenAddress: tokenInAddress,
      amount: amountIn.toString(),
      configPath: okxConfig,
    });
    spender = approveResp.body?.data?.[0]?.dexContractAddress;
    if (!spender) {
      throw new Error("Failed to get OKX spender from approve-transaction response");
    }

    const swapResp = await getSwapTransaction({
      chainId,
      fromToken: tokenInAddress,
      toToken: oftTokenAddress,
      amount: amountIn.toString(),
      slippagePercent: slippage,
      userWalletAddress: signer.address,
      configPath: okxConfig,
    });
    swapData = swapResp.body?.data?.[0];
    if (!swapData?.tx) {
      throw new Error(`Failed to get OKX swap payload: ${JSON.stringify(swapResp.body)}`);
    }
  }

  const exec = hre.ethers.utils.defaultAbiCoder.encode(
    ["tuple(address spender,address target,uint256 value,bytes callData)"],
    [[spender, swapData.tx.to, hre.ethers.BigNumber.from(swapData.tx.value || "0"), swapData.tx.data]]
  );

  const expectedBridgeAmount = hre.ethers.BigNumber.from(swapData.routerResult.toTokenAmount || swapData.tx.minReceiveAmount || "1");
  const minBridgeAmount = hre.ethers.BigNumber.from(
    process.env.MIN_BRIDGE_AMOUNT || swapData.tx.minReceiveAmount || "1"
  );
  const options = encodeLzReceiveOption(receiveGas, receiveValue);
  const recipientBytes32 = addressToBytes32(recipient);
  const fee = await bridgeAdapter.quoteBridge({
    dstEid: 30184,
    to: recipientBytes32,
    token: oftTokenAddress,
    amountLD: expectedBridgeAmount,
    minAmountLD: minBridgeAmount,
    refundAddress: signer.address,
    options,
    composeMsg: "0x",
  });

  await (await tokenIn.approve(workflowAddress, amountIn)).wait();
  const tx = await workflow.swapAndBridge(rid, amountIn, minBridgeAmount, recipientBytes32, exec, options, "0x", {
    value: fee.nativeFee,
  });
  const receipt = await tx.wait();

  console.log(JSON.stringify({
    network: hre.network.name,
    signer: signer.address,
    workflow: workflowAddress,
    bridgeAdapter: bridgeAdapterAddress,
    routeId: rid,
    amountIn: amountIn.toString(),
    recipient,
    spender,
    target: swapData.tx.to,
    expectedBridgeAmount: expectedBridgeAmount.toString(),
    minBridgeAmount: minBridgeAmount.toString(),
    nativeFee: fee.nativeFee.toString(),
    txHash: receipt.transactionHash,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});