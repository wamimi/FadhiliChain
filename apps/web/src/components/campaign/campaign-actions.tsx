"use client";

import { useEffect, useState } from "react";
import { useConfig } from "wagmi";
import { readContract } from "@wagmi/core";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Address } from "viem";
import { campaignAbi } from "@fadhili/contracts/abi";
import { useSession } from "../providers";
import { useApi } from "@/lib/api";
import { campaignAction, friendlyError, nativeBalance } from "@/lib/tx";
import { formatMoney } from "@/lib/money";
import type { TokenInfo } from "@/lib/chains";
import type { ChainStatus } from "@/lib/types";

type Props = {
  chainId: number;
  campaign: Address;
  recipient: Address;
  organiser: Address;
  status: ChainStatus;
  token: TokenInfo;
  feeBps: number;
  raised: string;
  preview: boolean;
};

/** Withdraw (recipient), refund (donor) and cancel (organiser) controls, shown only to the person who can use them. */
export function CampaignActions(p: Props) {
  const session = useSession();
  const config = useConfig();
  const api = useApi();
  const router = useRouter();
  const [refundable, setRefundable] = useState<bigint>(0n);
  const [busy, setBusy] = useState<string | null>(null);
  const me = session.address;

  useEffect(() => {
    if (!me || p.preview || (p.status !== "failed" && p.status !== "cancelled")) return;
    readContract(config, { chainId: p.chainId, address: p.campaign, abi: campaignAbi, functionName: "refundableOf", args: [me] })
      .then(setRefundable)
      .catch(() => {});
  }, [me, p.chainId, p.campaign, p.status, p.preview, config]);

  if (!me || p.preview) return null;

  async function run(action: "withdraw" | "claimRefund" | "cancel", label: string) {
    setBusy(label);
    try {
      if ((await nativeBalance(config, p.chainId, me!)) < 10n ** 14n)
        await api("/api/gas", { method: "POST", json: { chainId: p.chainId, address: me } }).catch(() => {});
      await campaignAction(config, p.chainId, p.campaign, action);
      toast.success(action === "withdraw" ? "Funds sent to your account" : action === "claimRefund" ? "Refund sent to your account" : "Fundraiser closed. Donors can now claim refunds.");
      router.refresh();
    } catch (e) {
      toast.error(friendlyError(e));
    }
    setBusy(null);
  }

  const isRecipient = me === p.recipient;
  const isOrganiser = me === p.organiser;
  const fee = (BigInt(p.raised) * BigInt(p.feeBps)) / 10_000n;

  return (
    <div className="space-y-3">
      {isRecipient && p.status === "successful" && (
        <div className="rounded-[24px] bg-lime p-6">
          <p className="text-lg font-extrabold">Goal reached. Your funds are ready.</p>
          <p className="tabular mt-1 text-sm">
            You receive {formatMoney(BigInt(p.raised) - fee, p.token)}
            {p.feeBps > 0 && ` after the ${p.feeBps / 100}% platform fee`}.
          </p>
          <button type="button" className="pill pill-ink mt-4 w-full" disabled={!!busy} onClick={() => run("withdraw", "withdraw")}>
            {busy === "withdraw" ? <Loader2 size={18} className="animate-spin" /> : "Withdraw funds"}
          </button>
        </div>
      )}
      {refundable > 0n && (
        <div className="rounded-[24px] bg-sand p-6">
          <p className="text-lg font-extrabold">{formatMoney(refundable, p.token)} is ready to refund</p>
          <p className="mt-1 text-sm text-muted">{p.status === "cancelled" ? "This fundraiser was closed." : "This fundraiser missed its goal."} Your full donation is waiting for you.</p>
          <button type="button" className="pill pill-ink mt-4 w-full" disabled={!!busy} onClick={() => run("claimRefund", "refund")}>
            {busy === "refund" ? <Loader2 size={18} className="animate-spin" /> : "Claim my refund"}
          </button>
        </div>
      )}
      {isOrganiser && p.status === "open" && (
        <details className="rounded-[24px] p-4 ring-1 ring-ink/10">
          <summary className="cursor-pointer text-sm font-semibold">Fundraiser settings</summary>
          <p className="mt-3 text-sm text-muted">Closing your fundraiser refunds every donor in full. This can&apos;t be undone.</p>
          <button
            type="button"
            className="pill pill-ghost mt-3 w-full text-danger"
            disabled={!!busy}
            onClick={() => {
              if (window.confirm("Close this fundraiser and refund every donor?")) void run("cancel", "cancel");
            }}
          >
            {busy === "cancel" ? <Loader2 size={18} className="animate-spin" /> : "Close fundraiser"}
          </button>
        </details>
      )}
    </div>
  );
}
