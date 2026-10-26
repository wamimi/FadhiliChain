"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Copy, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "../providers";
import { useApi } from "@/lib/api";
import { tokenInfo } from "@/lib/chains";
import { formatMoney, percent, shortAddress, timeLeft } from "@/lib/money";
import { ago } from "@/lib/time";
import type { Campaign, Contribution } from "@/lib/types";

type MeResponse = {
  wallets: string[];
  campaigns: Campaign[];
  gifts: (Contribution & { campaignInfo: { id: string; title: string; token: string } | null })[];
};

const REVIEW_LABEL: Record<Campaign["reviewStatus"], string> = {
  pending: "Waiting for review",
  approved: "Live",
  rejected: "Not approved",
};
const STATUS_LABEL: Record<Campaign["status"], string> = {
  open: "Open",
  successful: "Target met: withdraw now",
  failed: "Target missed: donors refunded",
  cancelled: "Cancelled",
  withdrawn: "Paid out",
};

export function Dashboard() {
  const session = useSession();
  const api = useApi();
  const q = useQuery({
    queryKey: ["me", session.address, session.idToken],
    queryFn: () => api<MeResponse>("/api/me"),
    enabled: session.authenticated && Boolean(session.idToken),
  });

  if (!session.ready) return <Spinner />;

  if (!session.authenticated) {
    return (
      <div className="max-w-2xl pt-10">
        <h1 className="display text-[clamp(2.6rem,6vw,5rem)]">Your dashboard</h1>
        <p className="mt-5 text-lg text-muted">Sign in with your email, Google or phone to see your gifts, refunds and campaigns.</p>
        <button className="pill pill-ink mt-8" onClick={session.login}>
          Sign in
        </button>
      </div>
    );
  }

  const data = q.data;
  return (
    <div className="pt-6">
      <div className="flex flex-col justify-between gap-6 pb-10 lg:flex-row lg:items-end">
        <div>
          <h1 className="display text-[clamp(2.6rem,6vw,5rem)]">Your dashboard</h1>
          <p className="mt-4 text-muted">
            Signed in as <b className="text-ink">{session.label ?? "you"}</b>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {session.address && (
            <button
              className="tabular inline-flex items-center gap-2 rounded-full bg-sand px-4 py-2 text-sm font-semibold"
              onClick={() => navigator.clipboard.writeText(session.address!).then(() => toast("Account ID copied"))}
              title="Your account ID"
            >
              {shortAddress(session.address)} <Copy size={14} />
            </button>
          )}
          <button className="pill pill-ghost min-h-10 px-4 text-sm" onClick={() => void session.logout()}>
            <LogOut size={15} /> Log out
          </button>
        </div>
      </div>

      {q.isLoading && <Spinner />}
      {q.error && <p className="rounded-2xl bg-sand p-4">{(q.error as Error).message}</p>}

      {data && (
        <div className="grid gap-12 lg:grid-cols-2">
          <section aria-labelledby="my-campaigns">
            <div className="flex items-center justify-between">
              <h2 id="my-campaigns" className="text-2xl font-extrabold tracking-tight">
                Your campaigns
              </h2>
              <Link href="/start" className="pill pill-lime min-h-10 px-4 text-sm">
                Start one
              </Link>
            </div>
            {data.campaigns.length === 0 ? (
              <Empty text="You haven't started a fundraiser yet." />
            ) : (
              <ul className="mt-5 space-y-3">
                {data.campaigns.map((c) => {
                  const t = tokenInfo(c.chainId, c.token);
                  const live = c.reviewStatus === "approved" && c.address;
                  return (
                    <li key={c.id} className="rounded-[24px] bg-paper p-5 ring-1 ring-ink/8">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-bold">{c.title}</p>
                          <p className="mt-1 text-sm text-muted">
                            {live ? `${STATUS_LABEL[c.status]} · ${c.status === "open" ? timeLeft(c.deadline) : ""}` : REVIEW_LABEL[c.reviewStatus]}
                          </p>
                          {c.reviewStatus === "rejected" && c.reviewNote && <p className="mt-2 text-sm">Reviewer: {c.reviewNote}</p>}
                        </div>
                        {live && (
                          <Link href={`/c/${c.id}`} className="pill pill-ink min-h-10 shrink-0 px-4 text-sm">
                            Open
                          </Link>
                        )}
                      </div>
                      {live && t && (
                        <p className="tabular mt-3 text-sm">
                          <b>{formatMoney(c.raised, t)}</b> of {formatMoney(c.target, t)} · {Math.round(percent(BigInt(c.raised), BigInt(c.target)))}%
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="my-gifts">
            <h2 id="my-gifts" className="text-2xl font-extrabold tracking-tight">
              Your gifts
            </h2>
            {data.gifts.length === 0 ? (
              <Empty text="Gifts you make while signed in appear here, with their receipts." action={{ href: "/campaigns", label: "Browse campaigns" }} />
            ) : (
              <ul className="mt-5 divide-y divide-ink/8 rounded-[24px] bg-paper ring-1 ring-ink/8">
                {data.gifts.map((g) => {
                  const t = g.campaignInfo ? tokenInfo(g.chainId, g.campaignInfo.token) : undefined;
                  return (
                    <li key={g.ref} className="flex items-start justify-between gap-4 px-5 py-4">
                      <div className="min-w-0">
                        <p className="font-semibold">
                          {g.campaignInfo ? <Link href={`/c/${g.campaignInfo.id}`} className="hover:underline">{g.campaignInfo.title}</Link> : "A campaign"}
                        </p>
                        <p className="mt-1 text-sm text-muted">
                          {ago(g.blockTime)} ·{" "}
                          <Link href={`/receipt/${g.ref}`} className="tabular hover:underline">
                            {g.ref}
                          </Link>
                        </p>
                      </div>
                      <p className="tabular shrink-0 font-extrabold">{t ? formatMoney(g.amount, t) : g.amount}</p>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="hint mt-4">If a campaign you gave to misses its target, open it to take your money back.</p>
          </section>
        </div>
      )}
    </div>
  );
}

function Empty({ text, action }: { text: string; action?: { href: string; label: string } }) {
  return (
    <div className="mt-5 rounded-[24px] bg-sand p-6">
      <p className="text-muted">{text}</p>
      {action && (
        <Link href={action.href} className="pill pill-ink mt-4 min-h-10 px-4 text-sm">
          {action.label}
        </Link>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <p className="flex items-center gap-2 py-16 text-muted">
      <Loader2 className="animate-spin" size={18} /> Loading
    </p>
  );
}
