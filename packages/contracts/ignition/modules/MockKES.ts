import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Fallback only: a clearly labelled mock Kenyan shilling token for a public test network,
 * used if test KESm cannot be obtained. Allow it on the factory afterwards with scripts/allow-token.ts.
 */
export default buildModule("MockKESModule", (m) => {
  const token = m.contract("MockStablecoin", ["Mock Kenyan Shilling (test only)", "mKES", 18]);
  return { token };
});
