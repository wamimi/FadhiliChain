import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { campaignFactoryAbi } from "@fadhili/contracts/abi";
import { PageHead } from "@/components/page-head";
import { CHAINS, addressUrl } from "@/lib/chains";
import { publicClient } from "@/lib/rpc";
import { platformTotals } from "@/lib/data";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Transparency",
  description: "FadhiliChain's contracts, fee rate and totals, read live from the public networks.",
  alternates: { canonical: "/transparency" },
};

export const revalidate = 60;

async function readChain(c: (typeof CHAINS)[number]) {
  if (!c.factory) return null;
  try {
    const client = publicClient(c.chain.id);
    const [feeBps, treasury, count, allowed] = await Promise.all([
      client.readContract({ address: c.factory, abi: campaignFactoryAbi, functionName: "feeBps" }),
      client.readContract({ address: c.factory, abi: campaignFactoryAbi, functionName: "treasury" }),
      client.readContract({ address: c.factory, abi: campaignFactoryAbi, functionName: "campaignCount" }),
      Promise.all(c.tokens.map((t) => client.readContract({ address: c.factory!, abi: campaignFactoryAbi, functionName: "isTokenAllowed", args: [t.address] }))),
    ]);
    return { feeBps: Number(feeBps), treasury, count: Number(count), allowed };
  } catch {
    return "unreachable" as const;
  }
}

const kes = new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 });

export default async function Transparency() {
  const [totals, chains] = await Promise.all([
    platformTotals().catch(() => null),
    Promise.all(CHAINS.map(async (c) => ({ c, live: await readChain(c) }))),
  ]);

  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-28 sm:px-8 lg:px-14">
      <PageHead title="Transparency" lead="Everything on this page is read from the public networks when it loads, not typed in by us." />

      {totals && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            [String(totals.campaigns), "fundraisers live or finished"],
            [`KSh ${kes.format(Number(totals.raisedKes / 10n ** 18n))}`, "raised in shilling fundraisers"],
            [String(totals.donors), "donors across fundraisers"],
          ].map(([n, l]) => (
            <div key={l} className="rounded-[28px] bg-moss p-7 text-cream">
              <p className="tabular text-[clamp(2.2rem,4vw,3.4rem)] leading-none font-black tracking-tight text-lime">{n}</p>
              <p className="mt-3 text-cream/80">{l}</p>
            </div>
          ))}
        </div>
      )}

      <section className="mt-16" aria-labelledby="contracts">
        <h2 id="contracts" className="text-3xl font-black tracking-tight">
          Contracts
        </h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {chains.map(({ c, live }) => (
            <div key={c.chain.id} className="rounded-[28px] bg-paper p-7 ring-1 ring-ink/8">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-xl font-extrabold">{c.name}</h3>
                <span className={`rounded-full px-3 py-1 text-sm font-bold ${live && live !== "unreachable" ? "bg-lime" : "bg-sand"}`}>
                  {!c.factory ? "Not deployed yet" : live === "unreachable" ? "Network unreachable" : "Live"}
                </span>
              </div>
              {c.factory && (
                <dl className="mt-5 space-y-3 text-[0.95rem]">
                  <div>
                    <dt className="text-muted">Fundraiser factory</dt>
                    <dd className="tabular break-all font-semibold">
                      {addressUrl(c.chain.id, c.factory) ? (
                        <a href={addressUrl(c.chain.id, c.factory)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:underline">
                          {c.factory} <ExternalLink size={14} />
                        </a>
                      ) : (
                        c.factory
                      )}
                    </dd>
                  </div>
                  {live && live !== "unreachable" && (
                    <>
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted">Fee for new fundraisers</dt>
                        <dd className="font-semibold">{live.feeBps / 100}% (maximum the contract allows: 5%)</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted">Fundraisers created</dt>
                        <dd className="tabular font-semibold">{live.count}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">Fee recipient</dt>
                        <dd className="tabular break-all font-semibold">{live.treasury}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">Accepted currencies</dt>
                        <dd className="font-semibold">{c.tokens.filter((_, i) => live.allowed[i]).map((t) => t.symbol).join(", ") || "None"}</dd>
                      </div>
                    </>
                  )}
                </dl>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 grid gap-6 rounded-[36px] bg-ink p-8 text-cream sm:p-12 lg:grid-cols-2" aria-labelledby="powers">
        <h2 id="powers" className="display text-[clamp(2rem,4vw,3.6rem)]">What we can and can&apos;t do</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="font-extrabold text-lime">We can</h3>
            <ul className="mt-3 space-y-2 text-cream/80">
              <li>Approve or decline signed fundraisers</li>
              <li>Cancel a fraudulent fundraiser before payout, which opens refunds</li>
              <li>Set the fee for future fundraisers, up to 5%</li>
              <li>Choose which currencies new fundraisers accept</li>
            </ul>
          </div>
          <div>
            <h3 className="font-extrabold text-lime">We can&apos;t</h3>
            <ul className="mt-3 space-y-2 text-cream/80">
              <li>Move, freeze or redirect any fundraiser&apos;s money</li>
              <li>Change a fundraiser&apos;s target, deadline or payout wallet</li>
              <li>Raise the fee on an existing fundraiser</li>
              <li>Stop a donor from claiming a refund</li>
            </ul>
          </div>
        </div>
      </section>

      <p className="mt-10 text-muted">
        Source code and tests:{" "}
        <a href={SITE.github} target="_blank" rel="noreferrer" className="font-semibold text-ink underline">
          {SITE.github.replace("https://", "")}
        </a>
      </p>
    </div>
  );
}
