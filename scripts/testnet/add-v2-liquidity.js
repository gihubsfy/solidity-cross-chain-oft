const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const routerAddress = process.env.ROUTER_ADDRESS;
  const tokenAAddress = process.env.TOKEN_A_ADDRESS;
  const tokenBAddress = process.env.TOKEN_B_ADDRESS;
  const amountADesired = process.env.AMOUNT_A_DESIRED;
  const amountBDesired = process.env.AMOUNT_B_DESIRED;
  const amountAMin = process.env.AMOUNT_A_MIN || amountADesired;
  const amountBMin = process.env.AMOUNT_B_MIN || amountBDesired;
  const recipient = process.env.LP_RECIPIENT || deployer.address;
  const deadline = Math.floor(Date.now() / 1000) + 1800;

  if (!routerAddress || !tokenAAddress || !tokenBAddress || !amountADesired || !amountBDesired) {
    throw new Error("Missing router/token/liquidity env values");
  }

  const erc20Abi = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address owner) external view returns (uint256)"
  ];
  const routerAbi = [
    "function addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256) external returns (uint256,uint256,uint256)"
  ];

  const tokenA = new hre.ethers.Contract(tokenAAddress, erc20Abi, deployer);
  const tokenB = new hre.ethers.Contract(tokenBAddress, erc20Abi, deployer);
  const router = new hre.ethers.Contract(routerAddress, routerAbi, deployer);

  await (await tokenA.approve(routerAddress, amountADesired)).wait();
  await (await tokenB.approve(routerAddress, amountBDesired)).wait();

  const tx = await router.addLiquidity(
    tokenAAddress,
    tokenBAddress,
    amountADesired,
    amountBDesired,
    amountAMin,
    amountBMin,
    recipient,
    deadline
  );
  const receipt = await tx.wait();

  console.log("network:", hre.network.name);
  console.log("deployer:", deployer.address);
  console.log("router:", routerAddress);
  console.log("tokenA:", tokenAAddress);
  console.log("tokenB:", tokenBAddress);
  console.log("txHash:", receipt.transactionHash);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});