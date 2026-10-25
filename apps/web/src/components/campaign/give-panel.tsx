"use client";

import Link from "next/link";
import { useState } from "react";
import { useConfig } from "wagmi";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Address } from "viem";
import { useSession } from "../providers";
import { useApi } from "@/lib/api";
import { give, friendlyError, nativeBalance, tokenBalance, ensureChain, type GiveStep } from "@/lib/tx";
import { formatMoney, toUnits, currencyPrefix } from "@/lib/money";
import type { TokenInfo } from "@/lib/chains";

type Props = {
  campaignId: string;
  campaignTitle: string;
  chainId: number;
  campaign: Address;
  token: TokenInfo;
  testnet: boolean;
  preview: boolean;
};

type Phase =
  | { k: "form" }
  | { k: "working"; label: string }
  | { k: "short"; balance: bigint }
  | { k: "done"; refs: { ref: string }[]; txHash: string };

const PRESETS: Record<TokenInfo["currency"], string[]> = { KES: ["200", "500", "1000", "2500"], USD: ["2", "5", "10", "25"] };
const MIN: Record<TokenInfo["currency"], string> = { KES: "50", USD: "0.5" };

export function GivePanel(p: Props) {
  const session = useSession();
  const config = useConfig();
  const api = useApi();
  const [amount, setAmount] = useState(PRESETS[p.token.currency][1]);
  const [message, setMessage] = useState("");
  const [phase, setPhase] = useState<Phase>({ k: "form" });

  let units = 0n;
  try {
    units = toUnits(amount, p.token);
  } catch {
    units = 0n;
  }
  const tooSmall = units < toUnits(MIN[p.token.currency], p.token);

  async function topUp(address: Address) {
    try {
      await api("/api/gas", { method: "POST", json: { chainId: p.chainId, address } });
    } catch {
      // The gas tank is best effort; the wallet may already have enough.
    }
  }

  async function submit() {
    if (p.preview) {
      toast("This is a sample fundraiser", { description: "Donations open on live fundraisers soon." });
      return;
    }
    if (!session.authenticated) return session.login();
    if (tooSmall) return;
    try {
      setPhase({ k: "working", label: "Getting your account ready" });
      const address = await ensureChain(config, p.chainId);
      const native = await nativeBalance(config, p.chainId, address);
      if (native === 0n || native < 10n ** 14n) await topUp(address);
      const bal = await tokenBalance(config, p.chainId, p.token.address, address);
      if (bal < units) return setPhase({ k: "short", balance: bal });

      const labels: Record<GiveStep, string> = { approve: "Authorising the amount", contribute: "Sending your donation" };
      const txHash = await give(config, {
        chainId: p.chainId,
        token: p.token.address,
        campaign: p.campaign,
        amount: units,
        onStep: (s) => setPhase({ k: "working", label: labels[s] }),
      });
      setPhase({ k: "working", label: "Confirming your donation" });
      const res = await api<{ refs: { ref: string }[] }>("/api/contributions", {
        method: "POST",
        json: { chainId: p.chainId, txHash, message: message || null },
      }).catch(() => ({ refs: [] }));
      setPhase({ k: "done", refs: res.refs, txHash });
    } catch (e) {
      toast.error(friendlyError(e));
      setPhase({ k: "form" });
    }
  }

  async function starter() {
    if (!session.address) return;
    setPhase({ k: "working", label: "Adding test funds" });
    try {
      const r = await api<{ sent: { asset: string }[]; note?: string }>("/api/gas", { method: "POST", json: { chainId: p.chainId, address: session.address } });
      if (r.sent.some((s) => s.asset === p.token.symbol)) toast.success("Test money added to your account");
      else toast(r.note ?? "No test money available right now", { description: "Use the faucet steps below instead." });
    } catch (e) {
      toast.error(friendlyError(e));
    }
    setPhase({ k: "form" });
  }

  if (phase.k === "done") {
    const ref = phase.refs[0]?.ref;
    return (
      <div className="rounded-[28px] bg-moss p-7 text-cream">
        <span className="grid size-12 place-items-center rounded-full bg-lime text-ink">
          <Check size={24} strokeWidth={3} />
        </span>
        <h3 className="mt-5 text-2xl font-extrabold tracking-tight">Asante! You donated {formatMoney(units, p.token)}.</h3>
        <p className="mt-2 text-cream/80">It&apos;s held safely until the deadline. If the goal is missed, you get a full refund.</p>
        <p className="mt-6 text-sm text-cream/65">Your donation reference (keep it private)</p>
        <p className="tabular mt-1 text-2xl font-black tracking-wide text-lime">{ref ?? "Being recorded…"}</p>
        <div className="mt-6 flex flex-col gap-2.5">
          <Link href={`/receipt/${ref ?? phase.txHash}`} className="pill pill-lime">
            Verify your donation
          </Link>
          <a
            className="pill pill-ghost-light"
            href={`https://wa.me/?text=${encodeURIComponent(`Support "${p.campaignTitle}". Every shilling is tracked and refunded if the goal is missed: ${location.origin}/c/${p.campaignId}`)}`}
            target="_blank"
            rel="noreferrer"
          >
            Share on WhatsApp
          </a>
        </div>
      </div>
    );
  }

  if (phase.k === "short") {
    return (
      <div className="rounded-[28px] bg-sand p-7">
        <h3 className="text-xl font-extrabold">Add funds to donate {formatMoney(units, p.token)}</h3>
        <p className="mt-2 text-muted">
          Your balance is {formatMoney(phase.balance, p.token)}. This fundraiser accepts {p.token.label}.
        </p>
        {p.testnet ? (
          <>
            <p className="mt-4 text-sm leading-relaxed">
              We&apos;re in our test phase, so these are free test funds. Get test {p.token.symbol} with the button below
              {p.token.symbol === "USDC" && (
                <>
                  , or from the{" "}
                  <a className="underline" href="https://faucet.circle.com" target="_blank" rel="noreferrer">
                    Circle faucet
                  </a>
                </>
              )}
              .
            </p>
            <button type="button" onClick={starter} className="pill pill-ink mt-5 w-full">
              Get test {p.token.symbol}
            </button>
          </>
        ) : (
          <p className="mt-4 text-sm">Top-ups from M-Pesa are coming soon.</p>
        )}
        <button type="button" onClick={() => setPhase({ k: "form" })} className="pill pill-ghost mt-2.5 w-full">
          Back
        </button>
        {session.address && <p className="tabular mt-4 text-xs break-all text-muted">Account ID: {session.address}</p>}
      </div>
    );
  }

  const working = phase.k === "working";
  return (
    <form
      className="rounded-[28px] bg-paper p-6 ring-1 ring-ink/8"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <fieldset disabled={working}>
        <legend className="mb-3 font-bold">Choose an amount</legend>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS[p.token.currency].map((v) => (
            <button
              type="button"
              key={v}
              onClick={() => setAmount(v)}
              className={`tabular h-12 rounded-2xl border-[1.5px] font-semibold transition-colors ${amount === v ? "border-moss bg-moss text-cream" : "border-ink/12 hover:border-ink/40"}`}
            >
              {Number(v).toLocaleString("en-KE")}
            </button>
          ))}
        </div>
        <label className="mt-3 flex items-center gap-2 rounded-2xl border-[1.5px] border-ink/12 bg-white px-4 focus-within:border-moss">
          <span className="font-semibold text-muted">{currencyPrefix(p.token)}</span>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))}
            aria-label="Amount"
            className="tabular h-12 min-w-0 flex-1 bg-transparent text-lg font-bold outline-none"
          />
        </label>
        {tooSmall && amount !== "" && <p className="hint">The minimum donation is {currencyPrefix(p.token)} {MIN[p.token.currency]}.</p>}

        <details className="group mt-4">
          <summary className="cursor-pointer list-none text-sm font-semibold text-moss">Leave a message of support (optional)</summary>
          <div className="mt-3">
            <textarea className="field min-h-20" placeholder="Pole sana. Get well soon." value={message} maxLength={280} onChange={(e) => setMessage(e.target.value)} aria-label="Message" />
            <p className="hint">Shown without your name.</p>
          </div>
        </details>

        <button type="submit" className="pill pill-lime mt-5 w-full text-[1.05rem]" disabled={tooSmall || working}>
          {working ? (
            <>
              <Loader2 size={18} className="animate-spin" /> {phase.label}…
            </>
          ) : session.authenticated || p.preview ? (
            `Donate ${tooSmall ? "" : formatMoney(units, p.token)}`
          ) : (
            "Log in to donate"
          )}
        </button>
      </fieldset>
      <p className="mt-4 text-center text-sm text-muted">No donor fees. Full refund if the goal is missed. Your name is never shown.</p>
    </form>
  );
}
