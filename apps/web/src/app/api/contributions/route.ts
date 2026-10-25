import { z } from "zod";
import { isHex, type Address } from "viem";
import { hasDatabase } from "@/lib/env";
import { ingestTransaction } from "@/lib/indexer";
import { requireUser, errorResponse } from "@/lib/auth";
import { chainInfo } from "@/lib/chains";

const Body = z.object({
  chainId: z.number().int(),
  txHash: z.string().refine((v) => isHex(v) && v.length === 66),
  displayName: z.string().trim().max(40).nullable().optional(),
  message: z.string().trim().max(280).nullable().optional(),
});

/**
 * Called by the app right after a contribution is confirmed. The server reads the transaction from the chain itself,
 * so nothing the browser says about amounts is trusted. A name and message are attached only for the signed-in donor.
 */
export async function POST(req: Request) {
  try {
    if (!hasDatabase) return Response.json({ refs: [] });
    const body = Body.safeParse(await req.json());
    if (!body.success || !chainInfo(body.data.chainId)) return Response.json({ error: "Invalid request" }, { status: 400 });
    let donors: Address[] = [];
    try {
      donors = (await requireUser(req)).wallets;
    } catch {
      // Not signed in: still record the contribution, without a name or message.
    }
    const rows = await ingestTransaction(body.data.chainId, body.data.txHash as `0x${string}`, {
      donors,
      displayName: body.data.displayName,
      message: body.data.message,
    });
    return Response.json({ refs: rows });
  } catch (e) {
    return errorResponse(e);
  }
}
