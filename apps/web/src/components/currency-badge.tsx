import { existsSync } from "node:fs";
import { join } from "node:path";

export type CurrencyCode = "KES" | "KESm" | "USDC" | "USDT" | "USDm";

const FALLBACK: Record<CurrencyCode, { bg: string; fg: string; text: string }> = {
  KES: { bg: "#1d2417", fg: "#f4efe4", text: "KSh" },
  KESm: { bg: "#d4f25c", fg: "#1d2417", text: "KESm" },
  USDC: { bg: "#e6eefc", fg: "#1d2417", text: "USDC" },
  USDT: { bg: "#dff3ec", fg: "#1d2417", text: "USDT" },
  USDm: { bg: "#efe8d6", fg: "#1d2417", text: "USDm" },
};

/**
 * Round currency mark: the issuer's logo from public/currencies/<code>.svg (see SOURCES.md there),
 * or a lettered badge when no file is present.
 */
export function CurrencyBadge({ code, size = 48 }: { code: CurrencyCode; size?: number }) {
  const file = `/currencies/${code.toLowerCase()}.svg`;
  if (existsSync(join(process.cwd(), "public", file))) {
    // Kenyan shillings are shown with the national flag (4:3), stablecoins with their round logos.
    const flag = code === "KES";
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={file}
        alt={flag ? "Kenyan shilling" : code}
        width={size}
        height={flag ? Math.round(size * 0.75) : size}
        className={`shrink-0 ${flag ? "rounded-md object-cover ring-1 ring-ink/10" : "rounded-full"}`}
      />
    );
  }
  const f = FALLBACK[code];
  return (
    <span
      role="img"
      aria-label={code}
      className="grid shrink-0 place-items-center rounded-full font-black tracking-tight"
      style={{ width: size, height: size, background: f.bg, color: f.fg, fontSize: size * (f.text.length > 3 ? 0.24 : 0.3) }}
    >
      {f.text}
    </span>
  );
}
