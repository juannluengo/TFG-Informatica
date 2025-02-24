// Purpose: The configuration file for Hardhat. It contains network settings (local, Goerli, Sepolia), compiler settings, plugin configurations, and any custom tasks.

require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    hardhat: {
      chainId: 31337
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [PRIVATE_KEY]
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
