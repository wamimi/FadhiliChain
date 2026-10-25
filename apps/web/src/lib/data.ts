import "server-only";
import { decodeEventLog, getAddress, type Address, type Hex } from "viem";
import { campaignAbi } from "@fadhili/contracts/abi";
import { hasDatabase } from "./env";
import { db } from "./supabase";
import { publicClient } from "./rpc";
import { chainInfo } from "./chains";
import { DEMO_CAMPAIGNS, DEMO_CONTRIBUTIONS, DEMO_TAMPERED_REF } from "./demo-data";
import { CHAIN_STATUS, type Campaign, type Contribution, type ReceiptCheck } from "./types";
import { isTxHash, normaliseRef } from "./receipt-ref";

export const previewMode = !hasDatabase;

type CampaignRow = {
  id: string;
  chain_id: number;
  address: string | null;
  status: Campaign["reviewStatus"];
  title: string;
  summary: string;
  story: string;
  category: string;
  location: string;
  beneficiary: string;
  organiser_name: string;
  image_url: string | null;
  organiser: string;
  recipient: string;
  token: string;
  target: string;
  deadline: string;
  metadata_hash: string;
  created_at: string;
  review_note: string | null;
};

type ContributionRow = {
  ref: string;
  chain_id: number;
  campaign: string;
  tx_hash: string;
  log_index: number;
  donor: string;
  amount: string;
  block_number: number;
  block_time: string;
  display_name: string | null;
  message: string | null;
};

const CAMPAIGN_COLUMNS =
  "id, chain_id, address, status, title, summary, story, category, location, beneficiary, organiser_name, image_url, organiser, recipient, token, target, deadline, metadata_hash, created_at, review_note";

function fromRow(r: CampaignRow): Campaign {
  const deadline = Math.floor(new Date(r.deadline).getTime() / 1000);
  return {
    id: r.id,
    chainId: r.chain_id,
    address: r.address ? getAddress(r.address) : null,
    reviewStatus: r.status,
    title: r.title,
    summary: r.summary,
    story: r.story,
    category: r.category,
    location: r.location,
    beneficiary: r.beneficiary,
    organiserName: r.organiser_name,
    imageUrl: r.image_url,
    organiser: getAddress(r.organiser),
    recipient: getAddress(r.recipient),
    token: getAddress(r.token),
    target: String(r.target),
    deadline,
    metadataHash: r.metadata_hash as Hex,
    createdAt: r.created_at,
    reviewNote: r.review_note,
    raised: "0",
    donors: 0,
    status: deadline > Date.now() / 1000 ? "open" : "failed",
    feeBps: 0,
    verifiedLive: false,
  };
}

function contributionFromRow(r: ContributionRow): Contribution {
  return {
    ref: r.ref,
    chainId: r.chain_id,
    campaign: getAddress(r.campaign),
    txHash: r.tx_hash as Hex,
    logIndex: r.log_index,
    donor: getAddress(r.donor),
    amount: String(r.amount),
    blockNumber: Number(r.block_number),
    blockTime: r.block_time,
    displayName: r.display_name,
    message: r.message,
  };
}

/** Read totals and status straight from each campaign contract. The chain, not our database, is the source of truth. */
async function withLiveNumbers(campaigns: Campaign[]): Promise<Campaign[]> {
  const byChain = new Map<number, Campaign[]>();
  for (const c of campaigns) if (c.address) byChain.set(c.chainId, [...(byChain.get(c.chainId) ?? []), c]);

  await Promise.all(
    [...byChain.entries()].map(async ([chainId, list]) => {
      try {
        const client = publicClient(chainId);
        const calls = list.flatMap((c) =>
          (["totalRaised", "status", "feeBps"] as const).map((functionName) => ({
            address: c.address!,
            abi: campaignAbi,
            functionName,
          })),
        );
        const results = await client.multicall({ contracts: calls, allowFailure: true });
        list.forEach((c, i) => {
          const [raised, status, fee] = results.slice(i * 3, i * 3 + 3);
          if (raised.status === "success" && status.status === "success") {
            c.raised = String(raised.result);
            c.status = CHAIN_STATUS[Number(status.result)] ?? c.status;
            c.feeBps = fee.status === "success" ? Number(fee.result) : c.feeBps;
            c.verifiedLive = true;
          }
        });
      } catch {
        // RPC unavailable: keep database values; the page shows them as not live.
      }
    }),
  );

  if (hasDatabase && campaigns.some((c) => c.address)) {
    const { data } = await db()
      .from("contributions")
      .select("chain_id, campaign, donor, amount")
      .in("campaign", campaigns.filter((c) => c.address).map((c) => c.address!.toLowerCase()));
    // The same contract address can exist on both networks, so keys include the chain.
    const donors = new Map<string, Set<string>>();
    const sums = new Map<string, bigint>();
    for (const r of data ?? []) {
      const key = `${r.chain_id}:${r.campaign}`;
      donors.set(key, (donors.get(key) ?? new Set()).add(r.donor));
      sums.set(key, (sums.get(key) ?? 0n) + BigInt(r.amount));
    }
    for (const c of campaigns) {
      if (!c.address) continue;
      const key = `${c.chainId}:${c.address.toLowerCase()}`;
      c.donors = donors.get(key)?.size ?? 0;
      if (!c.verifiedLive) c.raised = String(sums.get(key) ?? 0n);
    }
  }
  return campaigns;
}

