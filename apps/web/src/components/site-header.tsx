import Link from "next/link";
import { Logo } from "./logo";
import { AccountButton } from "./account-button";
import { MobileMenu } from "./mobile-menu";

export const NAV = [
  { href: "/campaigns", label: "Fundraisers" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/fees", label: "Pricing" },
  { href: "/receipt", label: "Verify a donation" },
];

export function SiteHeader({ tone = "light" }: { tone?: "light" | "dark" }) {
  const link =
    tone === "dark"
      ? "border-cream/35 text-cream hover:border-cream/70 hover:bg-cream/10"
      : "border-ink/15 text-ink hover:border-ink/50";
  return (
    <header className="relative z-30 flex items-center justify-between gap-4 px-5 py-6 sm:px-8 lg:px-14">
      <Logo tone={tone === "dark" ? "light" : "dark"} />
      <nav aria-label="Main" className="hidden gap-2 lg:flex">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={`inline-flex h-11 items-center rounded-full border-[1.5px] px-5 text-[0.95rem] font-medium transition-colors ${link}`}>
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <Link href="/start" className="pill pill-lime hidden min-h-11 px-5 sm:inline-flex">
          Start a fundraiser
        </Link>
        <div className="hidden sm:block">
          <AccountButton tone={tone} />
        </div>
        <MobileMenu tone={tone} />
      </div>
    </header>
  );
}
