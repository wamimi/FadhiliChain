import { serverEnv, hasDatabase } from "@/lib/env";
import { syncAll } from "@/lib/indexer";
import { errorResponse } from "@/lib/auth";

export const maxDuration = 60;

/** Scheduled catch-up of on-chain contributions. Call with `Authorization: Bearer $CRON_SECRET`. */
export async function GET(req: Request) {
  try {
    if (!hasDatabase) return Response.json({ error: "Database not configured" }, { status: 503 });
    if (!serverEnv.cronSecret || req.headers.get("authorization") !== `Bearer ${serverEnv.cronSecret}`)
      return Response.json({ error: "Unauthorised" }, { status: 401 });
    return Response.json(await syncAll());
  } catch (e) {
    return errorResponse(e);
  }
}
