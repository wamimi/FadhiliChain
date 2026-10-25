import { keccak256, toBytes } from "viem";

export type CampaignStory = {
  title: string;
  summary: string;
  story: string;
  category: string;
  location: string;
  beneficiary: string;
  organiserName: string;
  imageUrl: string | null;
};

/** Fixed field order, so the same story always produces the same hash on the browser and the server. */
export function canonicalStory(s: CampaignStory) {
  return JSON.stringify([
    s.title.trim(),
    s.summary.trim(),
    s.story.trim(),
    s.category,
    s.location.trim(),
    s.beneficiary.trim(),
    s.organiserName.trim(),
    s.imageUrl ?? "",
  ]);
}

export function storyHash(s: CampaignStory) {
  return keccak256(toBytes(canonicalStory(s)));
}
