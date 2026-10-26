"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useSession } from "./providers";

const LINKS = [
  { href: "/campaigns", label: "Fundraisers" },
  { href: "/start", label: "Start a fundraiser" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/fees", label: "Pricing" },
  { href: "/receipt", label: "Verify a donation" },
  { href: "/faq", label: "FAQs" },
];

export function MobileMenu({ tone }: { tone: "light" | "dark" }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const s = useSession();
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={`grid size-11 place-items-center rounded-full border-[1.5px] ${tone === "dark" ? "border-cream/40 text-cream" : "border-ink/20 text-ink"}`}
      >
        <Menu size={20} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-moss px-5 py-6 text-cream" role="dialog" aria-modal="true">
          <div className="flex items-center justify-between">
            <span className="text-lg font-black">MENU</span>
            <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="grid size-11 place-items-center rounded-full border-[1.5px] border-cream/40">
              <X size={20} />
            </button>
          </div>
          <nav className="mt-10 flex flex-col gap-1" aria-label="Mobile">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="display py-2 text-[2.6rem]">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-3">
            {s.authenticated ? (
              <>
                <Link href="/me" className="pill pill-lime">
                  My account
                </Link>
                <button type="button" onClick={() => void s.logout()} className="pill pill-ghost-light">
                  Log out
                </button>
              </>
            ) : (
              <button type="button" onClick={s.login} className="pill pill-lime">
                Log in
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
