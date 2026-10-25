"use client";
import { Link2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export function Share({ title, path }: { title: string; path: string }) {
  const url = () => `${location.origin}${path}`;
  return (
    <div className="flex gap-2">
      <a
        className="pill pill-ghost min-h-11 flex-1 px-4"
        target="_blank"
        rel="noreferrer"
        href={`https://wa.me/?text=${encodeURIComponent(title)}%20`}
        onClick={(e) => {
          e.currentTarget.href = `https://wa.me/?text=${encodeURIComponent(`${title} ${url()}`)}`;
        }}
      >
        <MessageCircle size={17} /> WhatsApp
      </a>
      <button
        type="button"
        className="pill pill-ghost min-h-11 flex-1 px-4"
        onClick={async () => {
          try {
            if (navigator.share) await navigator.share({ title, url: url() });
            else {
              await navigator.clipboard.writeText(url());
              toast.success("Link copied");
            }
          } catch {
            // dismissed
          }
        }}
      >
        <Link2 size={17} /> Share link
      </button>
    </div>
  );
}
