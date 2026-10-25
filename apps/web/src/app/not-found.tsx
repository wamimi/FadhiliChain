import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function NotFound() {
  return (
    <>
      <div className="grid-bg bg-moss text-cream">
        <SiteHeader tone="dark" />
        <main id="main" className="mx-auto flex min-h-[70vh] max-w-[1400px] flex-col items-start justify-center px-5 pb-24 sm:px-8 lg:px-14">
          <p className="display display-shadow text-[clamp(7rem,24vw,20rem)] text-lime">404</p>
          <h1 className="mt-4 text-[clamp(1.8rem,4vw,3rem)] font-black tracking-tight">We can&apos;t find that page.</h1>
          <p className="mt-3 max-w-[48ch] text-lg text-cream/80">The link may be mistyped, or the fundraiser may not be live yet.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/campaigns" className="pill pill-lime">
              Explore fundraisers
            </Link>
            <Link href="/" className="pill pill-ghost-light">
              Home
            </Link>
          </div>
        </main>
      </div>
      <SiteFooter />
    </>
  );
}
