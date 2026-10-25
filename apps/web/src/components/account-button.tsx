"use client";
import Link from "next/link";
import { useSession } from "./providers";

export function AccountButton({ tone }: { tone: "light" | "dark" }) {
  const s = useSession();
  const cls = tone === "dark" ? "pill pill-ghost-light min-h-11 px-5" : "pill pill-ghost min-h-11 px-5";
  if (s.authenticated)
    return (
      <Link href="/me" className={cls}>
        My account
      </Link>
    );
  return (
    <button type="button" onClick={s.login} className={cls} disabled={!s.ready}>
      Log in
    </button>
  );
}
