import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/page-head";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Contact", alternates: { canonical: "/contact" } };

export default function Contact() {
  const cards = [
    SITE.email && { t: "Email", d: "Questions about a fundraiser, your account or your data.", href: `mailto:${SITE.email}`, cta: SITE.email },
    { t: "Report a fundraiser", d: "Think a fundraiser is misleading or fraudulent? Tell us which one and why. Reviewers can cancel it and open refunds.", href: SITE.email ? `mailto:${SITE.email}?subject=Report%20a%20campaign` : `${SITE.github}/issues/new?title=Report%20a%20campaign`, cta: "Report" },
    { t: "Bugs and ideas", d: "Found something broken, or want to suggest a feature? Open an issue on GitHub.", href: `${SITE.github}/issues`, cta: "Open GitHub" },
  ].filter(Boolean) as { t: string; d: string; href: string; cta: string }[];
  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-28 sm:px-8 lg:px-14">
      <PageHead title="Contact" lead={<>Most answers are in <Link href="/faq" className="font-semibold text-ink underline">questions</Link>. For anything else:</>} />
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <div key={c.t} className="flex flex-col rounded-[28px] bg-paper p-7 ring-1 ring-ink/8">
            <h2 className="text-xl font-extrabold">{c.t}</h2>
            <p className="mt-2 flex-1 text-muted">{c.d}</p>
            <a href={c.href} className="pill pill-ink mt-6 self-start" target={c.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
              {c.cta}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
