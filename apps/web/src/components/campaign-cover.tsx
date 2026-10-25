import Image from "next/image";
import type { Campaign } from "@/lib/types";

const COLOURS: Record<string, string> = {
  medical: "#e9b9a2",
  education: "#bcd6e6",
  community: "#cfe0a0",
  funeral: "#d9cbe0",
  emergency: "#f0c987",
  faith: "#e8d48a",
};

export function initials(text: string) {
  return text
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function CampaignCover({ campaign, className = "", sizes = "(min-width: 1024px) 33vw, 100vw", priority = false }: { campaign: Campaign; className?: string; sizes?: string; priority?: boolean }) {
  if (campaign.imageUrl) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image src={campaign.imageUrl} alt="" fill sizes={sizes} className="object-cover" priority={priority} />
      </div>
    );
  }
  return (
    <div className={`relative grid place-items-center overflow-hidden ${className}`} style={{ background: COLOURS[campaign.category] ?? "#ddd6c6" }} aria-hidden="true">
      <span className="text-[clamp(3.5rem,8vw,6rem)] font-black tracking-tighter text-ink/15">{initials(campaign.beneficiary)}</span>
    </div>
  );
}
