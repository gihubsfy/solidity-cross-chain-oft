const hre = require("hardhat");
const { ethers } = hre;

const BASE_SELL_TX = "0xff83ca574a304fc0f77c17e453816daa4ff0f1066aa0eb164dc54c7d0444bd42";
const USER = "0x3e0954d9b32f823aff2f66173ffed5f453dedd93";
const BASE_HANDL = "0x3bbcb624cb9a1f73163a886f460f47603e5e4425";
const BASE_USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const BASE_PAIR = "0x186696a647c554c7dbea30e295259aa46d40effc";
const SAMPLE_B_SELL_AMOUNT = "9940233423802152888782";

async function resetFork(rpcUrl, blockNumber) {
  await hre.network.provider.request({
    method: "hardhat_reset",
    params: [{ forking: { jsonRpcUrl: rpcUrl, blockNumber } }],
  });
}

async function main() {
  const rpcUrl = process.env.BASE_MAINNET_RPC_URL || "https://mainnet.base.org";
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const tx = await provider.getTransaction(BASE_SELL_TX);
  if (!tx) {
    throw new Error(`Transaction not found: ${BASE_SELL_TX}`);
  }

  const forkBlock = Math.max(1, tx.blockNumber - 1);
  await resetFork(rpcUrl, forkBlock);

  const [deployer] = await hre.ethers.getSigners();
  const Workflow = await hre.ethers.getContractFactory("UnifiedOFTWorkflow");
  const workflow = await Workflow.deploy(deployer.address);
  await workflow.deployed();

  const Adapter = await hre.ethers.getContractFactory("FixedPairSwapAdapter");
  const adapter = await Adapter.deploy(deployer.address, BASE_PAIR);
  await adapter.deployed();

  const routeId = hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes("fork-base-handl-sample-b"));
  await (await workflow.setCallerApproval(USER, true)).wait();
  await (await workflow.setSwapAdapterApproval(adapter.address, true)).wait();
  await (
    await workflow.setDestinationRoute(routeId, {
      oftToken: BASE_HANDL,
      payoutToken: BASE_USDC,
      swapAdapter: adapter.address,
      enabled: true,
    })
  ).wait();

  await hre.network.provider.request({ method: "hardhat_setBalance", params: [USER, "0x3635C9ADC5DEA00000"] });
  await hre.network.provider.request({ method: "hardhat_impersonateAccount", params: [USER] });
  const user = await hre.ethers.getSigner(USER);

  const oft = await hre.ethers.getContractAt([
    "function balanceOf(address) view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)"
  ], BASE_HANDL, user);
  const usdc = await hre.ethers.getContractAt([
    "function balanceOf(address) view returns (uint256)"
  ], BASE_USDC, user);

  const balance = await oft.balanceOf(USER);
  const amount = ethers.BigNumber.from(SAMPLE_B_SELL_AMOUNT);
  if (balance.lt(amount)) {
    throw new Error(`Insufficient HANDL balance in fork pre-state: have ${balance.toString()} need ${amount.toString()}`);
  }

  const beforeUsdc = await usdc.balanceOf(USER);
  await (await oft.approve(workflow.address, amount)).wait();

  const path = ethers.utils.defaultAbiCoder.encode(["address[]"], [[BASE_HANDL, BASE_USDC]]);
  const txSell = await workflow.connect(user).swapReceivedOFT(routeId, amount, 1, USER, path);
  const receipt = await txSell.wait();
  const afterUsdc = await usdc.balanceOf(USER);
  const afterHandl = await oft.balanceOf(USER);

  await hre.network.provider.request({ method: "hardhat_stopImpersonatingAccount", params: [USER] });

  console.log(JSON.stringify({
    originalTx: BASE_SELL_TX,
    originalBlock: tx.blockNumber,
    forkBlock,
    deployedWorkflow: workflow.address,
    deployedFixedPairAdapter: adapter.address,
    soldAmount: amount.toString(),
    handlBefore: balance.toString(),
    handlAfter: afterHandl.toString(),
    usdcBefore: beforeUsdc.toString(),
    usdcAfter: afterUsdc.toString(),
    forkValidationTx: receipt.transactionHash,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
