"use client";
import { getConnection, readContract, switchChain, waitForTransactionReceipt, writeContract, getBalance, type Config } from "@wagmi/core";
import { BaseError, ContractFunctionRevertedError, erc20Abi, type Address, type Hex } from "viem";
import { campaignAbi } from "@fadhili/contracts/abi";

/**
 * The account the app should sign with (the user's FadhiliChain account) and a way to make it the active one.
 * Registered by the session provider, so a browser extension wallet that happens to be connected is never used by mistake.
 */
let expected: { address: Address; activate: () => Promise<void> } | null = null;
export function setExpectedAccount(next: typeof expected) {
  expected = next;
}

export async function ensureChain(config: Config, chainId: number) {
  let conn = getConnection(config);
  if (expected && conn.address?.toLowerCase() !== expected.address.toLowerCase()) {
    await expected.activate();
    conn = getConnection(config);
    if (conn.address?.toLowerCase() !== expected.address.toLowerCase()) {
      throw new Error("Your FadhiliChain account is still loading. Try again in a moment.");
    }
  }
  if (!conn.address) throw new Error("Your account is still loading. Try again in a moment.");
  if (conn.chainId !== chainId) await switchChain(config, { chainId });
  return conn.address as Address;
}

export async function nativeBalance(config: Config, chainId: number, address: Address) {
  return (await getBalance(config, { chainId, address })).value;
}

export async function tokenBalance(config: Config, chainId: number, token: Address, address: Address) {
  return readContract(config, { chainId, address: token, abi: erc20Abi, functionName: "balanceOf", args: [address] });
}

async function send(config: Config, chainId: number, request: Parameters<typeof writeContract>[1]) {
  const hash = await writeContract(config, { ...request, chainId } as Parameters<typeof writeContract>[1]);
  const receipt = await waitForTransactionReceipt(config, { chainId, hash });
  if (receipt.status !== "success") throw new Error("The network rejected the transaction. Nothing was taken.");
  return hash;
}

export type GiveStep = "approve" | "contribute";

/** Approve the campaign to take `amount`, then contribute it. Returns the contribution transaction hash. */
export async function give(
  config: Config,
  opts: { chainId: number; token: Address; campaign: Address; amount: bigint; onStep?: (s: GiveStep) => void },
): Promise<Hex> {
  const owner = await ensureChain(config, opts.chainId);
  const allowance = await readContract(config, {
    chainId: opts.chainId,
    address: opts.token,
    abi: erc20Abi,
    functionName: "allowance",
    args: [owner, opts.campaign],
  });
  if (allowance < opts.amount) {
    opts.onStep?.("approve");
    await send(config, opts.chainId, { address: opts.token, abi: erc20Abi, functionName: "approve", args: [opts.campaign, opts.amount] });
  }
  opts.onStep?.("contribute");
  return send(config, opts.chainId, { address: opts.campaign, abi: campaignAbi, functionName: "contribute", args: [opts.amount] });
}

export async function campaignAction(config: Config, chainId: number, campaign: Address, action: "withdraw" | "claimRefund" | "cancel") {
  await ensureChain(config, chainId);
  return send(config, chainId, { address: campaign, abi: campaignAbi, functionName: action, args: [] });
}

const FRIENDLY: Record<string, string> = {
  NotOpen: "This campaign is no longer accepting contributions.",
  NotSuccessful: "The campaign hasn't met its target yet, or the deadline hasn't passed.",
  RefundsNotOpen: "Refunds open only if the campaign misses its target or is cancelled.",
  NothingToRefund: "There's nothing to refund for this account.",
  NotAuthorised: "This account isn't allowed to do that.",
  AlreadyFinalised: "This campaign has already been closed.",
  InvalidNonce: "This request is out of date. Ask the organiser to sign again.",
  RequestExpired: "This request has expired. Ask the organiser to sign again.",
  InvalidDuration: "The deadline is too close or too far away.",
  TokenNotAllowed: "That currency isn't accepted right now.",
  AccessControlUnauthorizedAccount: "Your account doesn't have reviewer access.",
};

export function friendlyError(e: unknown): string {
  if (e instanceof BaseError) {
    const revert = e.walk((err) => err instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) {
      const name = revert.data?.errorName;
      if (name && FRIENDLY[name]) return FRIENDLY[name];
    }
    const msg = e.shortMessage || e.message;
    if (/rejected|denied|cancel/i.test(msg)) return "You cancelled. Nothing was taken.";
    if (/insufficient funds/i.test(msg)) return "There isn't enough to pay the network fee. Try again in a moment while we top you up.";
    return msg;
  }
  if (e instanceof Error) return e.message;
  return "Something went wrong. Please try again.";
}
