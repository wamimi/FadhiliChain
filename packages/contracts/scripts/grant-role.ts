// Grants APPROVER_ROLE or CANCELLER_ROLE on a deployed factory.
// Usage: FACTORY=0x... ACCOUNT=0x... ROLE=APPROVER_ROLE npx hardhat run scripts/grant-role.ts --network celoSepolia
import { network } from "hardhat";
import { getAddress, keccak256, toHex } from "viem";

const factoryAddress = getAddress(process.env.FACTORY ?? "");
const account = getAddress(process.env.ACCOUNT ?? "");
const roleName = process.env.ROLE ?? "APPROVER_ROLE";
if (!["APPROVER_ROLE", "CANCELLER_ROLE"].includes(roleName)) throw new Error(`Unknown role ${roleName}`);

const { viem } = await network.connect();
const factory = await viem.getContractAt("CampaignFactory", factoryAddress);
const role = keccak256(toHex(roleName));
const hash = await factory.write.grantRole([role, account]);
console.log(`Granted ${roleName} to ${account} in tx ${hash}`);
