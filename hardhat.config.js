require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;

function optionalNetwork(url) {
  if (!url || !PRIVATE_KEY) return null;
  return {
    url,
    accounts: [PRIVATE_KEY],
  };
}

const networks = {};
const amoy = optionalNetwork(process.env.AMOY_RPC_URL);
const baseSepolia = optionalNetwork(process.env.BASE_SEPOLIA_RPC_URL);

if (amoy) {
  networks.amoy = amoy;
}

if (baseSepolia) {
  networks["base-sepolia"] = baseSepolia;
}

networks.hardhat = {
  chains: {
    137: {
      hardforkHistory: {
        shanghai: 0,
      },
    },
    8453: {
      hardforkHistory: {
        shanghai: 0,
      },
    },
  },
};

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.5.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.6.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  paths: {
    sources: "./src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks,
};
