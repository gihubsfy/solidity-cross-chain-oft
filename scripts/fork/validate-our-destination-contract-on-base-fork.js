const hre = require("hardhat");
const { replayTransactionOnFork } = require("./replay-utils");

const BASE_RECEIVE_TX = "0xdccbd94bd8dc9c875108e6b30dbd9842c7d8d1ac05bd64a3c4b06e9b854b1d7f";
const USER = "0x3e0954d9b32f823aff2f66173ffed5f453dedd93";
const BASE_HANDL = "0x3bbcb624cb9a1f73163a886f460f47603e5e4425";
const BASE_USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
const BASE_PAIR = "0x186696a647c554c7dbea30e295259aa46d40effc";

async function main() {
  const receive = await replayTransactionOnFork({
    chain: "base",
    txHash: BASE_RECEIVE_TX,
    watchTokens: [BASE_HANDL],
    watchAccounts: [USER],
  });

  const [deployer] = await hre.ethers.getSigners();
  const Workflow = await hre.ethers.getContractFactory("UnifiedOFTWorkflow");
  const workflow = await Workflow.deploy(deployer.address);
  await workflow.deployed();

  const Adapter = await hre.ethers.getContractFactory("FixedPairSwapAdapter");
  const adapter = await Adapter.deploy(deployer.address, BASE_PAIR);
  await adapter.deployed();

  const routeId = hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes("fork-base-destination"));
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

  const amount = await oft.balanceOf(USER);
  await (await oft.approve(workflow.address, amount)).wait();

  const path = hre.ethers.utils.defaultAbiCoder.encode(["address[]"], [[BASE_HANDL, BASE_USDC]]);
  const tx = await workflow.connect(user).swapReceivedOFT(routeId, amount, 1, USER, path);
  const receipt = await tx.wait();

  await hre.network.provider.request({ method: "hardhat_stopImpersonatingAccount", params: [USER] });

  console.log(JSON.stringify({
    replay: receive,
    deployedWorkflow: workflow.address,
    deployedFixedPairAdapter: adapter.address,
    soldAmount: amount.toString(),
    forkValidationTx: receipt.transactionHash,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
