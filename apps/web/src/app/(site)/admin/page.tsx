import type { Metadata } from "next";
import { ReviewQueue } from "@/components/admin/review-queue";

export const metadata: Metadata = { title: "Review queue", robots: { index: false, follow: false } };

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-28 sm:px-8 lg:px-14">
      <ReviewQueue />
    </div>
  );
}
