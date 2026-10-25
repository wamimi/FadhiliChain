export const SITE = {
  name: "FadhiliChain",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  tagline: "Raise money for anything. Prove every shilling.",
  description:
    "Raise money for anything and accept donations in shillings or stablecoins from anywhere. Every donation is tracked live, donors stay private, and if you miss your goal, everyone gets a full refund.",
  feePercent: 2,
  competitorFeePercent: 4.25,
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
  github: "https://github.com/wamimi/FadhiliChain",
};

export const CATEGORIES = [
  { id: "medical", label: "Medical" },
  { id: "education", label: "School fees" },
  { id: "community", label: "Community" },
  { id: "funeral", label: "Funeral" },
  { id: "emergency", label: "Emergency" },
  { id: "faith", label: "Church & faith" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export function categoryLabel(id: string) {
  return CATEGORIES.find((c) => c.id === id)?.label ?? "Other";
}
