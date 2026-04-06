const hre = require("hardhat");

function addressToBytes32(address) {
  return hre.ethers.utils.hexZeroPad(address, 32);
}

async function main() {
  const oftAddress = process.env.OFT_ADDRESS;
  const peerAddress = process.env.PEER_OFT_ADDRESS;
  const peerEid = process.env.PEER_EID;

  if (!oftAddress || !peerAddress || !peerEid) {
    throw new Error("Missing OFT_ADDRESS, PEER_OFT_ADDRESS, or PEER_EID in environment");
  }

  const oft = await hre.ethers.getContractAt("TestOFT", oftAddress);
  const tx = await oft.setPeer(Number(peerEid), addressToBytes32(peerAddress));
  await tx.wait();

  console.log("network:", hre.network.name);
  console.log("oft:", oftAddress);
  console.log("peer eid:", peerEid);
  console.log("peer:", peerAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});