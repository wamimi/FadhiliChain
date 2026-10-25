import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/page-head";

export const metadata: Metadata = { title: "About", alternates: { canonical: "/about" } };

export default function About() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-28 sm:px-8 lg:px-14">
      <PageHead title="Harambee, with receipts" />
      <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
        <div className="doc max-w-[64ch] text-[1.1rem] leading-[1.8] text-ink/85">
          <p>
            Harambee, &ldquo;let&apos;s pull together&rdquo;, is how Kenyan families pay for hospital bills, school fees and send-offs. It works because people trust each other.
            It breaks when that trust is abused: money that goes missing, totals nobody can check, targets that are never met and never explained.
          </p>
          <p>
            Moving harambee online made it faster, but it didn&apos;t fix the trust problem. It moved it. Now you trust a platform to hold the money and to tell you the truth
            about it.
          </p>
          <p>
            FadhiliChain removes that step. Every fundraiser&apos;s funds are held securely until the deadline, every donation is permanently recorded, and the
            rules (who gets paid, when, and what happens if the goal is missed) are fixed before the first shilling arrives. Donors stay private. The money stays
            accountable. You don&apos;t have to trust us, and that&apos;s the point.
          </p>
          <p>
            <i>Fadhili</i> means kindness, a favour done for someone. We think kindness deserves receipts.
          </p>
        </div>
        <aside className="space-y-4 self-start">
          <div className="rounded-[28px] bg-moss p-7 text-cream">
            <h2 className="text-xl font-extrabold">Where this comes from</h2>
            <p className="mt-3 text-cream/85">
              FadhiliChain began as a final-year BSc Software Engineering project at Zetech University. It runs on test networks while it&apos;s being evaluated.
            </p>
          </div>
          <div className="rounded-[28px] bg-sand p-7">
            <h2 className="text-xl font-extrabold">Open by default</h2>
            <p className="mt-3 text-muted">The contracts, tests and website are open source, so anyone can check what the code does.</p>
            <Link href="/transparency" className="pill pill-ink mt-5">
              Transparency
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
