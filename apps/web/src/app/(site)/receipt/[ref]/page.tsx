import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Check, ExternalLink, X } from "lucide-react";
import { ReceiptForm } from "@/components/receipt-form";
import { checkReceipt } from "@/lib/data";
import { tokenInfo, txUrl, chainInfo } from "@/lib/chains";
import { formatMoney, shortAddress } from "@/lib/money";
import { dateTimeFmt } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/receipt/[ref]">): Promise<Metadata> {
  const { ref } = await params;
  return { title: `Donation ${decodeURIComponent(ref).toUpperCase()}`, robots: { index: false } };
}

export default async function ReceiptPage({ params }: PageProps<"/receipt/[ref]">) {
  const { ref } = await params;
  const input = decodeURIComponent(ref);
  const result = await checkReceipt(input);

  if (!result) {
    return (
      <div className="mx-auto max-w-3xl px-5 pt-10 pb-28 sm:px-8">
        <Link href="/receipt" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink">
          <ArrowLeft size={16} /> Check another
        </Link>
        <h1 className="display mt-8 text-[clamp(2.4rem,6vw,4.5rem)]">Donation not found</h1>
        <p className="mt-5 text-lg text-muted">
          We couldn&apos;t find <span className="tabular font-semibold text-ink">{input}</span>. Check for typos. A donation made in the last minute may still be processing.
        </p>
        <div className="mt-8">
          <ReceiptForm initial={input} />
        </div>
      </div>
    );
  }

  const { record, campaign, chain, matches, mismatches } = result;
  const token = campaign ? tokenInfo(campaign.chainId, campaign.token) : undefined;
  const money = (v: string) => (token ? formatMoney(v, token) : v);
  const explorer = txUrl(record.chainId, record.txHash);
  const tampered = chain.found && !matches;

  const rows: { label: string; ours: string; theirs: string; key: string }[] = chain.found
    ? [
        { key: "amount", label: "Amount", ours: money(record.amount), theirs: money(chain.amount) },
        { key: "donor", label: "Donor", ours: "Private", theirs: "Private" },
        { key: "campaign", label: "Fundraiser", ours: campaign?.title ?? shortAddress(record.campaign), theirs: mismatches.includes("campaign") ? shortAddress(chain.campaign) : (campaign?.title ?? shortAddress(chain.campaign)) },
        { key: "block", label: "Record number", ours: record.blockNumber.toLocaleString(), theirs: chain.blockNumber.toLocaleString() },
      ]
    : [];

  return (
    <div className="mx-auto max-w-4xl px-5 pt-6 pb-28 sm:px-8">
      <Link href="/receipt" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft size={16} /> Check another
      </Link>

      <div className={`mt-8 rounded-[32px] p-7 sm:p-10 ${tampered ? "bg-danger text-cream" : chain.found ? "bg-moss text-cream" : "bg-sand"}`}>
        <div className="flex items-center gap-4">
          <span className={`grid size-12 shrink-0 place-items-center rounded-full ${tampered ? "bg-cream text-danger" : "bg-lime text-ink"}`}>
            {tampered ? <AlertTriangle size={22} /> : chain.found ? <Check size={24} strokeWidth={3} /> : <X size={22} />}
          </span>
          <h1 className="text-[clamp(1.6rem,3.5vw,2.4rem)] leading-tight font-black tracking-tight">
            {tampered ? "This record was altered" : chain.found ? "Donation verified" : "Not verified yet"}
          </h1>
        </div>
        <p className={`mt-4 max-w-[60ch] text-lg ${chain.found ? "text-cream/85" : "text-muted"}`}>
          {tampered
            ? `Someone changed our copy of this donation (${mismatches.join(", ")}). The verified record below is the one that counts, and no one can alter it, including us.`
            : chain.found
              ? `${money(chain.amount)} to ${campaign?.title ?? "a fundraiser"}, confirmed just now. The donor stays private.`
              : chain.reason}
        </p>
        <p className="tabular mt-6 text-sm opacity-75">
          Reference {record.ref} · {dateTimeFmt.format(new Date(record.blockTime))}
        </p>
      </div>

      {chain.found && (
        <div className="mt-6 overflow-hidden rounded-[28px] bg-paper ring-1 ring-ink/8">
          <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 border-b border-ink/8 px-5 py-4 text-sm font-bold sm:px-7">
            <span />
            <span>Our records</span>
            <span>Verified record</span>
          </div>
          {rows.map((r) => {
            const bad = mismatches.includes(r.key);
            return (
              <div key={r.key} className={`grid grid-cols-[1fr_1fr_1fr] items-center gap-4 border-b border-ink/6 px-5 py-4 last:border-0 sm:px-7 ${bad ? "bg-danger/8" : ""}`}>
                <span className="font-semibold">{r.label}</span>
                <span className={`tabular ${bad ? "font-bold text-danger line-through" : ""}`}>{r.ours}</span>
                <span className="tabular flex items-center gap-2 font-semibold">
                  {r.theirs} {!bad && <Check size={16} className="text-moss" />}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {campaign && (
          <Link href={`/c/${campaign.id}`} className="pill pill-ink">
            View fundraiser
          </Link>
        )}
        {explorer && (
          <a href={explorer} target="_blank" rel="noreferrer" className="pill pill-ghost">
            View independent record <ExternalLink size={16} />
          </a>
        )}
      </div>
      <p className="mt-6 text-sm text-muted">
        Record ID <span className="tabular break-all">{record.txHash}</span>
      </p>
    </div>
  );
}
