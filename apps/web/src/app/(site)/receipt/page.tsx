import type { Metadata } from "next";
import { ReceiptForm } from "@/components/receipt-form";
import { PageHead } from "@/components/page-head";
import { previewMode } from "@/lib/data";

export const metadata: Metadata = {
  title: "Verify a donation",
  description: "Enter a FadhiliChain donation reference to confirm it was counted, without revealing who gave it.",
  alternates: { canonical: "/receipt" },
};

export default function ReceiptIndex() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-28 sm:px-8 lg:px-14">
      <PageHead
        title="Verify a donation"
        lead="Enter your donation reference to confirm it was counted. The donor always stays private."
      />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="rounded-[32px] bg-paper p-6 ring-1 ring-ink/8 sm:p-9">
          <ReceiptForm autoFocus />
          <p className="hint mt-4">
            Your reference is on your confirmation screen and in your dashboard. It looks like <span className="tabular font-semibold text-ink">FC-3F9A-21C0-01</span>.
          </p>
          {previewMode && (
            <p className="mt-6 rounded-2xl bg-sand px-4 py-3 text-sm">
              <b>Try it:</b> <span className="tabular">FC-DEMO-01</span> is a genuine donation. <span className="tabular">FC-DEMO-EDIT-01</span> shows what happens when someone alters our records.
            </p>
          )}
        </div>
        <ol className="space-y-5">
          {[
            ["We find your donation", "We look up the reference in our records."],
            ["We check it independently", "Then we confirm it against the permanent, tamper-proof record that we don't control."],
            ["You see the result", "If anyone altered our records, including us, the check fails and shows you what changed."],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-5">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-lime text-lg font-black">{i + 1}</span>
              <div>
                <h2 className="text-lg font-extrabold">{t}</h2>
                <p className="mt-1 text-muted">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
