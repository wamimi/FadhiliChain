import "server-only";
import { decodeEventLog, getAbiItem, getAddress, type Hex, type Log } from "viem";
import { campaignAbi, campaignFactoryAbi } from "@fadhili/contracts/abi";
import { db } from "./supabase";
import { chainInfo, liveChains } from "./chains";
import { publicClient } from "./rpc";
import { receiptRef } from "./receipt-ref";

type Row = {
  ref: string;
  chain_id: number;
  campaign: string;
  tx_hash: string;
  log_index: number;
  donor: string;
  amount: string;
  block_number: number;
  block_time: string;
  display_name?: string | null;
  message?: string | null;
};

const contributedEvent = getAbiItem({ abi: campaignAbi, name: "Contributed" });

async function isCampaign(chainId: number, address: `0x${string}`) {
  const factory = chainInfo(chainId)?.factory;
  if (!factory) return false;
  return publicClient(chainId).readContract({ address: factory, abi: campaignFactoryAbi, functionName: "isCampaign", args: [address] });
}

async function toRows(chainId: number, logs: Log[]): Promise<Row[]> {
  const client = publicClient(chainId);
  const blockTimes = new Map<bigint, string>();
  const rows: Row[] = [];
  for (const log of logs) {
    let ev;
    try {
      ev = decodeEventLog({ abi: campaignAbi, data: log.data, topics: log.topics });
    } catch {
      continue;
    }
    if (ev.eventName !== "Contributed" || log.blockNumber === null || log.logIndex === null || !log.transactionHash) continue;
    if (!blockTimes.has(log.blockNumber)) {
      const block = await client.getBlock({ blockNumber: log.blockNumber });
      blockTimes.set(log.blockNumber, new Date(Number(block.timestamp) * 1000).toISOString());
    }
    rows.push({
      ref: receiptRef(log.transactionHash, log.logIndex),
      chain_id: chainId,
      campaign: log.address.toLowerCase(),
      tx_hash: log.transactionHash.toLowerCase(),
      log_index: log.logIndex,
      donor: ev.args.donor.toLowerCase(),
      amount: ev.args.amount.toString(),
      block_number: Number(log.blockNumber),
      block_time: blockTimes.get(log.blockNumber)!,
    });
  }
  return rows;
}

async function save(rows: Row[]) {
  if (!rows.length) return;
  const { error } = await db().from("contributions").upsert(rows, { onConflict: "chain_id,tx_hash,log_index", ignoreDuplicates: true });
  if (error?.code === "23505") {
    // A receipt reference collided with another transaction: use a longer one.
    for (const r of rows) r.ref = receiptRef(r.tx_hash, r.log_index, 1);
    await db().from("contributions").upsert(rows, { onConflict: "chain_id,tx_hash,log_index", ignoreDuplicates: true });
  } else if (error) throw error;
}

/** Record the contributions in one transaction, after confirming it on-chain. Returns the receipt references. */
export async function ingestTransaction(chainId: number, txHash: Hex, extras: { donors?: string[]; displayName?: string | null; message?: string | null } = {}) {
  const receipt = await publicClient(chainId).waitForTransactionReceipt({ hash: txHash, timeout: 30_000 });
  if (receipt.status !== "success") return [];
  const candidates: Log[] = [];
  for (const log of receipt.logs) if (await isCampaign(chainId, getAddress(log.address))) candidates.push(log as Log);
  const rows = await toRows(chainId, candidates);
  for (const r of rows) {
    if (extras.donors?.some((d) => d.toLowerCase() === r.donor)) {
      r.display_name = extras.displayName ?? null;
      r.message = extras.message ?? null;
    }
  }
  await save(rows);
  const { data } = await db().from("contributions").select("ref, campaign, amount").eq("chain_id", chainId).eq("tx_hash", txHash.toLowerCase());
  return data ?? [];
}

/** Catch up on contributions made outside the app (for example directly from a wallet). Safe to run repeatedly. */
export async function syncAll(maxRange = 5_000n) {
  const supabase = db();
  const report: Record<number, { from: string; to: string; saved: number }> = {};
  for (const chain of liveChains()) {
    const id = chain.chain.id;
    const client = publicClient(id);
    const { data: campaigns } = await supabase.from("campaigns").select("address").eq("chain_id", id).not("address", "is", null);
    const addresses = (campaigns ?? []).map((c) => getAddress(c.address as string));
    const { data: state } = await supabase.from("sync_state").select("last_block").eq("chain_id", id).maybeSingle();
    const latest = await client.getBlockNumber();
    let from = state ? BigInt(state.last_block) + 1n : chain.fromBlock || latest - maxRange;
    if (from < 0n) from = 0n;
    let saved = 0;
    const start = from;
    while (from <= latest && addresses.length) {
      const to = from + maxRange - 1n < latest ? from + maxRange - 1n : latest;
      const logs = await client.getLogs({ address: addresses, event: contributedEvent, fromBlock: from, toBlock: to });
      const rows = await toRows(id, logs as Log[]);
      await save(rows);
      saved += rows.length;
      from = to + 1n;
    }
    await supabase.from("sync_state").upsert({ chain_id: id, last_block: Number(latest) });
    report[id] = { from: start.toString(), to: latest.toString(), saved };
  }
  return report;
}
