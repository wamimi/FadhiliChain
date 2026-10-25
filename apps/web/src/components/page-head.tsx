import type { ReactNode } from "react";

export function PageHead({ title, lead, children }: { title: string; lead?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-6 pt-8 pb-12 lg:flex-row lg:items-end lg:pt-14 lg:pb-16">
      <h1 className="display max-w-[16ch] text-[clamp(2.8rem,7vw,6.5rem)]">{title}</h1>
      {(lead || children) && (
        <div className="max-w-[44ch]">
          {lead && <p className="text-lg leading-relaxed text-muted">{lead}</p>}
          {children}
        </div>
      )}
    </div>
  );
}
