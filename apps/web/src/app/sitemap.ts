import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { listCampaigns } from "@/lib/data";

export const revalidate = 3600;

const STATIC = ["", "/campaigns", "/start", "/how-it-works", "/fees", "/receipt", "/faq", "/about", "/contact", "/transparency", "/study", "/legal/terms", "/legal/privacy", "/legal/refunds", "/legal/campaign-rules"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const campaigns = await listCampaigns({ includeEnded: true }).catch(() => []);
  return [
    ...STATIC.map((p) => ({ url: `${SITE.url}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.6 })),
    ...campaigns.map((c) => ({ url: `${SITE.url}/c/${c.id}`, lastModified: c.createdAt, changeFrequency: "daily" as const, priority: 0.8 })),
  ];
}
