import type { Address, Hex } from "viem";

export type ChainStatus = "open" | "successful" | "failed" | "cancelled" | "withdrawn";
export const CHAIN_STATUS: ChainStatus[] = ["open", "successful", "failed", "cancelled", "withdrawn"];

export type Campaign = {
  id: string;
  chainId: number;
  address: Address | null;
  reviewStatus: "pending" | "approved" | "rejected";
  title: string;
  summary: string;
  story: string;
  category: string;
  location: string;
  beneficiary: string;
  organiserName: string;
  imageUrl: string | null;
  organiser: Address;
  recipient: Address;
  token: Address;
  target: string;
  deadline: number;
  metadataHash: Hex;
  createdAt: string;
  reviewNote: string | null;
  /** Live values, read from the chain when possible. */
  raised: string;
  donors: number;
  status: ChainStatus;
  feeBps: number;
  /** True when the numbers above came from the chain on this request. */
  verifiedLive: boolean;
};

export type Contribution = {
  ref: string;
  chainId: number;
  campaign: Address;
  txHash: Hex;
  logIndex: number;
  donor: Address;
  amount: string;
  blockNumber: number;
  blockTime: string;
  displayName: string | null;
  message: string | null;
};

export type ReceiptCheck = {
  record: Contribution;
  campaign: Campaign | null;
  chain:
    | { found: true; donor: Address; amount: string; campaign: Address; blockNumber: number }
    | { found: false; reason: string };
  /** Every field in our database copy matches the public record. */
  matches: boolean;
  mismatches: string[];
};
