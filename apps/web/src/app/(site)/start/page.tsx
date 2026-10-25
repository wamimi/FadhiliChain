import type { Metadata } from "next";
import { StartForm } from "@/components/start/start-form";
import { PageHead } from "@/components/page-head";
import { CHAINS } from "@/lib/chains";
import { previewMode } from "@/lib/data";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Start a fundraiser",
  description: `Raise money for anything and accept donations from anywhere. ${SITE.feePercent}% only if you hit your goal.`,
  alternates: { canonical: "/start" },
};

export default function StartPage() {
  const networks = CHAINS.map((c) => ({
    chainId: c.chain.id,
    name: c.name,
    label: c.chain.id === 84532 ? "Global (US dollars)" : c.chain.id === 31337 ? "Local test chain" : "Kenya and Africa (shillings and dollars)",
    live: Boolean(c.factory),
    factory: c.factory ?? null,
    tokens: c.tokens,
  }));
  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-28 sm:px-8 lg:px-14">
      <PageHead
        title="Start a fundraiser"
        lead={`Set up in minutes. We verify every fundraiser within two days, and you pay ${SITE.feePercent}% only when you hit your goal.`}
      />
      <StartForm networks={networks} preview={previewMode} />
    </div>
  );
}
