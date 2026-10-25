import { requireUser, hasRole, APPROVER_ROLE, errorResponse } from "@/lib/auth";
import { liveChains } from "@/lib/chains";
import { pendingCampaigns } from "@/lib/data";

/** Review queue. Visible only to accounts that hold the reviewer role on at least one network. */
export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    const chains: number[] = [];
    for (const c of liveChains())
      for (const w of user.wallets) if (await hasRole(c.chain.id, APPROVER_ROLE, w)) { chains.push(c.chain.id); break; }
    if (!chains.length) return Response.json({ reviewer: false, items: [] });
    const items = (await pendingCampaigns()).filter((i) => chains.includes(i.campaign.chainId));
    return Response.json({ reviewer: true, chains, items });
  } catch (e) {
    return errorResponse(e);
  }
}
