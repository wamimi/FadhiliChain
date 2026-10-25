"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export function ReceiptForm({ initial = "", autoFocus = false }: { initial?: string; autoFocus?: boolean }) {
  const [value, setValue] = useState(initial);
  const router = useRouter();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const v = value.trim();
        if (v) router.push(`/receipt/${encodeURIComponent(v)}`);
      }}
      className="flex gap-2 rounded-full border-[1.5px] border-ink/15 bg-white p-1.5"
    >
      <label htmlFor="receipt-ref" className="sr-only">
        Receipt reference or transaction hash
      </label>
      <input
        id="receipt-ref"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="FC-7Q2K-91DA-01"
        autoFocus={autoFocus}
        autoComplete="off"
        spellCheck={false}
        className="tabular min-w-0 flex-1 bg-transparent px-4 text-[1.05rem] tracking-wide outline-none"
      />
      <button type="submit" className="pill pill-ink min-h-11 px-5">
        <Search size={17} /> Check
      </button>
    </form>
  );
}
