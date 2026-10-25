import Link from "next/link";
import { ArrowRight, BadgeCheck, Check, EyeOff, Globe, HandCoins, Lock, PenLine, Share2, ShieldCheck, Undo2, Wallet, X, Zap, Fingerprint } from "lucide-react";
import { Hero } from "@/components/home/hero";
import { Reveal } from "@/components/reveal";
import { CampaignCard } from "@/components/campaign-card";
import { ReceiptForm } from "@/components/receipt-form";
import { SiteFooter } from "@/components/site-footer";
import { PreviewNotice } from "@/components/preview-notice";
import { FaqAccordion } from "@/components/faq-accordion";
import { CurrencyBadge, type CurrencyCode } from "@/components/currency-badge";
import { listCampaigns, previewMode } from "@/lib/data";
import { HOME_FAQ } from "@/lib/faq";
import { SITE } from "@/lib/site";

export const revalidate = 60;

const FACTS = [
  { big: `${SITE.feePercent}%`, small: "fee, only when you hit your goal" },
  { big: "100%", small: "refunded to donors if you don't" },
  { big: "24/7", small: "live tracking of every donation" },
  { big: "0", small: "donor names made public" },
];

const COMPARISON = [
  { q: "Where your money sits", usual: "In the platform's own account", ours: "In a secure, auditable account no one can touch early. Not even us." },
  { q: "Proof of the total", usual: "You take the platform's word for it", ours: "Every donation verified in real time" },
  { q: "If the goal is missed", usual: "Funds are usually released anyway", ours: "Every donor refunded in full" },
  { q: "Donor privacy", usual: "Names often shown publicly", ours: "Anonymous by default" },
  { q: "Fees", usual: `Up to ${SITE.competitorFeePercent}% of every donation`, ours: `${SITE.feePercent}%, only if you hit your goal` },
];

const STEPS = [
  { icon: PenLine, title: "Create your fundraiser", body: "Tell your story and set a goal. We verify every fundraiser before it goes live." },
  { icon: Share2, title: "Share your link", body: "Anyone, anywhere can donate in shillings or stablecoins in seconds." },
  { icon: HandCoins, title: "Receive your funds", body: "Hit your goal and withdraw in one tap. Miss it, and every donor is refunded." },
];

const FUNDRAISERS = [
  { icon: Globe, title: "Raise from anyone, anywhere", body: "Locals give in shillings. The world gives in digital dollars." },
  { icon: BadgeCheck, title: "Credibility built in", body: "Donors can verify every shilling themselves." },
  { icon: Wallet, title: "Keep more of what you raise", body: `${SITE.feePercent}% only when you succeed.` },
  { icon: Zap, title: "Withdraw in one tap", body: "No paperwork, no waiting on approvals." },
];

const DONORS = [
  { icon: ShieldCheck, title: "See where your money goes", body: "Every donation tracked, live." },
  { icon: Undo2, title: "Full refund if the goal is missed", body: "Automatically. No forms." },
  { icon: EyeOff, title: "Give privately", body: "Your name is never shown." },
  { icon: Lock, title: "No app, no wallet", body: "Log in with email, Google or phone." },
];

const CURRENCIES: { code: CurrencyCode; name: string; note: string; soon?: boolean }[] = [
  { code: "KESm", name: "Digital Kenyan shilling", note: "1 KESm = 1 KSh" },
  { code: "USDm", name: "Digital US dollar", note: "1 USDm = 1 USD" },
  { code: "USDC", name: "Digital US dollar", note: "1 USDC = 1 USD" },
  { code: "USDT", name: "Digital US dollar", note: "Coming soon", soon: true },
  { code: "KES", name: "Kenyan shilling, via M-Pesa", note: "Coming soon", soon: true },
];

const PRIVACY = [
  { icon: EyeOff, title: "Anonymous by default", body: "Fundraisers see totals, not who gave. Your name, email and phone number are never published." },
  { icon: Fingerprint, title: "Verify without exposing", body: "Your donation reference proves your gift was counted, without revealing who you are." },
  { icon: ShieldCheck, title: "Your data stays yours", body: "We collect only what we need, never sell it, and design around Kenya's Data Protection Act." },
];

function Head({ id, title, lead, tone = "dark" }: { id: string; title: string; lead?: string; tone?: "dark" | "light" }) {
  return (
    <Reveal className="mb-14 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
      <h2 id={id} className="display max-w-[14ch] text-[clamp(2.6rem,6vw,5.6rem)]">
        {title}
      </h2>
      {lead && <p className={`max-w-[40ch] text-lg leading-relaxed ${tone === "light" ? "text-cream/70" : "text-muted"}`}>{lead}</p>}
    </Reveal>
  );
}

