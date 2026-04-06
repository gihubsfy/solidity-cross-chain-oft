const hre = require("hardhat");

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
  const valueHex = hre.ethers.BigNumber.from(value).isZero() ? "0x" : hre.ethers.utils.hexZeroPad(hre.ethers.BigNumber.from(value).toHexString(), 16);
  const optionBody = gasHex + valueHex.slice(2);
  const optionSize = hre.ethers.utils.hexZeroPad(hre.ethers.utils.hexlify((optionBody.length - 2) / 2 + 1), 2);
  return TYPE_3 + WORKER_ID.slice(2) + optionSize.slice(2) + OPTION_TYPE.slice(2) + optionBody.slice(2);
}

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const workflowAddress = process.env.WORKFLOW_ADDRESS || "0x85B11FD310e001bD0931eE4d97e267831cdD49Df";
  const workflow = await hre.ethers.getContractAt("UnifiedOFTWorkflow", workflowAddress);
  const rid = routeId();
  const recipient = process.env.RECIPIENT_ADDRESS || signer.address;
  const recipientBytes32 = addressToBytes32(recipient);
  const amount = hre.ethers.BigNumber.from(process.env.BRIDGE_AMOUNT || "1000000000000000000");

  const testCases = [
    { label: "empty", options: "0x" },
    { label: "receive-50000", options: encodeLzReceiveOption(50000, 0) },
    { label: "receive-80000", options: encodeLzReceiveOption(80000, 0) },
    { label: "receive-100000", options: encodeLzReceiveOption(100000, 0) },
  ];

  for (const c of testCases) {
    try {
      const fee = await workflow.quoteBridgeFee(rid, amount, recipientBytes32, c.options, "0x");
      console.log(JSON.stringify({ label: c.label, options: c.options, nativeFee: fee.nativeFee.toString(), lzTokenFee: fee.lzTokenFee.toString() }));
    } catch (error) {
      console.log(JSON.stringify({ label: c.label, options: c.options, error: String(error && error.message ? error.message : error) }));
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});