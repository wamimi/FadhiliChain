import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BadgeCheck } from "lucide-react";
import { CampaignCover } from "@/components/campaign-cover";
import { Progress } from "@/components/progress";
import { GivePanel } from "@/components/campaign/give-panel";
import { CampaignActions } from "@/components/campaign/campaign-actions";
import { ProofPanel, type ProofRow } from "@/components/campaign/proof-panel";
import { Share } from "@/components/campaign/share";
import { PreviewNotice } from "@/components/preview-notice";
import { campaignContributions, getCampaign, previewMode } from "@/lib/data";
import { addressUrl, chainInfo, tokenInfo, txUrl } from "@/lib/chains";
import { formatMoney, percent, shortAddress, timeLeft } from "@/lib/money";
import { categoryLabel } from "@/lib/site";
import { storyHash } from "@/lib/metadata";

export const revalidate = 30;

export async function generateMetadata({ params }: PageProps<"/c/[id]">): Promise<Metadata> {
  const { id } = await params;
  const c = await getCampaign(id);
  if (!c || c.reviewStatus !== "approved") return { title: "Campaign not found" };
  return {
    title: c.title,
    description: c.summary,
    alternates: { canonical: `/c/${c.id}` },
    openGraph: { title: c.title, description: c.summary, type: "article" },
  };
}

const dateFmt = new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Nairobi" });
const relFmt = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
function ago(iso: string) {
  const s = (new Date(iso).getTime() - Date.now()) / 1000;
  const abs = Math.abs(s);
  if (abs < 3600) return relFmt.format(Math.round(s / 60), "minute");
  if (abs < 86400) return relFmt.format(Math.round(s / 3600), "hour");
  return relFmt.format(Math.round(s / 86400), "day");
}

