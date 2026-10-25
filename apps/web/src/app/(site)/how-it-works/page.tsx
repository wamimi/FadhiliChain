import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, EyeOff, HandCoins, Lock, PenLine, Search, Share2, ShieldCheck, Undo2 } from "lucide-react";
import { PageHead } from "@/components/page-head";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "How it works",
  description: "Start a fundraiser in minutes, accept donations from anywhere, and withdraw when you hit your goal. Donors get a full refund if you don't.",
  alternates: { canonical: "/how-it-works" },
};

const FUNDRAISER_STEPS = [
  { icon: PenLine, t: "Create your fundraiser", d: "Tell your story, set a goal and a deadline. It takes about five minutes." },
  { icon: BadgeCheck, t: "Get verified", d: "We confirm who you are and what the funds are for, usually within two days." },
  { icon: Share2, t: "Share your link", d: "On WhatsApp, X, at church or in the family group. Anyone, anywhere can donate." },
  { icon: HandCoins, t: "Withdraw your funds", d: `Hit your goal and withdraw in one tap. We keep ${SITE.feePercent}%. Miss it, and every donor is refunded.` },
];

const DONOR_STEPS = [
  { icon: Search, t: "Find a cause", d: "Every fundraiser is verified before it goes live." },
  { icon: Lock, t: "Log in and donate", d: "Use your email, Google or phone. No app or wallet needed." },
  { icon: ShieldCheck, t: "Track your donation", d: "Watch the total grow live and verify your donation any time." },
  { icon: Undo2, t: "Get refunded if the goal is missed", d: "Automatically, in full. No forms, no waiting." },
];

function Steps({ items, dark }: { items: typeof DONOR_STEPS; dark?: boolean }) {
  return (
    <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((s, i) => (
        <li key={s.t} className={`flex flex-col rounded-[28px] p-7 ${dark ? "bg-moss text-cream" : "bg-sand"}`}>
          <div className="flex items-center justify-between">
            <span className={`tabular text-4xl font-black tracking-tighter ${dark ? "text-lime" : ""}`}>0{i + 1}</span>
            <span className={`grid size-12 place-items-center rounded-full ${dark ? "bg-lime text-ink" : "bg-cream"}`}>
              <s.icon size={20} strokeWidth={2.2} />
            </span>
          </div>
          <h3 className="mt-10 text-xl font-extrabold">{s.t}</h3>
          <p className={`mt-2 leading-relaxed ${dark ? "text-cream/75" : "text-muted"}`}>{s.d}</p>
        </li>
      ))}
    </ol>
  );
}

export default function HowItWorks() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-28 sm:px-8 lg:px-14">
      <PageHead title="How it works" lead="Fundraising that's simple to start, easy to give to, and impossible to fake." />

      <section aria-labelledby="fundraisers" id="organisers" className="scroll-mt-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <h2 id="fundraisers" className="text-3xl font-black tracking-tight">For fundraisers</h2>
          <Link href="/start" className="pill pill-lime">
            Start a fundraiser <ArrowRight size={18} />
          </Link>
        </div>
        <Steps items={FUNDRAISER_STEPS} dark />
      </section>

      <section aria-labelledby="donors" className="mt-20">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <h2 id="donors" className="text-3xl font-black tracking-tight">For donors</h2>
          <Link href="/campaigns" className="pill pill-ink">
            Explore fundraisers <ArrowRight size={18} />
          </Link>
        </div>
        <Steps items={DONOR_STEPS} />
      </section>

      <section className="mt-20 grid gap-10 rounded-[36px] bg-ink p-8 text-cream sm:p-12 lg:grid-cols-2" aria-labelledby="safe">
        <div>
          <h2 id="safe" className="display text-[clamp(2.2rem,4.5vw,4rem)]">Why your money is safe</h2>
          <p className="mt-5 max-w-[40ch] text-lg text-cream/75">Built on blockchain technology, so the rules can&apos;t be bent by anyone, including us.</p>
          <Link href="/transparency" className="mt-8 inline-flex items-center gap-2 font-semibold text-lime underline underline-offset-4">
            See our live transparency report
          </Link>
        </div>
        <ul className="space-y-6">
          {[
            [Lock, "Locked until the deadline", "Funds can't be moved early by the fundraiser, by us, or by anyone else."],
            [Undo2, "Guaranteed refunds", "If the goal is missed, every donor can claim a full refund, even if FadhiliChain went offline."],
            [ShieldCheck, "Tamper-proof records", "Every donation is permanently recorded. Edit our records and the verification check fails."],
            [EyeOff, "Private by default", "Donors are never named. Your email and phone number are never shown."],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof Lock;
            return (
              <li key={t as string} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-lime text-ink">
                  <I size={20} />
                </span>
                <span>
                  <b className="block text-lg">{t as string}</b>
                  <span className="text-cream/70">{d as string}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
