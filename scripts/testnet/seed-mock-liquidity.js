const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const tokenInAddress = process.env.TOKEN_IN_ADDRESS;
  const payoutTokenAddress = process.env.PAYOUT_TOKEN_ADDRESS;
  const oftTokenAddress = process.env.OFT_TOKEN_ADDRESS;
  const swapAdapter = process.env.SWAP_ADAPTER_ADDRESS;
  const tokenInMint = process.env.TOKEN_IN_MINT || hre.ethers.utils.parseEther("1000").toString();
  const oftSeed = process.env.OFT_SEED || hre.ethers.utils.parseEther("500").toString();
  const payoutSeed = process.env.PAYOUT_SEED || hre.ethers.utils.parseEther("500").toString();

  const tokenIn = tokenInAddress ? await hre.ethers.getContractAt("MockERC20", tokenInAddress) : null;
  const payoutToken = payoutTokenAddress ? await hre.ethers.getContractAt("MockERC20", payoutTokenAddress) : null;
  const oftToken = oftTokenAddress ? await hre.ethers.getContractAt("TestOFT", oftTokenAddress) : null;

  if (tokenIn) {
    await (await tokenIn.mint(deployer.address, tokenInMint)).wait();
    console.log("minted tokenIn to deployer:", tokenInMint);
  }

  if (oftToken && swapAdapter) {
    await (await oftToken.transfer(swapAdapter, oftSeed)).wait();
    console.log("seeded OFT to swapAdapter:", oftSeed);
  }

  if (payoutToken && swapAdapter) {
    await (await payoutToken.mint(swapAdapter, payoutSeed)).wait();
    console.log("seeded payoutToken to swapAdapter:", payoutSeed);
  }

  console.log("network:", hre.network.name);
  console.log("deployer:", deployer.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});