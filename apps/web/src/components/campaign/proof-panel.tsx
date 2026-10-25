"use client";

import { useState } from "react";
import { Check, ExternalLink, X } from "lucide-react";

export type ProofRow = { label: string; value: string; href?: string; ok?: boolean; mono?: boolean };

/** "Show proof" switch: the plain page by default, the on-chain details for anyone who wants to check. */
export function ProofPanel({ rows, live }: { rows: ProofRow[]; live: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-[28px] bg-ink p-6 text-cream" aria-labelledby="proof-title">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 id="proof-title" className="text-lg font-extrabold">
            Verify this fundraiser
          </h2>
          <p className="text-sm text-cream/65">{live ? "Live figures, verified just now." : "Showing saved figures. Live verification is temporarily unavailable."}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={open}
          onClick={() => setOpen(!open)}
          className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${open ? "bg-lime" : "bg-cream/20"}`}
        >
          <span className="sr-only">Show verification details</span>
          <span className={`absolute top-1 size-6 rounded-full bg-cream transition-all ${open ? "left-7 bg-ink" : "left-1"}`} />
        </button>
      </div>
      {open && (
        <dl className="mt-6 space-y-4 border-t border-cream/10 pt-5 text-sm">
          {rows.map((r) => (
            <div key={r.label}>
              <dt className="flex items-center gap-2 text-cream/60">
                {r.ok !== undefined &&
                  (r.ok ? <Check size={15} className="text-lime" strokeWidth={3} /> : <X size={15} className="text-[#ff9a85]" strokeWidth={3} />)}
                {r.label}
              </dt>
              <dd className={`mt-1 break-all ${r.mono ? "font-mono text-[0.8rem]" : "font-semibold"}`}>
                {r.href ? (
                  <a href={r.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-lime">
                    {r.value} <ExternalLink size={13} />
                  </a>
                ) : (
                  r.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
