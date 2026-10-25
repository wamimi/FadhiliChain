import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import FactoryModule from "./Factory.js";

// Mento stablecoin deployments on Celo Sepolia (docs.celo.org, "Stablecoin contracts").
export const KESM_CELO_SEPOLIA = "0xC7e4635651E3e3Af82b61d3E23c159438daE3BbF";
export const USDM_CELO_SEPOLIA = "0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b";

export default buildModule("CeloSepoliaModule", (m) => {
  const { factory } = m.useModule(FactoryModule);
  m.call(factory, "setTokenAllowed", [KESM_CELO_SEPOLIA, true], { id: "allowKESm" });
  m.call(factory, "setTokenAllowed", [USDM_CELO_SEPOLIA, true], { id: "allowUSDm" });
  return { factory };
});
