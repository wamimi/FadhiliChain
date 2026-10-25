import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/page-head";
import { recentContributions } from "@/lib/data";

export const metadata: Metadata = {
  title: "Research study",
  description: "How the FadhiliChain evaluation compares a receipt-only experience with publicly verifiable records.",
  alternates: { canonical: "/study" },
};

export const revalidate = 300;

export default async function Study() {
  const sample = (await recentContributions(1).catch(() => []))[0];
  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-28 sm:px-8 lg:px-14">
      <PageHead
        title="Research study"
        lead="FadhiliChain is being evaluated as part of a final-year project at Zetech University. Participants compare two ways of being told where their contribution went."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col rounded-[32px] bg-sand p-8">
          <p className="text-sm font-bold tracking-wide text-muted uppercase">Version A</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">Receipt only</h2>
          <p className="mt-3 flex-1 text-muted">
            What most fundraising platforms give you today: a confirmation that says your money arrived. You take the platform&apos;s word for it.
          </p>
          {sample && (
            <Link href={`/study/receipt/${sample.ref}`} className="pill pill-ink mt-6 self-start">
              View a receipt-only confirmation
            </Link>
          )}
        </div>
        <div className="flex flex-col rounded-[32px] bg-moss p-8 text-cream">
          <p className="text-sm font-bold tracking-wide text-cream/60 uppercase">Version B</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">Verifiable record</h2>
          <p className="mt-3 flex-1 text-cream/80">
            The same contribution, checked live against the public record, with the fundraiser&apos;s locked terms. If anyone edits the database, the page shows it.
          </p>
          {sample && (
            <Link href={`/receipt/${sample.ref}`} className="pill pill-lime mt-6 self-start">
              View the verifiable record
            </Link>
          )}
        </div>
      </div>
      <div className="doc mt-14 max-w-[70ch] text-[1.05rem] leading-[1.75] text-ink/85">
        <h2>For participants</h2>
        <p>
          You&apos;ll be asked to make a test contribution, look at one of the two versions, and answer a few questions about how much you trust that your money went
          where it should. Everything uses test money; nothing you do costs anything.
        </p>
        <h2>Tamper test</h2>
        <p>
          To show why the public record matters, the study edits a contribution in our own database and asks participants to check it in each version. The
          receipt-only version shows the edited number. The verifiable version flags the mismatch.
        </p>
      </div>
    </div>
  );
}