export default async function Home() {
  const campaigns = await listCampaigns({ limit: 3 }).catch((e) => {
    console.error("Could not load fundraisers", e);
    return [];
  });

  return (
    <>
      <main id="main">
        <Hero />

        {/* Facts */}
        <section className="border-y-[3px] border-ink bg-lime px-5 sm:px-8 lg:px-14" aria-label="At a glance">
          <dl className="mx-auto grid max-w-[1400px] grid-cols-2 divide-ink/15 lg:grid-cols-4 lg:divide-x">
            {FACTS.map((f) => (
              <div key={f.small} className="px-2 py-7 lg:px-8">
                <dt className="sr-only">{f.small}</dt>
                <dd>
                  <span className="tabular block text-[clamp(2rem,3.4vw,3rem)] leading-none font-black tracking-tight">{f.big}</span>
                  <span className="mt-2 block text-[0.95rem] font-semibold text-ink/75">{f.small}</span>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Trust vs proof */}
        <section className="bg-cream px-5 py-[clamp(90px,11vw,160px)] sm:px-8 lg:px-14" aria-labelledby="why">
          <div className="mx-auto max-w-[1400px]">
            <Head id="why" title="Most fundraisers run on trust. Ours run on proof." lead="On most platforms, you take their word for where your money is. Here, you can see it." />
            <Reveal>
              <div className="overflow-hidden rounded-[36px] bg-paper ring-1 ring-ink/8">
                <div className="hidden grid-cols-[1fr_1.2fr_1.2fr] bg-ink text-cream md:grid">
                  <span className="px-8 py-5" />
                  <span className="px-8 py-5 font-semibold">Typical platforms</span>
                  <span className="bg-lime px-8 py-5 font-black text-ink">FadhiliChain</span>
                </div>
                {COMPARISON.map((r) => (
                  <div key={r.q} className="grid border-t border-ink/8 first:border-t-0 md:grid-cols-[1fr_1.2fr_1.2fr] md:first:border-t">
                    <span className="px-6 pt-6 font-extrabold md:px-8 md:py-6">{r.q}</span>
                    <span className="flex gap-3 px-6 pt-3 text-muted md:px-8 md:py-6">
                      <X size={18} className="mt-1 shrink-0 text-danger" aria-label="Typical platforms" />
                      {r.usual}
                    </span>
                    <span className="flex gap-3 bg-lime/25 px-6 pt-3 pb-6 font-semibold md:px-8 md:py-6">
                      <Check size={18} className="mt-1 shrink-0 text-moss" aria-label="FadhiliChain" />
                      {r.ours}
                    </span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-cream px-5 pb-[clamp(90px,11vw,160px)] sm:px-8 lg:px-14" aria-labelledby="how">
          <div className="mx-auto max-w-[1400px]">
            <Head id="how" title="Start raising in minutes" />
            <div className="grid gap-5 lg:grid-cols-3">
              {STEPS.map((s, i) => (
                <Reveal key={s.title} delay={i * 0.08} className={`flex min-h-[340px] flex-col justify-between rounded-[36px] p-9 ${["bg-moss text-cream", "bg-sand", "bg-lime"][i]}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[5.5rem] leading-[0.8] font-black tracking-tighter ${i === 0 ? "text-lime" : ""}`}>0{i + 1}</span>
                    <span className={`grid size-16 place-items-center rounded-full ${i === 0 ? "bg-cream/12" : "bg-cream"}`}>
                      <s.icon size={26} strokeWidth={2.2} />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-[1.75rem] leading-tight font-extrabold tracking-tight">{s.title}</h3>
                    <p className={`mt-2 text-[1.05rem] leading-relaxed ${i === 0 ? "text-cream/80" : "text-ink/75"}`}>{s.body}</p>
                    {i === 1 && (
                      <div className="mt-5 flex -space-x-2" aria-label="Accepted currencies: KESm, USDm, USDC and USDT">
                        {(["KESm", "USDm", "USDC", "USDT"] as const).map((code) => (
                          <span key={code} className="rounded-full ring-4 ring-sand">
                            <CurrencyBadge code={code} size={40} />
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="bg-sand px-5 py-[clamp(90px,11vw,160px)] sm:px-8 lg:px-14" aria-label="Benefits">
          <div className="mx-auto grid max-w-[1400px] gap-5 lg:grid-cols-2">
            {[
              { tag: "For fundraisers", title: "Raise more. Prove everything.", items: FUNDRAISERS, cta: { href: "/start", label: "Start a fundraiser" }, dark: true },
              { tag: "For donors", title: "Give with total confidence.", items: DONORS, cta: { href: "/campaigns", label: "Explore fundraisers" }, dark: false },
            ].map((b, i) => (
              <Reveal key={b.tag} delay={i * 0.08} className={`rounded-[36px] p-9 sm:p-12 ${b.dark ? "bg-ink text-cream" : "bg-paper"}`}>
                <p className={`mb-6 inline-block rounded-full px-3.5 py-1.5 text-sm font-bold ${b.dark ? "bg-lime text-ink" : "bg-moss text-cream"}`}>{b.tag}</p>
                <h2 className="display text-[clamp(2.2rem,4vw,3.8rem)]">{b.title}</h2>
                <ul className="mt-10 grid gap-6 sm:grid-cols-2">
                  {b.items.map((it) => (
                    <li key={it.title} className="flex gap-4">
                      <span className={`grid size-11 shrink-0 place-items-center rounded-full ${b.dark ? "bg-lime text-ink" : "bg-sand"}`}>
                        <it.icon size={20} strokeWidth={2.2} />
                      </span>
                      <span>
                        <b className="block leading-snug">{it.title}</b>
                        <span className={b.dark ? "text-cream/65" : "text-muted"}>{it.body}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <Link href={b.cta.href} className={`pill mt-10 ${b.dark ? "pill-lime" : "pill-ink"}`}>
                  {b.cta.label} <ArrowRight size={18} strokeWidth={2.4} />
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Currencies */}
        <section className="bg-cream px-5 py-[clamp(90px,11vw,160px)] sm:px-8 lg:px-14" aria-labelledby="pay">
          <div className="mx-auto grid max-w-[1400px] items-center gap-14 lg:grid-cols-2">
            <Reveal>
              <h2 id="pay" className="display text-[clamp(2.6rem,6vw,5.6rem)]">
                Accept money from anywhere
              </h2>
              <p className="mt-7 max-w-[44ch] text-lg leading-relaxed text-muted">
                Donate in Kenyan shillings or stablecoins: digital shillings and dollars that hold their value and cross borders in seconds.
              </p>
            </Reveal>
            <Reveal delay={0.08} className="grid gap-3 sm:grid-cols-2">
              {CURRENCIES.map((c) => (
                <div key={c.code} className="flex items-center gap-4 rounded-[24px] bg-paper p-5 ring-1 ring-ink/8 last:sm:col-span-2">
                  <CurrencyBadge code={c.code} size={52} />
                  <div className="min-w-0">
                    <p className="font-extrabold">{c.code === "KES" ? "KES" : c.code}</p>
                    <p className="text-sm text-muted">{c.name}</p>
                    <p className={`mt-1 text-sm font-semibold ${c.soon ? "text-muted" : "text-moss"}`}>{c.note}</p>
                  </div>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* Privacy */}
        <section className="grid-bg bg-moss px-5 py-[clamp(90px,11vw,160px)] text-cream sm:px-8 lg:px-14" aria-labelledby="privacy">
          <div className="mx-auto max-w-[1400px]">
            <Head id="privacy" tone="light" title="Give privately. Prove everything." lead="Transparency for the money. Privacy for the people." />
            <div className="grid gap-5 md:grid-cols-3">
              {PRIVACY.map((p, i) => (
                <Reveal key={p.title} delay={i * 0.08} className="rounded-[32px] border border-cream/20 bg-cream/8 p-8 backdrop-blur-sm">
                  <span className="grid size-14 place-items-center rounded-full bg-lime text-ink">
                    <p.icon size={24} strokeWidth={2.2} />
                  </span>
                  <h3 className="mt-8 text-2xl font-extrabold tracking-tight">{p.title}</h3>
                  <p className="mt-2 leading-relaxed text-cream/75">{p.body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Fundraisers */}
        <section className="bg-moss-deep px-5 py-[clamp(90px,11vw,160px)] text-cream sm:px-8 lg:px-14" aria-labelledby="open">
          <div className="mx-auto max-w-[1400px]">
            <Reveal className="mb-14 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <h2 id="open" className="display text-[clamp(2.6rem,6vw,5.6rem)]">
                Fundraisers you can support
              </h2>
              <Link href="/campaigns" className="inline-flex shrink-0 items-center gap-2 font-semibold whitespace-nowrap text-lime hover:underline">
                See all fundraisers <ArrowRight size={17} />
              </Link>
            </Reveal>
            {previewMode && <PreviewNotice className="mb-6" />}
            {campaigns.length ? (
              <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr_1fr]">
                {campaigns.map((c, i) => (
                  <Reveal key={c.id} delay={i * 0.08} className="flex">
                    <CampaignCard campaign={c} big={i === 0} />
                  </Reveal>
                ))}
              </div>
            ) : (
              <div className="rounded-[32px] border-[1.5px] border-dashed border-cream/25 p-12 text-center">
                <p className="text-xl font-bold">The first fundraisers are being verified.</p>
                <Link href="/start" className="pill pill-lime mt-6">
                  Start a fundraiser
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Verify */}
        <section className="grid grid-cols-[minmax(0,1fr)] items-center gap-14 bg-sand px-5 py-[clamp(90px,11vw,160px)] sm:px-8 lg:grid-cols-2 lg:px-14" aria-labelledby="verify">
          <Reveal className="mx-auto w-full max-w-[680px] lg:mr-0">
            <h2 id="verify" className="display text-[clamp(2.6rem,6vw,5.6rem)]">
              Verify any donation in seconds
            </h2>
            <p className="mt-6 max-w-[40ch] text-lg leading-relaxed text-muted">Enter your donation reference. We confirm it was counted, without showing who gave it.</p>
          </Reveal>
          <Reveal delay={0.08} className="mx-auto w-full max-w-[620px] lg:ml-0">
            <div className="rounded-[36px] bg-cream p-7 shadow-[0_30px_70px_-40px_rgba(29,36,23,.5)] sm:p-9">
              <p className="mb-3.5 font-bold">Donation reference</p>
              <ReceiptForm />
              <div className="mt-6 grid gap-3.5 rounded-3xl bg-moss p-6 text-cream">
                <p className="flex items-center gap-3 text-lg font-extrabold">
                  <span className="grid size-8 place-items-center rounded-full bg-lime text-ink">
                    <Check size={18} strokeWidth={3} />
                  </span>
                  Donation verified
                </p>
                <dl className="tabular grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-[0.95rem]">
                  <dt className="text-cream/65">Amount</dt>
                  <dd className="text-right font-semibold">KSh 1,500</dd>
                  <dt className="text-cream/65">Donor</dt>
                  <dd className="text-right font-semibold">Private</dd>
                  <dt className="text-cream/65">Status</dt>
                  <dd className="text-right font-semibold">Held until the deadline</dd>
                </dl>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Pricing */}
        <section className="bg-cream px-5 py-[clamp(90px,11vw,160px)] sm:px-8 lg:px-14" aria-labelledby="pricing">
          <div className="mx-auto grid max-w-[1400px] items-end gap-12 lg:grid-cols-[1.3fr_1fr]">
            <Reveal>
              <h2 id="pricing" className="display text-[clamp(2.6rem,6vw,5.6rem)]">
                {SITE.feePercent}% when you hit your goal. Nothing when you don&apos;t.
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="text-lg leading-relaxed text-muted">No setup fees. No donor fees. No hidden charges. Refunds are always free.</p>
              <Link href="/fees" className="pill pill-ghost mt-7">
                See pricing
              </Link>
            </Reveal>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-cream px-5 pb-[clamp(90px,11vw,160px)] sm:px-8 lg:px-14" aria-labelledby="faq">
          <div className="mx-auto max-w-3xl">
            <Reveal className="mb-10 text-center">
              <h2 id="faq" className="text-[clamp(2rem,4vw,3.2rem)] leading-tight font-black tracking-tight">
                Frequently asked questions
              </h2>
              <p className="mt-3 text-lg text-muted">Everything you need to know about FadhiliChain.</p>
            </Reveal>
            <FaqAccordion items={HOME_FAQ} />
            <p className="mt-8 text-center text-muted">
              Still have questions?{" "}
              <Link href="/faq" className="font-semibold text-ink underline underline-offset-4">
                See all FAQs
              </Link>{" "}
              or{" "}
              <Link href="/contact" className="font-semibold text-ink underline underline-offset-4">
                contact us
              </Link>
              .
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="overflow-hidden bg-lime px-5 pt-[clamp(90px,11vw,150px)] sm:px-8 lg:px-14">
          <div className="mx-auto max-w-[1400px]">
            <h2 className="display text-[clamp(3.2rem,11vw,11.5rem)] leading-[0.84]">
              Ready to
              <br />
              start raising?
            </h2>
            <div className="flex flex-col justify-between gap-8 pt-10 pb-20 lg:flex-row lg:items-end">
              <p className="max-w-[40ch] text-lg leading-relaxed">Set up your fundraiser in minutes and share it with the world.</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/start" className="pill pill-ink">
                  Start a fundraiser <ArrowRight size={18} strokeWidth={2.4} />
                </Link>
                <Link href="/campaigns" className="pill pill-ghost">
                  Explore fundraisers
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
