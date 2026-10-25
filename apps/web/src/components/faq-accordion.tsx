import { Plus } from "lucide-react";
import type { Faq } from "@/lib/faq";

/** Standard single-column FAQ accordion. Uses <details>, so it works without JavaScript. */
export function FaqAccordion({ items, defaultOpen = 0 }: { items: Faq[]; defaultOpen?: number | null }) {
  return (
    <div className="divide-y divide-ink/10 rounded-[28px] bg-paper px-6 ring-1 ring-ink/8 sm:px-8">
      {items.map((f, i) => (
        <details key={f.q} className="group py-1" open={i === defaultOpen}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left text-[1.08rem] font-bold [&::-webkit-details-marker]:hidden">
            {f.q}
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sand transition-transform duration-300 group-open:rotate-45 group-open:bg-lime">
              <Plus size={16} strokeWidth={2.6} />
            </span>
          </summary>
          <p className="max-w-[64ch] pb-6 leading-relaxed text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