export default async function CampaignPage({ params }: PageProps<"/c/[id]">) {
  const { id } = await params;
  const c = await getCampaign(id);
  if (!c || c.reviewStatus !== "approved" || !c.address) notFound();

  const token = tokenInfo(c.chainId, c.token)!;
  const chain = chainInfo(c.chainId)!;
  const contributions = await campaignContributions(c, 30);
  const p = percent(BigInt(c.raised), BigInt(c.target));
  const storyMatches = previewMode || storyHash({ ...c, imageUrl: c.imageUrl }) === c.metadataHash;

  const statusText: Record<typeof c.status, string> = {
    open: timeLeft(c.deadline),
    successful: "Goal reached · funds ready",
    withdrawn: "Funds released",
    failed: "Goal missed · donors refunded",
    cancelled: "Closed · donors refunded",
  };

  const proof: ProofRow[] = [
    { label: "Fundraiser account", value: c.address, href: addressUrl(c.chainId, c.address), mono: true },
    { label: "Network", value: chain.name },
    { label: "Currency", value: token.label },
    { label: "Funds go to (locked)", value: c.recipient, href: addressUrl(c.chainId, c.recipient), mono: true },
    { label: "Organiser account", value: c.organiser, href: addressUrl(c.chainId, c.organiser), mono: true },
    { label: "Goal and deadline (locked)", value: `${formatMoney(c.target, token)} by ${dateFmt.format(c.deadline * 1000)}` },
    { label: "Platform fee (locked)", value: `${c.feeBps / 100}% when the goal is reached, 0% on refunds` },
    { label: storyMatches ? "Story unchanged since it was verified" : "Story changed after it was verified", value: c.metadataHash, ok: storyMatches, mono: true },
  ];

  return (
    <article className="mx-auto max-w-[1400px] px-5 pb-28 sm:px-8 lg:px-14">
      <Link href="/campaigns" className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft size={16} /> All fundraisers
      </Link>
      {previewMode && <PreviewNotice className="mt-5" />}

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(340px,1fr)] lg:gap-14">
        <div className="min-w-0">
          <p className="flex flex-wrap gap-2 text-sm font-bold">
            <span className="rounded-full bg-sand px-3 py-1.5">{categoryLabel(c.category)}</span>
            <span className="rounded-full bg-sand px-3 py-1.5">{c.location}</span>
            <span className="rounded-full bg-lime px-3 py-1.5">Verified fundraiser</span>
          </p>
          <h1 className="mt-5 text-[clamp(2.2rem,4.6vw,4rem)] leading-[0.95] font-black tracking-[-0.035em] text-balance">{c.title}</h1>
          <p className="mt-4 text-lg text-muted">
            Organised by <b className="text-ink">{c.organiserName}</b> for <b className="text-ink">{c.beneficiary}</b>
          </p>
          <CampaignCover campaign={c} priority sizes="(min-width: 1024px) 60vw, 100vw" className="mt-8 aspect-[16/10] rounded-[32px]" />
          <p className="mt-10 text-xl leading-relaxed font-medium text-balance">{c.summary}</p>
          <div className="prose-body mt-6 max-w-[68ch] text-[1.075rem] leading-[1.75] text-ink/85">
            {c.story.split(/\n{2,}/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          <section className="mt-16" aria-labelledby="gifts">
            <h2 id="gifts" className="text-2xl font-extrabold tracking-tight">
              Recent donations <span className="text-muted">({c.donors || contributions.length})</span>
            </h2>
            <p className="mt-1 text-sm text-muted">Donors stay anonymous. Every donation is verified.</p>
            {contributions.length ? (
              <ul className="mt-6 divide-y divide-ink/8 rounded-[24px] bg-paper ring-1 ring-ink/8">
                {contributions.map((g) => (
                  <li key={g.ref} className="flex items-start justify-between gap-4 px-5 py-4">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 font-semibold">
                        <BadgeCheck size={16} className="text-moss" /> Verified donation
                      </p>
                      {g.message && <p className="mt-0.5 text-muted">&ldquo;{g.message}&rdquo;</p>}
                      <p className="mt-1 text-sm text-muted">{ago(g.blockTime)}</p>
                    </div>
                    <p className="tabular shrink-0 font-extrabold">{formatMoney(g.amount, token)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-muted">No donations yet. Be the first.</p>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="space-y-4">
            <div className="rounded-[28px] bg-moss p-7 text-cream">
              <p className="tabular text-[2.4rem] leading-none font-black tracking-tight">{formatMoney(c.raised, token)}</p>
              <p className="mt-2 text-cream/75">raised of {formatMoney(c.target, token)}</p>
              <div className="mt-5">
                <Progress value={p} />
              </div>
              <div className="tabular mt-4 flex justify-between text-sm">
                <span>
                  <b>{c.donors || contributions.length}</b> donations
                </span>
                <span className="font-semibold text-lime">{statusText[c.status]}</span>
              </div>
            </div>

            {c.status === "open" && (
              <GivePanel
                campaignId={c.id}
                campaignTitle={c.title}
                chainId={c.chainId}
                campaign={c.address}
                token={token}
                testnet={chain.testnet}
                preview={previewMode}
              />
            )}
            {c.status !== "open" && (
              <div className="rounded-[28px] bg-sand p-6">
                <p className="font-extrabold">{statusText[c.status]}</p>
                <p className="mt-1 text-sm text-muted">
                  {c.status === "successful" && "The goal was reached. Funds are ready for the fundraiser to withdraw."}
                  {c.status === "withdrawn" && "The funds have been released to the fundraiser."}
                  {(c.status === "failed" || c.status === "cancelled") && "Every donor gets a full refund. Log in to claim yours."}
                </p>
              </div>
            )}
            <CampaignActions
              chainId={c.chainId}
              campaign={c.address}
              recipient={c.recipient}
              organiser={c.organiser}
              status={c.status}
              token={token}
              feeBps={c.feeBps}
              raised={c.raised}
              preview={previewMode}
            />
            <Share title={c.title} path={`/c/${c.id}`} />
            <ProofPanel rows={proof} live={c.verifiedLive || previewMode} />
            {contributions[0] && txUrl(c.chainId, contributions[0].txHash) && (
              <p className="px-2 text-xs text-muted">Last contribution recorded in block {contributions[0].blockNumber.toLocaleString()} · {shortAddress(contributions[0].txHash)}</p>
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}
