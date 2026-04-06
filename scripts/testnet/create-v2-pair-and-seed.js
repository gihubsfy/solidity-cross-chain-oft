const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const factoryAddress = process.env.FACTORY_ADDRESS;
  const tokenAAddress = process.env.TOKEN_A_ADDRESS;
  const tokenBAddress = process.env.TOKEN_B_ADDRESS;
  const amountA = process.env.AMOUNT_A;
  const amountB = process.env.AMOUNT_B;
  const lpRecipient = process.env.LP_RECIPIENT || deployer.address;

  if (!factoryAddress || !tokenAAddress || !tokenBAddress || !amountA || !amountB) {
    throw new Error("Missing FACTORY_ADDRESS, TOKEN_A_ADDRESS, TOKEN_B_ADDRESS, AMOUNT_A, or AMOUNT_B");
  }

  const factory = await hre.ethers.getContractAt(
    ["function getPair(address,address) external view returns (address)", "function createPair(address,address) external returns (address)"],
    factoryAddress
  );

  let pairAddress = await factory.getPair(tokenAAddress, tokenBAddress);
  if (pairAddress === hre.ethers.constants.AddressZero) {
    const tx = await factory.createPair(tokenAAddress, tokenBAddress);
    await tx.wait();
    pairAddress = await factory.getPair(tokenAAddress, tokenBAddress);
  }

  const tokenAbi = [
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function balanceOf(address owner) external view returns (uint256)"
  ];
  const pair = await hre.ethers.getContractAt(
    ["function mint(address to) external returns (uint256)", "function getReserves() external view returns (uint112,uint112,uint32)"],
    pairAddress
  );

  const tokenA = new hre.ethers.Contract(tokenAAddress, tokenAbi, deployer);
  const tokenB = new hre.ethers.Contract(tokenBAddress, tokenAbi, deployer);

  await (await tokenA.transfer(pairAddress, amountA)).wait();
  await (await tokenB.transfer(pairAddress, amountB)).wait();

  const mintTx = await pair.mint(lpRecipient);
  const mintReceipt = await mintTx.wait();
  const reserves = await pair.getReserves();

  console.log("network:", hre.network.name);
  console.log("deployer:", deployer.address);
  console.log("pair:", pairAddress);
  console.log("tokenA:", tokenAAddress);
  console.log("tokenB:", tokenBAddress);
  console.log("mintTx:", mintReceipt.transactionHash);
  console.log("reserve0:", reserves[0].toString());
  console.log("reserve1:", reserves[1].toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});