export async function listCampaigns(opts: { category?: string; limit?: number; includeEnded?: boolean } = {}) {
  if (previewMode) {
    return DEMO_CAMPAIGNS.filter((c) => !opts.category || c.category === opts.category)
      .filter((c) => opts.includeEnded || c.status === "open")
      .slice(0, opts.limit ?? 100)
      .map((c) => ({ ...c }));
  }
  let q = db()
    .from("campaigns")
    .select(CAMPAIGN_COLUMNS)
    .eq("status", "approved")
    .not("address", "is", null)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 100);
  if (opts.category) q = q.eq("category", opts.category);
  const { data, error } = await q;
  if (error) throw error;
  const live = await withLiveNumbers((data as CampaignRow[]).map(fromRow));
  return opts.includeEnded ? live : live.filter((c) => c.status === "open");
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  if (previewMode) {
    const c = DEMO_CAMPAIGNS.find((c) => c.id === id);
    return c ? { ...c } : null;
  }
  const { data } = await db().from("campaigns").select(CAMPAIGN_COLUMNS).eq("id", id).maybeSingle();
  if (!data) return null;
  const [c] = await withLiveNumbers([fromRow(data as CampaignRow)]);
  return c;
}

export async function getCampaignByAddress(chainId: number, address: string) {
  if (previewMode) return DEMO_CAMPAIGNS.find((c) => c.address?.toLowerCase() === address.toLowerCase()) ?? null;
  const { data } = await db()
    .from("campaigns")
    .select(CAMPAIGN_COLUMNS)
    .eq("chain_id", chainId)
    .eq("address", address.toLowerCase())
    .maybeSingle();
  return data ? fromRow(data as CampaignRow) : null;
}

export async function campaignContributions(c: Campaign, limit = 50): Promise<Contribution[]> {
  if (!c.address) return [];
  if (previewMode) return DEMO_CONTRIBUTIONS.filter((x) => x.campaign === c.address).slice(0, limit);
  const { data } = await db()
    .from("contributions")
    .select("*")
    .eq("chain_id", c.chainId)
    .eq("campaign", c.address.toLowerCase())
    .order("block_number", { ascending: false })
    .limit(limit);
  return (data as ContributionRow[] | null)?.map(contributionFromRow) ?? [];
}

export async function recentContributions(limit = 12) {
  const rows: Contribution[] = previewMode
    ? [...DEMO_CONTRIBUTIONS].sort((a, b) => b.blockTime.localeCompare(a.blockTime)).slice(0, limit)
    : (((await db().from("contributions").select("*").order("block_time", { ascending: false }).limit(limit)).data ??
        []) as ContributionRow[]).map(contributionFromRow);
  const byAddress = new Map<string, Campaign>();
  const campaigns = previewMode ? DEMO_CAMPAIGNS : await listCampaigns({ includeEnded: true });
  for (const c of campaigns) if (c.address) byAddress.set(`${c.chainId}:${c.address.toLowerCase()}`, c);
  return rows
    .filter((r) => byAddress.has(`${r.chainId}:${r.campaign.toLowerCase()}`))
    .map((r) => {
      const c = byAddress.get(`${r.chainId}:${r.campaign.toLowerCase()}`)!;
      return { ...r, campaignTitle: c.title, campaignId: c.id, token: c.token };
    });
}

export async function platformTotals() {
  const campaigns = await listCampaigns({ includeEnded: true });
  const kes = campaigns.filter((c) => chainInfo(c.chainId)?.tokens.find((t) => t.address === c.token)?.currency === "KES");
  const raisedKes = kes.reduce((s, c) => s + BigInt(c.raised), 0n);
  return { campaigns: campaigns.length, raisedKes, donors: campaigns.reduce((s, c) => s + c.donors, 0) };
}

