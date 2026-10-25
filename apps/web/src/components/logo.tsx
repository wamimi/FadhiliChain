import Link from "next/link";

export function Logo({ tone = "light", className = "" }: { tone?: "light" | "dark"; className?: string }) {
  return (
    <Link href="/" aria-label="FadhiliChain home" className={`flex gap-1.5 text-[1.05rem] font-black tracking-tight ${className}`}>
      <span className={`rounded-full rounded-bl-[4px] px-4 py-2 ${tone === "light" ? "bg-cream text-ink" : "bg-ink text-cream"}`}>FADHILI</span>
      <span className="rounded-full bg-lime px-4 py-2 text-ink">CHAIN</span>
    </Link>
  );
}
