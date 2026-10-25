import type { Metadata } from "next";
import Link from "next/link";
import { FaqAccordion } from "@/components/faq-accordion";
import { FAQ_GROUPS } from "@/lib/faq";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description: "Answers about donating, fundraising, fees, refunds and privacy on FadhiliChain.",
  alternates: { canonical: "/faq" },
};

export default function Faq() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_GROUPS.flatMap((g) => g.items).map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <div className="mx-auto max-w-3xl px-5 pt-10 pb-28 sm:px-8 lg:pt-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="text-center">
        <h1 className="text-[clamp(2.4rem,5vw,4rem)] leading-tight font-black tracking-tight">Frequently asked questions</h1>
        <p className="mt-4 text-lg text-muted">Everything you need to know about donating and fundraising on FadhiliChain.</p>
      </div>
      <div className="mt-14 space-y-12">
        {FAQ_GROUPS.map((g) => (
          <section key={g.title} aria-labelledby={`faq-${g.title}`}>
            <h2 id={`faq-${g.title}`} className="mb-5 text-xl font-extrabold tracking-tight">
              {g.title}
            </h2>
            <FaqAccordion items={g.items} defaultOpen={null} />
          </section>
        ))}
      </div>
      <div className="mt-16 rounded-[28px] bg-moss p-8 text-center text-cream">
        <h2 className="text-2xl font-extrabold">Still have questions?</h2>
        <p className="mt-2 text-cream/75">Our team is happy to help.</p>
        <Link href="/contact" className="pill pill-lime mt-6">
          Contact us
        </Link>
      </div>
    </div>
  );
}