/** Look up a receipt and check our stored copy against the transaction on the public chain. */
export async function checkReceipt(input: string): Promise<ReceiptCheck | null> {
  const ref = normaliseRef(input);
  let record: Contribution | undefined;

  if (previewMode) {
    if (ref === DEMO_TAMPERED_REF) {
      const original = DEMO_CONTRIBUTIONS[0];
      record = { ...original, ref, amount: (BigInt(original.amount) * 10n).toString() };
      const campaign = DEMO_CAMPAIGNS.find((c) => c.address === original.campaign) ?? null;
      return {
        record,
        campaign,
        chain: { found: true, donor: original.donor, amount: original.amount, campaign: original.campaign, blockNumber: original.blockNumber },
        matches: false,
        mismatches: ["amount"],
      };
    }
    record = DEMO_CONTRIBUTIONS.find((c) => c.ref === ref || c.txHash.toLowerCase() === input.trim().toLowerCase());
    if (!record) return null;
    const campaign = DEMO_CAMPAIGNS.find((c) => c.address === record!.campaign) ?? null;
    return {
      record,
      campaign,
      chain: { found: true, donor: record.donor, amount: record.amount, campaign: record.campaign, blockNumber: record.blockNumber },
      matches: true,
      mismatches: [],
    };
  }

  const q = db().from("contributions").select("*");
  const { data } = await (isTxHash(input) ? q.eq("tx_hash", input.trim().toLowerCase()) : q.eq("ref", ref)).limit(1);
  if (!data?.length) return null;
  record = contributionFromRow(data[0] as ContributionRow);
  const campaign = await getCampaignByAddress(record.chainId, record.campaign);
  return { record, campaign, ...(await verifyAgainstChain(record)) };
}

export async function verifyAgainstChain(record: Contribution): Promise<Pick<ReceiptCheck, "chain" | "matches" | "mismatches">> {
  try {
    const receipt = await publicClient(record.chainId).getTransactionReceipt({ hash: record.txHash });
    const log = receipt.logs.find((l) => l.logIndex === record.logIndex);
    if (!log || receipt.status !== "success") {
      return { chain: { found: false, reason: "No contribution at this position in the transaction" }, matches: false, mismatches: ["transaction"] };
    }
    const ev = decodeEventLog({ abi: campaignAbi, data: log.data, topics: log.topics });
    if (ev.eventName !== "Contributed") {
      return { chain: { found: false, reason: "This transaction is not a contribution" }, matches: false, mismatches: ["transaction"] };
    }
    const chain = {
      found: true as const,
      donor: getAddress(ev.args.donor),
      amount: String(ev.args.amount),
      campaign: getAddress(log.address),
      blockNumber: Number(receipt.blockNumber),
    };
    const mismatches: string[] = [];
    if (chain.amount !== record.amount) mismatches.push("amount");
    if (chain.donor !== record.donor) mismatches.push("donor");
    if (chain.campaign !== record.campaign) mismatches.push("campaign");
    if (chain.blockNumber !== record.blockNumber) mismatches.push("block");
    return { chain, matches: mismatches.length === 0, mismatches };
  } catch {
    return { chain: { found: false, reason: "The public record could not be reached. Try again shortly." }, matches: false, mismatches: [] };
  }
}

export async function campaignsForAddresses(addresses: Address[]) {
  const lower = addresses.map((a) => a.toLowerCase());
  if (previewMode) return [];
  const { data } = await db()
    .from("campaigns")
    .select(CAMPAIGN_COLUMNS)
    .or(`organiser.in.(${lower.join(",")}),recipient.in.(${lower.join(",")})`)
    .order("created_at", { ascending: false });
  return withLiveNumbers(((data ?? []) as CampaignRow[]).map(fromRow));
}

export async function contributionsByDonors(addresses: Address[]) {
  if (previewMode) return [];
  const { data } = await db()
    .from("contributions")
    .select("*")
    .in("donor", addresses.map((a) => a.toLowerCase()))
    .order("block_time", { ascending: false });
  return ((data ?? []) as ContributionRow[]).map(contributionFromRow);
}

export async function pendingCampaigns() {
  if (previewMode) return [];
  const { data } = await db()
    .from("campaigns")
    .select(`${CAMPAIGN_COLUMNS}, request, signature, campaign_private(organiser_contact, documents_note)`)
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  return (data ?? []).map((r) => ({
    campaign: fromRow(r as unknown as CampaignRow),
    request: (r as { request: unknown }).request,
    signature: (r as { signature: string }).signature,
    private: (() => {
      type Private = { organiser_contact: string; documents_note: string | null };
      const p = (r as unknown as { campaign_private: Private | Private[] | null }).campaign_private;
      return Array.isArray(p) ? (p[0] ?? null) : p;
    })(),
  }));
}

/** Database copy only, with no check against the chain. Used by the receipt-only version in the research study. */
export async function findContribution(input: string): Promise<{ record: Contribution; campaign: Campaign | null } | null> {
  const ref = normaliseRef(input);
  if (previewMode) {
    if (ref === DEMO_TAMPERED_REF) {
      const original = DEMO_CONTRIBUTIONS[0];
      return {
        record: { ...original, ref, amount: (BigInt(original.amount) * 10n).toString() },
        campaign: DEMO_CAMPAIGNS.find((c) => c.address === original.campaign) ?? null,
      };
    }
    const record = DEMO_CONTRIBUTIONS.find((c) => c.ref === ref);
    if (!record) return null;
    return { record, campaign: DEMO_CAMPAIGNS.find((c) => c.address === record.campaign) ?? null };
  }
  const { data } = await db().from("contributions").select("*").eq("ref", ref).limit(1);
  if (!data?.length) return null;
  const record = contributionFromRow(data[0] as ContributionRow);
  return { record, campaign: await getCampaignByAddress(record.chainId, record.campaign) };
}
