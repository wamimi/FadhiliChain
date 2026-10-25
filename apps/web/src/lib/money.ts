import { formatUnits, parseUnits } from "viem";
import type { TokenInfo } from "./chains";

const kes = new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 });
const usd = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Format a token amount (in smallest units) the way people read money. */
export function formatMoney(amount: bigint | string, token: Pick<TokenInfo, "currency" | "decimals">) {
  const n = Number(formatUnits(BigInt(amount), token.decimals));
  return token.currency === "KES" ? `KSh ${kes.format(n)}` : `$${usd.format(n)}`;
}

export function formatPlain(amount: bigint | string, token: Pick<TokenInfo, "decimals" | "currency">) {
  const n = Number(formatUnits(BigInt(amount), token.decimals));
  return token.currency === "KES" ? kes.format(n) : usd.format(n);
}

export function toUnits(value: string, token: Pick<TokenInfo, "decimals">) {
  return parseUnits(value.replace(/[,\s]/g, "") || "0", token.decimals);
}

export function currencyPrefix(token: Pick<TokenInfo, "currency">) {
  return token.currency === "KES" ? "KSh" : "$";
}

export function percent(raised: bigint, target: bigint) {
  if (target === 0n) return 0;
  return Math.min(100, Number((raised * 10000n) / target) / 100);
}

export function timeLeft(deadline: number, now = Date.now() / 1000) {
  const s = deadline - now;
  if (s <= 0) return "Ended";
  const d = Math.floor(s / 86400);
  if (d >= 2) return `${d} days left`;
  const h = Math.floor(s / 3600);
  if (h >= 1) return `${h} hours left`;
  return `${Math.max(1, Math.floor(s / 60))} min left`;
}

export function shortAddress(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}
