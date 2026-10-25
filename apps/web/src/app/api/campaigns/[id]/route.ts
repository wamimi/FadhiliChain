import { z } from "zod";
import { decodeEventLog, getAddress, isHex } from "viem";
import { campaignFactoryAbi } from "@fadhili/contracts/abi";
import { requireReviewer, errorResponse } from "@/lib/auth";
import { hasDatabase } from "@/lib/env";
import { db } from "@/lib/supabase";
import { chainInfo } from "@/lib/chains";
import { publicClient } from "@/lib/rpc";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve"), txHash: z.string().refine((v) => isHex(v) && v.length === 66) }),
  z.object({ action: z.literal("reject"), note: z.string().trim().min(5).max(500) }),
]);

/**
 * Reviewer actions. Approval is recorded only after the campaign contract exists on-chain:
 * the server reads the CampaignCreated event from the reviewer's transaction and checks it matches the signed request.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!hasDatabase) return Response.json({ error: "Database not configured" }, { status: 503 });
    const { id } = await params;
    const supabase = db();
    const { data: row } = await supabase.from("campaigns").select("id, chain_id, status, organiser, recipient, metadata_hash").eq("id", id).maybeSingle();
    if (!row) return Response.json({ error: "Campaign not found" }, { status: 404 });

    const reviewer = await requireReviewer(req, row.chain_id);
    const body = Body.safeParse(await req.json());
    if (!body.success) return Response.json({ error: "Invalid request" }, { status: 400 });
    if (row.status !== "pending") return Response.json({ error: "This campaign has already been reviewed." }, { status: 409 });

    if (body.data.action === "reject") {
      await supabase.from("campaigns").update({ status: "rejected", review_note: body.data.note, reviewed_at: new Date().toISOString() }).eq("id", id);
      return Response.json({ ok: true });
    }

    const factory = chainInfo(row.chain_id)!.factory!;
    const receipt = await publicClient(row.chain_id).getTransactionReceipt({ hash: body.data.txHash as `0x${string}` });
    let created: string | null = null;
    for (const log of receipt.logs) {
      if (getAddress(log.address) !== factory) continue;
      try {
        const ev = decodeEventLog({ abi: campaignFactoryAbi, data: log.data, topics: log.topics });
        if (
          ev.eventName === "CampaignCreated" &&
          ev.args.metadataHash === row.metadata_hash &&
          ev.args.organiser.toLowerCase() === row.organiser &&
          ev.args.recipient.toLowerCase() === row.recipient
        ) {
          created = ev.args.campaign.toLowerCase();
        }
      } catch {
        // not a factory event we know
      }
    }
    if (!created) return Response.json({ error: "That transaction did not create this campaign." }, { status: 400 });

    await supabase
      .from("campaigns")
      .update({ status: "approved", address: created, created_tx: body.data.txHash, reviewed_at: new Date().toISOString(), review_note: `Approved by ${reviewer.reviewer}` })
      .eq("id", id);
    return Response.json({ ok: true, address: created });
  } catch (e) {
    return errorResponse(e);
  }
}
