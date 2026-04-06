const hre = require("hardhat");

async function deploy(contractName, args = []) {
  const Factory = await hre.ethers.getContractFactory(contractName);
  const contract = await Factory.deploy(...args);
  await contract.deployed();
  return contract;
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const owner = process.env.OWNER_ADDRESS || deployer.address;

  const factory = await deploy("UniswapV2Factory", [owner]);
  const weth = await deploy("WETH9");
  const router = await deploy("UniswapV2Router02", [factory.address, weth.address]);
  const adapter = await deploy("UniswapV2SwapAdapter", [owner, router.address]);

  console.log("network:", hre.network.name);
  console.log("deployer:", deployer.address);
  console.log("owner:", owner);
  console.log("factory:", factory.address);
  console.log("weth:", weth.address);
  console.log("router:", router.address);
  console.log("swapAdapter:", adapter.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});