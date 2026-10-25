import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { configVariable, defineConfig } from "hardhat/config";

// SOLC_PATH lets offline environments point Hardhat at a local solc binary.
// Leave it unset on a normal machine: Hardhat downloads the compiler itself.
const solcPath = process.env.SOLC_PATH;

const compiler = {
  version: "0.8.28",
  ...(solcPath ? { path: solcPath } : {}),
  settings: {
    evmVersion: "cancun",
    optimizer: { enabled: true, runs: 200 },
  },
};

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: compiler,
      production: compiler,
    },
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
      chainType: "l1",
    },
    celoSepolia: {
      type: "http",
      chainType: "generic",
      chainId: 11142220,
      url: configVariable("CELO_SEPOLIA_RPC_URL"),
      accounts: [configVariable("DEPLOYER_PRIVATE_KEY")],
    },
    baseSepolia: {
      type: "http",
      chainType: "op",
      chainId: 84532,
      url: configVariable("BASE_SEPOLIA_RPC_URL"),
      accounts: [configVariable("DEPLOYER_PRIVATE_KEY")],
    },
  },
});
