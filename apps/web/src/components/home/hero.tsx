"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, BadgeCheck, EyeOff, RotateCcw, Undo2, type LucideIcon } from "lucide-react";
import { SiteHeader } from "../site-header";

const ease = [0.22, 1, 0.36, 1] as const;

type CardProps = {
  icon: LucideIcon;
  label: string;
  amount: string;
  note: string;
  depth: number;
  rotate: number;
  className: string;
  delay: number;
};

/** Floating product notifications: what donors and fundraisers actually see. */
const CARDS: CardProps[] = [
  { icon: EyeOff, label: "Donation received", amount: "KSh 2,000", note: "Anonymous donor · Verified", depth: 26, rotate: -8, className: "lg:left-[3%] lg:top-[40%]", delay: 0.75 },
  { icon: BadgeCheck, label: "Goal reached", amount: "KSh 50,000", note: "Funds released", depth: -20, rotate: 7, className: "lg:right-[2.5%] lg:top-[36%]", delay: 0.9 },
  { icon: Undo2, label: "Refund sent", amount: "$25.00", note: "Goal missed · 100% returned", depth: 14, rotate: -5, className: "lg:left-[6%] lg:top-[72%]", delay: 1.05 },
];

export function Hero() {
  const reduce = useReducedMotion();
  const cards = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (reduce || window.matchMedia("(max-width: 1023px)").matches) return;
    let mx = 0, my = 0, cx = 0, cy = 0, raf = 0;
    const move = (e: PointerEvent) => {
      mx = e.clientX / innerWidth - 0.5;
      my = e.clientY / innerHeight - 0.5;
    };
    const loop = (t: number) => {
      cx += (mx - cx) * 0.06;
      cy += (my - cy) * 0.06;
      cards.current.forEach((el, i) => {
        if (!el) return;
        const d = CARDS[i].depth;
        el.style.translate = `${cx * d}px ${cy * d + Math.sin(t / 1100 + d) * 8}px`;
      });
      raf = requestAnimationFrame(loop);
    };
    addEventListener("pointermove", move, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, [reduce]);

  const rise = (delay: number) =>
    reduce ? {} : { initial: { y: "105%" }, animate: { y: 0 }, transition: { duration: 1, ease, delay } };

  return (
    <section className="grid-bg relative isolate overflow-hidden bg-moss text-cream">
      <SiteHeader tone="dark" />

      <div className="relative flex flex-col items-center px-5 pt-[clamp(28px,6vh,72px)]">
        <h1 className="display text-center select-none" aria-label="Raise money for anything. Prove every shilling.">
          <span className="block overflow-hidden px-[0.04em] pb-[0.06em]">
            <motion.span {...rise(0.1)} className="display-shadow inline-block text-lime text-[clamp(3.2rem,9.4vw,9.6rem)]">
              Raise money
            </motion.span>
          </span>
          <span className="block overflow-hidden px-[0.04em] pb-[0.06em]">
            <motion.span {...rise(0.22)} className="display-shadow inline-block text-[clamp(3rem,9vw,9.2rem)]">
              for anything.
            </motion.span>
          </span>
          <span className="block overflow-hidden px-[0.04em] pb-[0.06em]">
            <motion.span {...rise(0.34)} className="display-shadow inline-block text-[clamp(1.7rem,4.6vw,4.6rem)]">
              Prove every shilling.
            </motion.span>
          </span>
        </h1>

        <div className="relative z-10 mt-8 flex w-full justify-center gap-0 lg:static lg:mt-0">
          {CARDS.map((c, i) => (
            <motion.div
              key={c.label}
              ref={(el) => {
                cards.current[i] = el;
              }}
              initial={reduce ? false : { opacity: 0, y: 40, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1, ease, delay: c.delay }}
              style={{ rotate: c.rotate }}
              className={`relative flex w-[33%] max-w-[150px] flex-col rounded-[22px] border border-cream/35 bg-cream/15 p-3.5 text-left shadow-[0_30px_60px_-20px_rgba(15,25,10,.45)] backdrop-blur-md sm:max-w-[190px] lg:absolute lg:w-[clamp(210px,16vw,250px)] lg:max-w-none lg:rounded-[28px] lg:p-5 ${c.className} ${i > 0 ? "-ml-3 lg:ml-0" : ""} ${i === 1 ? "mt-6 lg:mt-0" : ""}`}
            >
              <span className="flex items-center gap-2.5">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-lime text-ink lg:size-9">
                  <c.icon size={16} strokeWidth={2.4} />
                </span>
                <span className="text-[0.72rem] leading-tight font-semibold text-cream/85 lg:text-[0.9rem]">{c.label}</span>
              </span>
              <span className="tabular mt-3 text-[1.15rem] leading-none font-black tracking-tight sm:text-[1.5rem] lg:mt-4 lg:text-[clamp(1.4rem,2.1vw,2.1rem)] lg:whitespace-nowrap">{c.amount}</span>
              <span className="mt-1.5 text-[0.72rem] leading-snug text-cream/75 lg:text-[0.88rem]">{c.note}</span>
            </motion.div>
          ))}
        </div>

        <svg className="pointer-events-none absolute top-[6%] right-[8%] z-10 hidden w-[clamp(90px,8vw,130px)] rotate-[8deg] fill-none stroke-lime lg:block" viewBox="0 0 150 170" aria-hidden="true" style={{ strokeWidth: 7, strokeLinecap: "round", strokeLinejoin: "round" }}>
          <motion.path
            d="M120 8 C 128 60, 110 120, 62 128 C 22 134, 12 92, 42 80 C 72 68, 92 104, 70 150 M70 150 L 54 128 M70 150 L 92 140"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.6, ease, delay: 1.2 }}
          />
        </svg>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 1 }}
          className="relative z-20 mt-9 flex flex-col items-center gap-7 pb-36 lg:mt-10"
        >
          <p className="max-w-[46ch] text-center text-[clamp(1.05rem,1rem+0.3vw,1.25rem)] leading-relaxed text-cream/90">
            Accept donations in shillings or stablecoins from anywhere in the world. Track every donation live, keep donors private, and refund everyone in full if you miss your goal.
          </p>
          <div className="flex w-full flex-col gap-3 px-3 sm:w-auto sm:flex-row">
            <Link href="/start" className="pill pill-lime">
              Start a fundraiser <ArrowRight size={18} strokeWidth={2.4} />
            </Link>
            <Link href="/campaigns" className="pill pill-ghost-light">
              Explore fundraisers
            </Link>
          </div>
        </motion.div>

        <div className="absolute -bottom-16 left-1/2 z-20 grid aspect-square w-[150px] -translate-x-1/2 place-items-center rounded-full bg-lime text-ink lg:left-auto lg:right-[27%] lg:w-[clamp(160px,14vw,220px)] lg:translate-x-0" aria-hidden="true">
          <svg viewBox="0 0 200 200" className="absolute inset-0 size-full motion-safe:animate-[spin-slow_18s_linear_infinite]">
            <defs>
              <path id="ring" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
            </defs>
            <text className="fill-ink text-[15px] font-extrabold tracking-[2.6px] uppercase">
              <textPath href="#ring">Miss your goal? · Full refund · </textPath>
            </text>
          </svg>
          <RotateCcw className="w-[30%]" strokeWidth={2.2} />
        </div>
      </div>
    </section>
  );
}
