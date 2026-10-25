import type { Address, Hex } from "viem";

export const CAMPAIGN_REQUEST_TYPES = {
  CampaignRequest: [
    { name: "token", type: "address" },
    { name: "organiser", type: "address" },
    { name: "recipient", type: "address" },
    { name: "target", type: "uint256" },
    { name: "deadline", type: "uint64" },
    { name: "metadataHash", type: "bytes32" },
    { name: "nonce", type: "uint256" },
    { name: "expiry", type: "uint64" },
  ],
} as const;

export function factoryDomain(chainId: number, factory: Address) {
  return { name: "FadhiliChain CampaignFactory", version: "1", chainId, verifyingContract: factory } as const;
}

export type CampaignRequest = {
  token: Address;
  organiser: Address;
  recipient: Address;
  target: bigint;
  deadline: bigint;
  metadataHash: Hex;
  nonce: bigint;
  expiry: bigint;
};

/** JSON-safe form (bigints as strings) used between the browser, the API and the database. */
export type CampaignRequestJson = { [K in keyof CampaignRequest]: CampaignRequest[K] extends bigint ? string : CampaignRequest[K] };

export const requestToJson = (r: CampaignRequest): CampaignRequestJson => ({
  ...r,
  target: r.target.toString(),
  deadline: r.deadline.toString(),
  nonce: r.nonce.toString(),
  expiry: r.expiry.toString(),
});

export const requestFromJson = (r: CampaignRequestJson): CampaignRequest => ({
  ...r,
  target: BigInt(r.target),
  deadline: BigInt(r.deadline),
  nonce: BigInt(r.nonce),
  expiry: BigInt(r.expiry),
});

/** How long a signed request stays usable by reviewers. */
export const REQUEST_VALIDITY_SECONDS = 14 * 86_400;
