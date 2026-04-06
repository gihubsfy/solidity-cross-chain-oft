const hre = require("hardhat");

async function main() {
  const address = process.env.ADDRESS;
  const token = process.env.TOKEN_ADDRESS;
  if (!address || !token) {
    throw new Error("Missing ADDRESS or TOKEN_ADDRESS");
  }
  const erc20 = await hre.ethers.getContractAt("MockERC20", token);
  const balance = await erc20.balanceOf(address);
  console.log("network:", hre.network.name);
  console.log("token:", token);
  console.log("address:", address);
  console.log("balance:", balance.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});