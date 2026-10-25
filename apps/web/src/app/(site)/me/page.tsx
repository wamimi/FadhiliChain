import type { Metadata } from "next";
import { Dashboard } from "@/components/me/dashboard";

export const metadata: Metadata = { title: "Your dashboard", robots: { index: false } };

export default function MePage() {
  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-28 sm:px-8 lg:px-14">
      <Dashboard />
    </div>
  );
}
