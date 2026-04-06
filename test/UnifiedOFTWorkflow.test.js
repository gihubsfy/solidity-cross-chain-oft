const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UnifiedOFTWorkflow", function () {
  async function deployFixture() {
    const [owner, caller, recipient, outsider] = await ethers.getSigners();

    const ERC20 = await ethers.getContractFactory("MockERC20");
    const tokenIn = await ERC20.deploy("Token In", "TIN", 18);
    const oftToken = await ERC20.deploy("OFT Token", "OFT", 18);
    const payoutToken = await ERC20.deploy("Payout", "OUT", 18);

    const SwapAdapter = await ethers.getContractFactory("MockSwapAdapter");
    const sourceSwapAdapter = await SwapAdapter.deploy();
    const destinationSwapAdapter = await SwapAdapter.deploy();

    const BridgeAdapter = await ethers.getContractFactory("MockBridgeAdapter");
    const bridgeAdapter = await BridgeAdapter.deploy();

    const Workflow = await ethers.getContractFactory("UnifiedOFTWorkflow");
    const workflow = await Workflow.deploy(owner.address);

    await tokenIn.mint(caller.address, ethers.utils.parseEther("100"));
    await oftToken.mint(sourceSwapAdapter.address, ethers.utils.parseEther("100"));
    await payoutToken.mint(destinationSwapAdapter.address, ethers.utils.parseEther("100"));
    await oftToken.mint(caller.address, ethers.utils.parseEther("50"));

    await workflow.connect(owner).setCallerApproval(caller.address, true);
    await workflow.connect(owner).setSwapAdapterApproval(sourceSwapAdapter.address, true);
    await workflow.connect(owner).setSwapAdapterApproval(destinationSwapAdapter.address, true);
    await workflow.connect(owner).setBridgeAdapterApproval(bridgeAdapter.address, true);

    const sourceRouteId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("source-route"));
    const destinationRouteId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("destination-route"));

    await workflow.connect(owner).setSourceRoute(sourceRouteId, {
      tokenIn: tokenIn.address,
      oftToken: oftToken.address,
      swapAdapter: sourceSwapAdapter.address,
      bridgeAdapter: bridgeAdapter.address,
      dstEid: 30184,
      enabled: true,
    });

    await workflow.connect(owner).setDestinationRoute(destinationRouteId, {
      oftToken: oftToken.address,
      payoutToken: payoutToken.address,
      swapAdapter: destinationSwapAdapter.address,
      enabled: true,
    });

    return {
      caller,
      recipient,
      outsider,
      tokenIn,
      oftToken,
      payoutToken,
      bridgeAdapter,
      workflow,
      sourceRouteId,
      destinationRouteId,
    };
  }

  it("blocks non-whitelisted callers", async function () {
    const { outsider, workflow, sourceRouteId } = await deployFixture();

    let reverted = false;
    try {
      await workflow.connect(outsider).swapAndBridge(
        sourceRouteId,
        1,
        1,
        ethers.utils.hexZeroPad(outsider.address, 32),
        "0x",
        "0x",
        "0x"
      );
    } catch (error) {
      reverted = error.message.includes("CallerNotApproved");
    }

    expect(reverted).to.equal(true);
  });

  it("executes source swap and bridge via a configured route", async function () {
    const { caller, workflow, tokenIn, bridgeAdapter, sourceRouteId } = await deployFixture();

    const amountIn = ethers.utils.parseEther("10");
    await tokenIn.connect(caller).approve(workflow.address, amountIn);

    const tx = await workflow.connect(caller).swapAndBridge(
      sourceRouteId,
      amountIn,
      amountIn,
      ethers.utils.hexZeroPad(caller.address, 32),
      "0x",
      "0x",
      "0x"
    );
    await tx.wait();

    expect((await tokenIn.balanceOf(caller.address)).toString()).to.equal(ethers.utils.parseEther("90").toString());
    expect(await bridgeAdapter.lastMessageId()).to.not.equal(ethers.constants.HashZero);
  });

  it("executes destination swap via a configured route", async function () {
    const { caller, recipient, workflow, oftToken, payoutToken, destinationRouteId } = await deployFixture();

    const amountIn = ethers.utils.parseEther("5");
    await oftToken.connect(caller).approve(workflow.address, amountIn);

    const tx = await workflow.connect(caller).swapReceivedOFT(
      destinationRouteId,
      amountIn,
      amountIn,
      recipient.address,
      "0x"
    );
    await tx.wait();

    expect((await payoutToken.balanceOf(recipient.address)).toString()).to.equal(amountIn.toString());
  });
});