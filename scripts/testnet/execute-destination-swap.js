const hre = require("hardhat");

function routeId() {
  return process.env.ROUTE_ID || hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes(process.env.ROUTE_LABEL || "amoy-base-sepolia-direct"));
}

function encodePath(path) {
  return hre.ethers.utils.defaultAbiCoder.encode(["address[]"], [path]);
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const workflowAddress = process.env.WORKFLOW_ADDRESS;
  const oftTokenAddress = process.env.OFT_TOKEN_ADDRESS;
  const payoutTokenAddress = process.env.PAYOUT_TOKEN_ADDRESS;
  const recipient = process.env.RECIPIENT_ADDRESS || deployer.address;
  const amountIn = hre.ethers.BigNumber.from(process.env.OFT_AMOUNT_IN || hre.ethers.utils.parseEther("10"));
  const minAmountOut = hre.ethers.BigNumber.from(process.env.MIN_AMOUNT_OUT || amountIn);

  if (!workflowAddress || !oftTokenAddress || !payoutTokenAddress) {
    throw new Error("Missing WORKFLOW_ADDRESS, OFT_TOKEN_ADDRESS, or PAYOUT_TOKEN_ADDRESS");
  }

  const workflow = await hre.ethers.getContractAt("UnifiedOFTWorkflow", workflowAddress);
  const oftToken = await hre.ethers.getContractAt("TestOFT", oftTokenAddress);
  const rid = routeId();
  const swapData = encodePath([oftTokenAddress, payoutTokenAddress]);

  await (await oftToken.approve(workflowAddress, amountIn)).wait();
  const tx = await workflow.swapReceivedOFT(rid, amountIn, minAmountOut, recipient, swapData);
  const receipt = await tx.wait();

  console.log("network:", hre.network.name);
  console.log("deployer:", deployer.address);
  console.log("routeId:", rid);
  console.log("recipient:", recipient);
  console.log("amountIn:", amountIn.toString());
  console.log("txHash:", receipt.transactionHash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});