import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { findContribution } from "@/lib/data";
import { tokenInfo } from "@/lib/chains";
import { formatMoney } from "@/lib/money";
import { dateTimeFmt } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Receipt", robots: { index: false } };

/**
 * Study version A: a conventional confirmation built only from our database, with no link to the public record.
 * It deliberately looks like the receipts people get from typical platforms.
 */
export default async function ReceiptOnly({ params }: PageProps<"/study/receipt/[ref]">) {
  const { ref } = await params;
  const found = await findContribution(decodeURIComponent(ref));
  if (!found) notFound();
  const { record, campaign } = found;
  const token = campaign ? tokenInfo(campaign.chainId, campaign.token) : undefined;

  return (
    <div className="mx-auto max-w-lg px-5 pt-10 pb-28">
      <div className="rounded-[28px] bg-paper p-8 text-center ring-1 ring-ink/8">
        <CheckCircle2 size={48} className="mx-auto text-moss" />
        <h1 className="mt-4 text-2xl font-black tracking-tight">Thank you for your contribution</h1>
        <p className="tabular mt-6 text-4xl font-black">{token ? formatMoney(record.amount, token) : record.amount}</p>
        <p className="mt-2 text-muted">to {campaign?.title ?? "the campaign"}</p>
        <dl className="mt-8 space-y-2 border-t border-ink/8 pt-6 text-left text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Reference</dt>
            <dd className="tabular font-semibold">{record.ref}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Date</dt>
            <dd className="font-semibold">{dateTimeFmt.format(new Date(record.blockTime))}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Status</dt>
            <dd className="font-semibold">Received</dd>
          </div>
        </dl>
      </div>
      <p className="mt-4 text-center text-xs text-muted">Study version A · receipt only</p>
    </div>
  );
}
