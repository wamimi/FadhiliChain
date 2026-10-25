import type { Metadata } from "next";
import Link from "next/link";
import { Doc } from "@/components/doc";

export const metadata: Metadata = { title: "Refund policy", alternates: { canonical: "/legal/refunds" } };

export default function Refunds() {
  return (
    <Doc
      title="Refund policy"
      updated="25 October 2026"
      intro={<p>Refunds aren&apos;t a favour we grant. They&apos;re guaranteed by the system itself, and we can&apos;t block them.</p>}
    >
      <h2>When you get your money back</h2>
      <ul>
        <li><b>The goal is missed.</b> If a fundraiser hasn&apos;t reached its goal by the deadline, every donor gets a full refund.</li>
        <li><b>The fundraiser is closed.</b> An organiser can close a fundraiser before the deadline, and we close any fundraiser found to be fraudulent. Either way, every donor is refunded.</li>
      </ul>

      <h2>When you don&apos;t</h2>
      <ul>
        <li>While a fundraiser is running, donations can&apos;t be withdrawn early. This protects fundraisers from pledges disappearing at the last minute.</li>
        <li>Once a successful fundraiser has withdrawn its funds, they belong to the fundraiser.</li>
      </ul>

      <h2>How to claim</h2>
      <p>
        Log in, open the fundraiser (or your <Link href="/me">dashboard</Link>) and choose <b>Claim my refund</b>. The full amount returns to your account
        in seconds. No fee, no deadline.
      </p>

      <h2>Why no one can stop a refund</h2>
      <p>
        The refund rule is built into every fundraiser on the blockchain, not into our website. If FadhiliChain went offline, you could still claim your refund
        with any compatible wallet.
      </p>
    </Doc>
  );
}
