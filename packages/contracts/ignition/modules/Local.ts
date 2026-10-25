import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import FactoryModule from "./Factory.js";

/** Local development: factory plus 18- and 6-decimal mock stablecoins that anyone can mint. */
export default buildModule("LocalModule", (m) => {
  const { factory } = m.useModule(FactoryModule);
  const kes = m.contract("MockStablecoin", ["Test Kenyan Shilling", "KESm", 18], { id: "MockKESm" });
  const usd = m.contract("MockStablecoin", ["Test USD Coin", "USDC", 6], { id: "MockUSDC" });
  m.call(factory, "setTokenAllowed", [kes, true], { id: "allowMockKESm" });
  m.call(factory, "setTokenAllowed", [usd, true], { id: "allowMockUSDC" });
  return { factory, kes, usd };
});
