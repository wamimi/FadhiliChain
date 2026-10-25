import { requireUser, errorResponse } from "@/lib/auth";
import { hasDatabase } from "@/lib/env";
import { db } from "@/lib/supabase";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_BYTES = 4 * 1024 * 1024;

/** Upload a campaign photo to public storage. */
export async function POST(req: Request) {
  try {
    if (!hasDatabase) return Response.json({ error: "Photo uploads open once storage is connected." }, { status: 503 });
    const user = await requireUser(req);
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ error: "Choose a photo" }, { status: 400 });
    const ext = TYPES[file.type];
    if (!ext) return Response.json({ error: "Use a JPG, PNG or WebP photo" }, { status: 400 });
    if (file.size > MAX_BYTES) return Response.json({ error: "Photos must be under 4 MB" }, { status: 400 });
    const path = `${user.userId.replace(/[^a-zA-Z0-9]/g, "")}/${crypto.randomUUID()}.${ext}`;
    const bucket = db().storage.from("campaign-images");
    const { error } = await bucket.upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });
    if (error) throw error;
    return Response.json({ url: bucket.getPublicUrl(path).data.publicUrl });
  } catch (e) {
    return errorResponse(e);
  }
}
