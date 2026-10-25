import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { PageHead } from "@/components/page-head";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing",
  description: `${SITE.feePercent}% only when you hit your goal. No setup fees, no donor fees, free refunds.`,
  alternates: { canonical: "/fees" },
};

const kes = new Intl.NumberFormat("en-KE");
const EXAMPLES = [50_000, 200_000, 1_000_000];

export default function Fees() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-28 sm:px-8 lg:px-14">
      <PageHead title="Simple, success-based pricing" lead={`No setup fees. No donor fees. No hidden charges. You pay ${SITE.feePercent}% only when you hit your goal.`} />

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded-[36px] bg-lime p-8 sm:p-12">
          <p className="display text-[clamp(5rem,14vw,11rem)]">{SITE.feePercent}%</p>
          <p className="mt-4 max-w-[34ch] text-xl font-semibold">of funds raised, only when you hit your goal.</p>
        </div>
        <ul className="space-y-3 self-center">
          {[
            ["Goal missed", "0%. Every donor gets a full refund."],
            ["Fundraiser closed", "0%. Every donor gets a full refund."],
            ["Donors", "Nothing added on top. Every shilling donated goes to the fundraiser."],
            ["Transaction costs", "Covered by us, always."],
            ["Locked rate", "The rate you start with can never be raised."],
          ].map(([t, d]) => (
            <li key={t} className="flex gap-4 rounded-[24px] bg-paper p-5 ring-1 ring-ink/8">
              <Check className="mt-0.5 shrink-0 text-moss" />
              <span>
                <b>{t}.</b> <span className="text-muted">{d}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <section className="mt-20" aria-labelledby="compare">
        <h2 id="compare" className="text-3xl font-black tracking-tight">
          What you keep
        </h2>
        <p className="mt-2 max-w-[60ch] text-muted">
          Compared with M-Changa&apos;s published platform fee of {SITE.competitorFeePercent}% on every donation, charged whether or not you hit your goal.
        </p>
        <div className="mt-8 overflow-x-auto rounded-[28px] bg-paper ring-1 ring-ink/8">
          <table className="tabular w-full min-w-[560px] text-left">
            <thead className="bg-ink text-cream">
              <tr>
                <th className="px-6 py-4 font-semibold">Raised</th>
                <th className="px-6 py-4 font-semibold">M-Changa ({SITE.competitorFeePercent}%)</th>
                <th className="bg-lime px-6 py-4 font-black text-ink">FadhiliChain ({SITE.feePercent}%)</th>
                <th className="px-6 py-4 font-semibold">You keep more</th>
              </tr>
            </thead>
            <tbody>
              {EXAMPLES.map((n) => {
                const theirs = (n * SITE.competitorFeePercent) / 100;
                const ours = (n * SITE.feePercent) / 100;
                return (
                  <tr key={n} className="border-t border-ink/8">
                    <td className="px-6 py-4 font-bold">KSh {kes.format(n)}</td>
                    <td className="px-6 py-4">KSh {kes.format(n - theirs)}</td>
                    <td className="bg-lime/25 px-6 py-4 font-bold">KSh {kes.format(n - ours)}</td>
                    <td className="px-6 py-4 font-semibold text-moss">+ KSh {kes.format(theirs - ours)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="hint mt-4">
          M-Changa fee from{" "}
          <a href="https://mchanga.africa/fees" className="underline" target="_blank" rel="noreferrer">
            mchanga.africa/fees
          </a>
          , checked October 2026.
        </p>
      </section>

      <section className="mt-20 rounded-[36px] bg-moss p-8 text-cream sm:p-12">
        <h2 className="text-3xl font-black tracking-tight">Withdrawing your funds</h2>
        <p className="mt-4 max-w-[62ch] text-lg text-cream/85">
          Funds arrive in the currency you raised in. Hold them, send them on, or cash out through a partner. Direct M-Pesa withdrawals are coming soon.
        </p>
        <Link href="/start" className="pill pill-lime mt-8">
          Start a fundraiser
        </Link>
      </section>
    </div>
  );
}
