"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="main" className="mx-auto flex min-h-[70vh] max-w-[1400px] flex-col items-start justify-center px-5 sm:px-8 lg:px-14">
      <h1 className="display text-[clamp(2.6rem,7vw,6rem)]">Something went wrong</h1>
      <p className="mt-5 max-w-[50ch] text-lg text-muted">
        We couldn&apos;t load this page. Your money is safe: it lives in campaign contracts, not on this website. Try again in a moment.
      </p>
      <div className="mt-8 flex gap-3">
        <button onClick={reset} className="pill pill-ink">
          Try again
        </button>
        <Link href="/" className="pill pill-ghost">
          Home
        </Link>
      </div>
      {error.digest && <p className="mt-6 text-xs text-muted">Reference {error.digest}</p>}
    </main>
  );
}
