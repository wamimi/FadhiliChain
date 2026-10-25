"use client";
import { motion, useReducedMotion } from "motion/react";

export function Progress({ value, tone = "dark" }: { value: number; tone?: "dark" | "light" }) {
  const reduce = useReducedMotion();
  return (
    <div
      className={`h-2.5 overflow-hidden rounded-full ${tone === "dark" ? "bg-cream/15" : "bg-ink/10"}`}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className={`h-full origin-left rounded-full ${tone === "dark" ? "bg-lime" : "bg-moss"}`}
        initial={reduce ? false : { scaleX: 0 }}
        whileInView={{ scaleX: value / 100 }}
        style={reduce ? { transform: `scaleX(${value / 100})` } : undefined}
        viewport={{ once: true }}
        transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
