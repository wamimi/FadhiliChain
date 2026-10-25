import { z } from "zod";
import { getAddress, isAddress, isHex } from "viem";
import { campaignFactoryAbi } from "@fadhili/contracts/abi";
import { requireUser, errorResponse, AuthError } from "@/lib/auth";
import { hasDatabase } from "@/lib/env";
import { db } from "@/lib/supabase";
import { chainInfo, tokenInfo } from "@/lib/chains";
import { publicClient } from "@/lib/rpc";
import { storyHash } from "@/lib/metadata";
import { CAMPAIGN_REQUEST_TYPES, factoryDomain, requestFromJson } from "@/lib/eip712";
import { CATEGORIES } from "@/lib/site";

const address = z.string().refine((v) => isAddress(v), "Invalid address");
const uint = z.string().regex(/^\d+$/);

const Body = z.object({
  chainId: z.number().int(),
  story: z.object({
    title: z.string().trim().min(8).max(90),
    summary: z.string().trim().min(20).max(200),
    story: z.string().trim().min(100).max(8000),
    category: z.enum(CATEGORIES.map((c) => c.id) as [string, ...string[]]),
    location: z.string().trim().min(2).max(80),
    beneficiary: z.string().trim().min(2).max(80),
    organiserName: z.string().trim().min(2).max(80),
    imageUrl: z.string().url().nullable(),
  }),
  contact: z.string().trim().min(5).max(120),
  documentsNote: z.string().trim().max(600).optional(),
  request: z.object({
    token: address,
    organiser: address,
    recipient: address,
    target: uint,
    deadline: uint,
    metadataHash: z.string().refine((v) => isHex(v) && v.length === 66),
    nonce: uint,
    expiry: uint,
  }),
  signature: z.string().refine((v) => isHex(v)),
});

function slug(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Submit a campaign for review. The organiser has already signed the exact on-chain terms. */
export async function POST(req: Request) {
  try {
    if (!hasDatabase) return Response.json({ error: "Campaign submissions open once the database is connected." }, { status: 503 });
    const user = await requireUser(req);
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: "Some details are missing or too long.", issues: parsed.error.issues }, { status: 400 });
    const { chainId, story, contact, documentsNote, signature } = parsed.data;
    const request = requestFromJson(parsed.data.request as never);

    const chain = chainInfo(chainId);
    if (!chain?.factory) return Response.json({ error: "That network is not available." }, { status: 400 });
    if (!tokenInfo(chainId, request.token)) return Response.json({ error: "That currency is not supported." }, { status: 400 });
    if (!user.wallets.some((w) => w === getAddress(request.organiser)))
      throw new AuthError("The signing wallet does not belong to your account.", 403);
    if (storyHash(story) !== request.metadataHash)
      return Response.json({ error: "The signed details don't match the story. Please sign again." }, { status: 400 });

    const client = publicClient(chainId);
    const valid = await client.verifyTypedData({
      address: request.organiser,
      domain: factoryDomain(chainId, chain.factory),
      types: CAMPAIGN_REQUEST_TYPES,
      primaryType: "CampaignRequest",
      message: request,
      signature: signature as `0x${string}`,
    });
    if (!valid) return Response.json({ error: "The signature could not be verified." }, { status: 400 });

    const [nonce, allowed] = await Promise.all([
      client.readContract({ address: chain.factory, abi: campaignFactoryAbi, functionName: "nonces", args: [request.organiser] }),
      client.readContract({ address: chain.factory, abi: campaignFactoryAbi, functionName: "isTokenAllowed", args: [request.token] }),
    ]);
    if (nonce !== request.nonce) return Response.json({ error: "This request is out of date. Please sign again." }, { status: 409 });
    if (!allowed) return Response.json({ error: "That currency is not accepted right now." }, { status: 400 });

    const supabase = db();
    const { count } = await supabase
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .eq("organiser", request.organiser.toLowerCase())
      .eq("status", "pending");
    if ((count ?? 0) > 0)
      return Response.json({ error: "You already have a campaign waiting for review. We'll get to it soon." }, { status: 409 });

    const id = slug(story.title);
    const { error } = await supabase.from("campaigns").insert({
      id,
      chain_id: chainId,
      title: story.title,
      summary: story.summary,
      story: story.story,
      category: story.category,
      location: story.location,
      beneficiary: story.beneficiary,
      organiser_name: story.organiserName,
      image_url: story.imageUrl,
      organiser: request.organiser.toLowerCase(),
      recipient: request.recipient.toLowerCase(),
      token: request.token.toLowerCase(),
      target: request.target.toString(),
      deadline: new Date(Number(request.deadline) * 1000).toISOString(),
      metadata_hash: request.metadataHash,
      request: parsed.data.request,
      signature,
    });
    if (error) throw error;
    await supabase.from("campaign_private").insert({ campaign_id: id, organiser_contact: contact, documents_note: documentsNote ?? null });

    return Response.json({ id });
  } catch (e) {
    return errorResponse(e);
  }
}
