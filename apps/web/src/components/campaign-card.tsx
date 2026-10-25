import Link from "next/link";
import type { Campaign } from "@/lib/types";
import { tokenInfo } from "@/lib/chains";
import { formatMoney, percent, timeLeft } from "@/lib/money";
import { categoryLabel } from "@/lib/site";
import { CampaignCover } from "./campaign-cover";
import { Progress } from "./progress";

export function CampaignCard({ campaign, tone = "dark", big = false }: { campaign: Campaign; tone?: "dark" | "light"; big?: boolean }) {
  const token = tokenInfo(campaign.chainId, campaign.token)!;
  const p = percent(BigInt(campaign.raised), BigInt(campaign.target));
  const dark = tone === "dark";
  return (
    <Link
      href={`/c/${campaign.id}`}
      className={`group flex w-full flex-col rounded-[32px] p-3.5 pb-7 transition-transform duration-300 ease-out-expo hover:-translate-y-1.5 ${dark ? "bg-moss-mid text-cream" : "bg-paper text-ink ring-1 ring-ink/8"}`}
    >
      <div className="relative">
        <CampaignCover campaign={campaign} className={`rounded-[22px] ${big ? "aspect-[16/11]" : "aspect-[4/3]"}`} />
        <span className="absolute top-3.5 left-3.5 rounded-full bg-cream px-3 py-1.5 text-[0.8rem] font-bold text-ink">{categoryLabel(campaign.category)}</span>
        <span className="absolute top-3.5 right-3.5 rounded-full bg-ink px-3 py-1.5 text-[0.8rem] font-bold text-cream">
          {campaign.status === "open" ? timeLeft(campaign.deadline) : campaign.status === "successful" || campaign.status === "withdrawn" ? "Goal reached" : "Ended"}
        </span>
      </div>
      <h3 className="mx-3.5 mt-5 text-[1.45rem] leading-tight font-extrabold tracking-tight text-balance">{campaign.title}</h3>
      <p className={`mx-3.5 mt-1.5 ${dark ? "text-cream/65" : "text-muted"}`}>{campaign.location}</p>
      <div className="mx-3.5 mt-auto pt-6">
        <Progress value={p} tone={tone} />
        <div className="tabular mt-3 flex justify-between text-[0.95rem]">
          <span>
            <b className="text-[1.1rem] font-extrabold">{formatMoney(campaign.raised, token)}</b> raised
          </span>
          <span className={dark ? "text-cream/65" : "text-muted"}>of {formatMoney(campaign.target, token)}</span>
        </div>
      </div>
    </Link>
  );
}
