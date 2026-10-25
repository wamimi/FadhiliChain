"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useConfig } from "wagmi";
import { waitForTransactionReceipt, writeContract } from "@wagmi/core";
import { Check, Loader2, Lock, X } from "lucide-react";
import { toast } from "sonner";
import { campaignFactoryAbi } from "@fadhili/contracts/abi";
import { useSession } from "../providers";
import { useApi } from "@/lib/api";
import { chainInfo, tokenInfo } from "@/lib/chains";
import { formatMoney, shortAddress } from "@/lib/money";
import { dateTimeFmt } from "@/lib/time";
import { categoryLabel } from "@/lib/site";
import { requestFromJson, type CampaignRequestJson } from "@/lib/eip712";
import { ensureChain, friendlyError, nativeBalance } from "@/lib/tx";
import { storyHash } from "@/lib/metadata";
import type { Campaign } from "@/lib/types";

type Item = {
  campaign: Campaign;
  request: CampaignRequestJson;
  signature: `0x${string}`;
  private: { organiser_contact: string; documents_note: string | null } | null;
};

export function ReviewQueue() {
  const session = useSession();
  const api = useApi();
  const q = useQuery({
    queryKey: ["reviews", session.idToken],
    queryFn: () => api<{ reviewer: boolean; items: Item[] }>("/api/reviews"),
    enabled: session.authenticated && Boolean(session.idToken),
  });

  if (!session.authenticated) {
    return (
      <div className="max-w-2xl pt-10">
        <h1 className="display text-[clamp(2.6rem,6vw,5rem)]">Review queue</h1>
        <p className="mt-5 text-lg text-muted">For reviewers. Sign in with the account that holds the reviewer role.</p>
        <button className="pill pill-ink mt-8" onClick={session.login}>
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="pt-6">
      <h1 className="display text-[clamp(2.6rem,6vw,5rem)]">Review queue</h1>
      <p className="mt-4 max-w-[62ch] text-muted">
        Call the organiser, check their evidence, then approve. Approving creates the campaign contract with exactly the terms the organiser signed; you can approve or decline, but you can&apos;t edit them.
      </p>
      <div className="mt-10">
        {q.isLoading && (
          <p className="flex items-center gap-2 text-muted">
            <Loader2 size={18} className="animate-spin" /> Loading
          </p>
        )}
        {q.error && <p className="rounded-2xl bg-sand p-4">{(q.error as Error).message}</p>}
        {q.data && !q.data.reviewer && (
          <p className="rounded-2xl bg-sand p-5">
            This account doesn&apos;t hold the reviewer role. Your account address is <span className="tabular font-semibold">{session.address}</span>; an administrator can grant access to it.
          </p>
        )}
        {q.data?.reviewer && q.data.items.length === 0 && <p className="rounded-2xl bg-sand p-5">Nothing waiting for review.</p>}
        <div className="space-y-6">{q.data?.items.map((it) => <ReviewCard key={it.campaign.id} item={it} />)}</div>
      </div>
    </div>
  );
}

function ReviewCard({ item }: { item: Item }) {
  const { campaign: c } = item;
  const config = useConfig();
  const api = useApi();
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const token = tokenInfo(c.chainId, c.token);
  const chain = chainInfo(c.chainId);
  const req = requestFromJson(item.request);
  const expired = Number(req.expiry) * 1000 < Date.now();
  const storyOk = storyHash(c) === c.metadataHash;

  async function approve() {
    if (!chain?.factory) return;
    try {
      setBusy("Preparing");
      const me = await ensureChain(config, c.chainId);
      if ((await nativeBalance(config, c.chainId, me)) < 10n ** 15n) {
        await api("/api/gas", { method: "POST", json: { chainId: c.chainId, address: me } }).catch(() => {});
      }
      setBusy("Creating the campaign");
      const hash = await writeContract(config, {
        chainId: c.chainId,
        address: chain.factory,
        abi: campaignFactoryAbi,
        functionName: "createCampaign",
        args: [req, item.signature],
      });
      await waitForTransactionReceipt(config, { chainId: c.chainId, hash });
      setBusy("Recording approval");
      await api(`/api/campaigns/${c.id}`, { method: "PATCH", json: { action: "approve", txHash: hash } });
      toast.success("Campaign is live");
      qc.invalidateQueries({ queryKey: ["reviews"] });
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setBusy(null);
    }
  }

  async function reject() {
    try {
      setBusy("Declining");
      await api(`/api/campaigns/${c.id}`, { method: "PATCH", json: { action: "reject", note } });
      toast("Declined. The organiser will see your note.");
      qc.invalidateQueries({ queryKey: ["reviews"] });
    } catch (e) {
      toast.error(friendlyError(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <article className="grid gap-8 rounded-[32px] bg-paper p-6 ring-1 ring-ink/8 sm:p-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]">
      <div className="min-w-0">
        <p className="flex flex-wrap gap-2 text-sm font-bold">
          <span className="rounded-full bg-sand px-3 py-1.5">{categoryLabel(c.category)}</span>
          <span className="rounded-full bg-sand px-3 py-1.5">{c.location}</span>
          <span className="rounded-full bg-sand px-3 py-1.5">Submitted {dateTimeFmt.format(new Date(c.createdAt))}</span>
        </p>
        <h2 className="mt-4 text-2xl font-black tracking-tight">{c.title}</h2>
        <p className="mt-2 text-muted">
          By <b className="text-ink">{c.organiserName}</b> for <b className="text-ink">{c.beneficiary}</b>
        </p>
        <p className="mt-4 font-medium">{c.summary}</p>
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-semibold">Full story</summary>
          <div className="prose-body mt-3 text-[0.98rem] leading-relaxed text-ink/85">
            {c.story.split(/\n{2,}/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </details>
        <div className="mt-5 rounded-2xl bg-sand p-4 text-sm">
          <p>
            <b>Contact:</b> {item.private?.organiser_contact ?? "not given"}
          </p>
          {item.private?.documents_note && (
            <p className="mt-1">
              <b>Evidence offered:</b> {item.private.documents_note}
            </p>
          )}
        </div>
      </div>
      <div>
        <div className="rounded-[24px] bg-ink p-5 text-cream">
          <p className="flex items-center gap-2 text-sm font-semibold text-lime">
            <Lock size={14} /> Signed terms
          </p>
          <dl className="mt-3 space-y-2 text-sm">
            <Row k="Target" v={token ? formatMoney(req.target, token) : req.target.toString()} />
            <Row k="Deadline" v={dateTimeFmt.format(Number(req.deadline) * 1000)} />
            <Row k="Pays to" v={shortAddress(req.recipient)} />
            <Row k="Organiser" v={shortAddress(req.organiser)} />
            <Row k="Network" v={chain?.name ?? String(c.chainId)} />
            <Row k="Signature valid until" v={dateTimeFmt.format(Number(req.expiry) * 1000)} />
            <Row k="Story matches signature" v={storyOk ? "Yes" : "No"} />
          </dl>
        </div>
        {expired && <p className="mt-3 text-sm text-danger">This signature has expired. Ask the organiser to submit again.</p>}
        {!rejecting ? (
          <div className="mt-5 flex flex-wrap gap-3">
            <button className="pill pill-ink" onClick={approve} disabled={Boolean(busy) || expired || !storyOk}>
              {busy ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />} {busy ?? "Approve and publish"}
            </button>
            <button className="pill pill-ghost" onClick={() => setRejecting(true)} disabled={Boolean(busy)}>
              <X size={18} /> Decline
            </button>
          </div>
        ) : (
          <div className="mt-5">
            <label className="label" htmlFor={`note-${c.id}`}>
              Reason, shown to the organiser
            </label>
            <textarea id={`note-${c.id}`} className="field min-h-24" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="mt-3 flex gap-3">
              <button className="pill pill-ink" onClick={reject} disabled={note.trim().length < 5 || Boolean(busy)}>
                {busy ?? "Decline campaign"}
              </button>
              <button className="pill pill-ghost" onClick={() => setRejecting(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-cream/65">{k}</dt>
      <dd className="tabular text-right font-semibold">{v}</dd>
    </div>
  );
}
