import type { ReactNode } from "react";

/** Long-form text pages (legal, policies). */
export function Doc({ title, updated, intro, children }: { title: string; updated?: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-28 sm:px-8 lg:px-14">
      <div className="pt-8 pb-10 lg:pt-14">
        <h1 className="display max-w-[18ch] text-[clamp(2.6rem,6vw,5.5rem)]">{title}</h1>
        {updated && <p className="mt-5 text-sm text-muted">Last updated {updated}</p>}
      </div>
      <div className="doc max-w-[72ch] text-[1.06rem] leading-[1.75] text-ink/85">
        {intro && <div className="mb-8 rounded-2xl bg-sand p-5 text-ink">{intro}</div>}
        {children}
      </div>
    </div>
  );
}
