import { siteOg, OG_SIZE } from "@/lib/og";

export const alt = "FadhiliChain: Raise money for anything. Prove every shilling.";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return siteOg();
}
