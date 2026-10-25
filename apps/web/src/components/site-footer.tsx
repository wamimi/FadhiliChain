import Link from "next/link";
import { Logo } from "./logo";
import { SITE } from "@/lib/site";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/campaigns", label: "Fundraisers" },
      { href: "/start", label: "Start a fundraiser" },
      { href: "/fees", label: "Pricing" },
      { href: "/receipt", label: "Verify a donation" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/how-it-works", label: "How it works" },
      { href: "/faq", label: "FAQs" },
      { href: "/legal/campaign-rules", label: "Fundraiser rules" },
      { href: "/contact", label: "Contact us" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/transparency", label: "Transparency" },
      { href: "/study", label: "Research" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/terms", label: "Terms of use" },
      { href: "/legal/privacy", label: "Privacy policy" },
      { href: "/legal/refunds", label: "Refund policy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-ink text-cream/70">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 pt-16 pb-12 sm:px-8 lg:grid-cols-[1.2fr_2fr] lg:px-14">
        <div className="max-w-xs">
          <Logo tone="light" />
          <p className="mt-6 leading-relaxed">Fundraising you can verify. Donations you can keep private.</p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="mb-4 text-sm font-semibold text-cream">{col.title}</h2>
              <ul className="space-y-3 text-[0.95rem]">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="transition-colors hover:text-lime">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 border-t border-cream/10 px-5 py-7 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-14">
        <p>© {new Date().getFullYear()} FadhiliChain. All rights reserved.</p>
        <div className="flex gap-6">
          <a href={SITE.github} target="_blank" rel="noreferrer" className="hover:text-lime">
            GitHub
          </a>
          {SITE.email && (
            <a href={`mailto:${SITE.email}`} className="hover:text-lime">
              {SITE.email}
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
