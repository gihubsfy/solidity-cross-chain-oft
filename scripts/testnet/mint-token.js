const hre = require("hardhat");

async function main() {
  const tokenAddress = process.env.TOKEN_ADDRESS;
  const recipient = process.env.RECIPIENT_ADDRESS;
  const amount = process.env.MINT_AMOUNT;

  if (!tokenAddress || !recipient || !amount) {
    throw new Error("Missing TOKEN_ADDRESS, RECIPIENT_ADDRESS, or MINT_AMOUNT");
  }

  const token = await hre.ethers.getContractAt([
    "function mint(address to, uint256 amount) external"
  ], tokenAddress);

  const tx = await token.mint(recipient, amount);
  const receipt = await tx.wait();

  console.log("network:", hre.network.name);
  console.log("token:", tokenAddress);
  console.log("recipient:", recipient);
  console.log("amount:", amount);
  console.log("txHash:", receipt.transactionHash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});