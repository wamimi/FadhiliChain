import type { Metadata } from "next";
import Link from "next/link";
import { CampaignCard } from "@/components/campaign-card";
import { PreviewNotice } from "@/components/preview-notice";
import { PageHead } from "@/components/page-head";
import { listCampaigns, previewMode } from "@/lib/data";
import { CATEGORIES } from "@/lib/site";

export const metadata: Metadata = {
  title: "Fundraisers",
  description: "Verified fundraisers for medical bills, school fees, funerals and community projects. Every shilling tracked, every donor protected.",
  alternates: { canonical: "/campaigns" },
};

export const revalidate = 60;

export default async function CampaignsPage({ searchParams }: PageProps<"/campaigns">) {
  const sp = await searchParams;
  const category = typeof sp.category === "string" && CATEGORIES.some((c) => c.id === sp.category) ? sp.category : undefined;
  const ended = sp.show === "ended";
  const all = await listCampaigns({ category, includeEnded: ended });
  const campaigns = ended ? all.filter((c) => c.status !== "open") : all;

  const chip = (active: boolean) =>
    `inline-flex h-11 items-center rounded-full border-[1.5px] px-5 font-medium transition-colors ${active ? "border-ink bg-ink text-cream" : "border-ink/15 hover:border-ink/50"}`;
  const href = (c?: string, show?: string) => {
    const q = new URLSearchParams();
    if (c) q.set("category", c);
    if (show) q.set("show", show);
    const s = q.toString();
    return `/campaigns${s ? `?${s}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-28 sm:px-8 lg:px-14">
      <PageHead title="Fundraisers" lead="Every fundraiser is verified before it goes live. Totals update in real time, so what you see is what's actually raised." />
      <nav aria-label="Filter campaigns" className="mb-10 flex flex-wrap gap-2">
        <Link href={href(undefined, ended ? "ended" : undefined)} className={chip(!category)}>
          All
        </Link>
        {CATEGORIES.map((c) => (
          <Link key={c.id} href={href(c.id, ended ? "ended" : undefined)} className={chip(category === c.id)}>
            {c.label}
          </Link>
        ))}
        <span className="mx-1 hidden w-px bg-ink/15 sm:block" />
        <Link href={href(category, ended ? undefined : "ended")} className={chip(ended)}>
          {ended ? "Showing ended" : "Show ended"}
        </Link>
      </nav>
      {previewMode && <PreviewNotice className="mb-8" />}
      {campaigns.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <CampaignCard key={c.id} campaign={c} tone="light" />
          ))}
        </div>
      ) : (
        <div className="rounded-[32px] border-[1.5px] border-dashed border-ink/20 p-14 text-center">
          <p className="text-xl font-bold">No campaigns here yet.</p>
          <p className="mt-2 text-muted">Know someone who needs support?</p>
          <Link href="/start" className="pill pill-ink mt-6">
            Start a fundraiser
          </Link>
        </div>
      )}
    </div>
  );
}
