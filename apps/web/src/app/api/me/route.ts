import { requireUser, errorResponse } from "@/lib/auth";
import { campaignsForAddresses, contributionsByDonors, getCampaignByAddress } from "@/lib/data";

/** The signed-in person's campaigns and gifts. */
export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    if (!user.wallets.length) return Response.json({ campaigns: [], gifts: [] });
    const [campaigns, gifts] = await Promise.all([campaignsForAddresses(user.wallets), contributionsByDonors(user.wallets)]);
    const titles = new Map<string, { id: string; title: string; token: string }>();
    for (const g of gifts) {
      const key = `${g.chainId}:${g.campaign}`;
      if (!titles.has(key)) {
        const c = await getCampaignByAddress(g.chainId, g.campaign);
        if (c) titles.set(key, { id: c.id, title: c.title, token: c.token });
      }
    }
    return Response.json({
      wallets: user.wallets,
      campaigns,
      gifts: gifts.map((g) => ({ ...g, campaignInfo: titles.get(`${g.chainId}:${g.campaign}`) ?? null })),
    });
  } catch (e) {
    return errorResponse(e);
  }
}
