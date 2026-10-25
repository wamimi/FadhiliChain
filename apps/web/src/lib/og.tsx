import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const OG_SIZE = { width: 1200, height: 630 };

async function fonts() {
  const dir = join(process.cwd(), "assets/fonts");
  const [black, semi] = await Promise.all([readFile(join(dir, "Geist-Black.ttf")), readFile(join(dir, "Geist-SemiBold.ttf"))]);
  return [
    { name: "Geist", data: black, weight: 900 as const, style: "normal" as const },
    { name: "Geist", data: semi, weight: 600 as const, style: "normal" as const },
  ];
}

const C = { moss: "#3f5a2a", deep: "#22351a", cream: "#f4efe4", lime: "#d4f25c", ink: "#1d2417" };

function Logo() {
  return (
    <div style={{ display: "flex", gap: 8, fontSize: 30, fontWeight: 900 }}>
      <div style={{ background: C.cream, color: C.ink, padding: "10px 22px", borderRadius: 999, borderBottomLeftRadius: 6 }}>FADHILI</div>
      <div style={{ background: C.lime, color: C.ink, padding: "10px 22px", borderRadius: 999 }}>CHAIN</div>
    </div>
  );
}

/** Site-wide share image: the headline. */
export async function siteOg() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: C.moss, padding: 64, fontFamily: "Geist" }}>
        <Logo />
        <div style={{ display: "flex", flexDirection: "column", fontWeight: 900, lineHeight: 0.88, letterSpacing: -4, textTransform: "uppercase" }}>
          <span style={{ color: C.lime, fontSize: 124, textShadow: `5px 5px 0 ${C.deep}` }}>Raise money</span>
          <span style={{ color: C.cream, fontSize: 124, textShadow: `5px 5px 0 ${C.deep}` }}>for anything.</span>
          <span style={{ color: C.cream, fontSize: 64, marginTop: 14, textShadow: `4px 4px 0 ${C.deep}` }}>Prove every shilling.</span>
        </div>
        <div style={{ display: "flex", color: C.cream, fontSize: 30, fontWeight: 600, opacity: 0.85 }}>
          Donate in shillings or stablecoins · Donors stay private · Full refund if the goal is missed
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await fonts() },
  );
}

/** Per-campaign share image with live progress. */
export async function campaignOg(c: { title: string; raised: string; target: string; percent: number; location: string }) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: C.moss, padding: 64, fontFamily: "Geist", color: C.cream }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Logo />
          <div style={{ display: "flex", fontSize: 26, fontWeight: 600, opacity: 0.8 }}>{c.location}</div>
        </div>
        <div style={{ display: "flex", fontSize: c.title.length > 48 ? 64 : 80, fontWeight: 900, lineHeight: 1, letterSpacing: -2.5, maxWidth: 1050 }}>{c.title}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
            <span style={{ fontSize: 60, fontWeight: 900, color: C.lime }}>{c.raised}</span>
            <span style={{ fontSize: 30, fontWeight: 600, opacity: 0.8 }}>raised of {c.target}</span>
          </div>
          <div style={{ display: "flex", height: 18, borderRadius: 999, background: "rgba(244,239,228,0.18)", width: "100%" }}>
            <div style={{ display: "flex", height: 18, borderRadius: 999, background: C.lime, width: `${Math.max(2, c.percent)}%` }} />
          </div>
          <div style={{ display: "flex", fontSize: 24, fontWeight: 600, opacity: 0.75 }}>Every donation verified · Donors stay private · Full refund if the goal is missed</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await fonts() },
  );
}

/** Square brand mark for icons. */
export function iconImage(size: number) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: C.moss, borderRadius: size * 0.22 }}>
        <div style={{ display: "flex", width: size * 0.62, height: size * 0.62, borderRadius: 999, borderBottomLeftRadius: size * 0.08, background: C.lime, alignItems: "center", justifyContent: "center", color: C.ink, fontSize: size * 0.42, fontWeight: 900, fontFamily: "sans-serif" }}>
          F
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
