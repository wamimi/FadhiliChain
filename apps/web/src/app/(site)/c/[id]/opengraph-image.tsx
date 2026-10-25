import { campaignOg, siteOg, OG_SIZE } from "@/lib/og";
import { getCampaign } from "@/lib/data";
import { tokenInfo } from "@/lib/chains";
import { formatMoney, percent } from "@/lib/money";

export const alt = "FadhiliChain campaign";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 300;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await getCampaign(id).catch(() => null);
  const token = c ? tokenInfo(c.chainId, c.token) : undefined;
  if (!c || !token) return siteOg();
  return campaignOg({
    title: c.title,
    location: c.location,
    raised: formatMoney(c.raised, token),
    target: formatMoney(c.target, token),
    percent: percent(BigInt(c.raised), BigInt(c.target)),
  });
}
