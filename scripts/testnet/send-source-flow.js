const hre = require("hardhat");

function routeId() {
  return process.env.ROUTE_ID || hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes(process.env.ROUTE_LABEL || "amoy-base-sepolia-direct"));
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

function encodePath(path) {
  return hre.ethers.utils.defaultAbiCoder.encode(["address[]"], [path]);
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const workflowAddress = process.env.WORKFLOW_ADDRESS;
  const tokenInAddress = process.env.TOKEN_IN_ADDRESS;
  const oftTokenAddress = process.env.OFT_TOKEN_ADDRESS;
  const recipient = process.env.RECIPIENT_ADDRESS || deployer.address;
  const amountIn = hre.ethers.BigNumber.from(process.env.AMOUNT_IN || hre.ethers.utils.parseEther("10"));
  const minBridgeAmount = hre.ethers.BigNumber.from(process.env.MIN_BRIDGE_AMOUNT || amountIn);
  const gas = process.env.LZ_RECEIVE_GAS || "200000";
  const lzValue = process.env.LZ_RECEIVE_VALUE || "0";

  if (!workflowAddress || !tokenInAddress || !oftTokenAddress) {
    throw new Error("Missing WORKFLOW_ADDRESS, TOKEN_IN_ADDRESS, or OFT_TOKEN_ADDRESS");
  }

  const workflow = await hre.ethers.getContractAt("UnifiedOFTWorkflow", workflowAddress);
  const tokenIn = await hre.ethers.getContractAt("MockERC20", tokenInAddress);
  const options = encodeLzReceiveOption(gas, lzValue);
  const rid = routeId();
  const recipientBytes32 = addressToBytes32(recipient);
  const swapData = encodePath([tokenInAddress, oftTokenAddress]);
  const fee = await workflow.quoteBridgeFee(rid, minBridgeAmount, recipientBytes32, options, "0x");

  await (await tokenIn.approve(workflowAddress, amountIn)).wait();
  const tx = await workflow.swapAndBridge(rid, amountIn, minBridgeAmount, recipientBytes32, swapData, options, "0x", {
    value: fee.nativeFee,
  });
  const receipt = await tx.wait();

  console.log("network:", hre.network.name);
  console.log("deployer:", deployer.address);
  console.log("routeId:", rid);
  console.log("recipient:", recipient);
  console.log("amountIn:", amountIn.toString());
  console.log("nativeFee:", fee.nativeFee.toString());
  console.log("txHash:", receipt.transactionHash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});