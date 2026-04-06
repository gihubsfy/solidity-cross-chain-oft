const hre = require("hardhat");

async function deploy(name, args = []) {
  const Factory = await hre.ethers.getContractFactory(name);
  const contract = await Factory.deploy(...args);
  await contract.deployed();
  return contract;
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const owner = process.env.OWNER_ADDRESS || deployer.address;
  const oftToken = process.env.OFT_TOKEN_ADDRESS;

  if (!oftToken) {
    throw new Error("Missing OFT_TOKEN_ADDRESS in environment");
  }

  const tokenIn = await deploy("MockERC20", ["Mock Token In", "MTIN", 18]);
  const payoutToken = await deploy("MockERC20", ["Mock Payout", "MOUT", 18]);
  const swapAdapter = await deploy("MockSwapAdapter");
  const workflow = await deploy("UnifiedOFTWorkflow", [owner]);

  let bridgeAdapter = null;
  if (process.env.DEPLOY_BRIDGE_ADAPTER === "true") {
    bridgeAdapter = await deploy("LayerZeroOFTBridgeAdapter", [owner]);
  }

  console.log("network:", hre.network.name);
  console.log("deployer:", deployer.address);
  console.log("owner:", owner);
  console.log("oft token:", oftToken);
  console.log("mock tokenIn:", tokenIn.address);
  console.log("mock payoutToken:", payoutToken.address);
  console.log("mock swapAdapter:", swapAdapter.address);
  console.log("workflow:", workflow.address);
  if (bridgeAdapter) {
    console.log("bridgeAdapter:", bridgeAdapter.address);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});