import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { keccak256, toHex } from "viem";

const APPROVER_ROLE = keccak256(toHex("APPROVER_ROLE"));
const CANCELLER_ROLE = keccak256(toHex("CANCELLER_ROLE"));

/**
 * Deploys CampaignFactory (which deploys the Campaign implementation in its constructor)
 * and grants the approver and canceller roles.
 *
 * Parameters (all optional, default to the deployer):
 *   approver:  account allowed to create reviewed campaigns
 *   canceller: account allowed to cancel campaigns before withdrawal
 *   adminTransferDelay: seconds before a new default admin can take over (default 1 day)
 */
export default buildModule("FactoryModule", (m) => {
  const deployer = m.getAccount(0);
  const approver = m.getParameter("approver", deployer);
  const canceller = m.getParameter("canceller", deployer);
  const delay = m.getParameter("adminTransferDelay", 86_400n);

  const factory = m.contract("CampaignFactory", [deployer, delay]);

  m.call(factory, "grantRole", [APPROVER_ROLE, approver], { id: "grantApprover" });
  m.call(factory, "grantRole", [CANCELLER_ROLE, canceller], { id: "grantCanceller" });

  return { factory };
});
