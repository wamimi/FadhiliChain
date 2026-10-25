import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import FactoryModule from "./Factory.js";

// Circle test USDC on Base Sepolia.
export const USDC_BASE_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

export default buildModule("BaseSepoliaModule", (m) => {
  const { factory } = m.useModule(FactoryModule);
  m.call(factory, "setTokenAllowed", [USDC_BASE_SEPOLIA, true], { id: "allowUSDC" });
  return { factory };
});
