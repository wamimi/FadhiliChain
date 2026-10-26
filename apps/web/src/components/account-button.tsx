"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Copy, LayoutDashboard, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "./providers";

export function AccountButton({ tone }: { tone: "light" | "dark" }) {
  const s = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cls = tone === "dark" ? "pill pill-ghost-light min-h-11 px-5" : "pill pill-ghost min-h-11 px-5";

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  if (!s.authenticated)
    return (
      <button type="button" onClick={s.login} className={cls} disabled={!s.ready}>
        Log in
      </button>
    );

  const item = "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[0.95rem] font-medium hover:bg-sand";
  return (
    <div className="relative" ref={ref}>
      <button type="button" className={cls} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        My account <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-64 rounded-2xl bg-paper p-2 text-ink shadow-[0_20px_50px_-20px_rgba(29,36,23,.45)] ring-1 ring-ink/10">
          {s.label && <p className="truncate px-3 pt-2 pb-2.5 text-sm text-muted">{s.label}</p>}
          <Link role="menuitem" href="/me" className={item} onClick={() => setOpen(false)}>
            <LayoutDashboard size={17} /> Dashboard
          </Link>
          {s.address && (
            <button
              role="menuitem"
              type="button"
              className={item}
              onClick={() => navigator.clipboard.writeText(s.address!).then(() => toast("Account ID copied"))}
            >
              <Copy size={17} /> Copy account ID
            </button>
          )}
          <button
            role="menuitem"
            type="button"
            className={`${item} text-danger`}
            onClick={async () => {
              setOpen(false);
              await s.logout();
              router.push("/");
            }}
          >
            <LogOut size={17} /> Log out
          </button>
        </div>
      )}
    </div>
  );
}
