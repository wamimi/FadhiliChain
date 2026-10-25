import type { Metadata } from "next";
import Link from "next/link";
import { Doc } from "@/components/doc";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of use", alternates: { canonical: "/legal/terms" } };

export default function Terms() {
  return (
    <Doc
      title="Terms of use"
      updated="25 October 2026"
      intro={
        <p>
          FadhiliChain is a final-year software engineering project running on <b>test networks</b>. No real money moves through it yet, and these terms
          have not been reviewed by a lawyer. They describe how the service is designed to work.
        </p>
      }
    >
      <h2>1. What FadhiliChain is</h2>
      <p>
        FadhiliChain is software that lets organisers raise money for a stated purpose and lets donors contribute. Contributions are held by a smart
        contract created for each fundraiser, not by FadhiliChain. The contract&apos;s rules decide when money is paid out or refunded, and nobody, including
        FadhiliChain, can override them.
      </p>

      <h2>2. Accounts</h2>
      <p>
        You sign in with an email address, Google account or phone number. Signing in creates an account on the public network that only you control. We
        never see or store the key that controls it. You are responsible for keeping access to the email, Google account or phone you sign in with.
      </p>

      <h2>3. Giving</h2>
      <ul>
        <li>Contributions are final while a fundraiser is open. You cannot withdraw a contribution early.</li>
        <li>If a fundraiser misses its target by its deadline, or is cancelled, you can take back exactly what you gave. See the <Link href="/legal/refunds">refund policy</Link>.</li>
        <li>If a fundraiser meets its target, the money is paid to the payout wallet the organiser signed for, minus the platform fee.</li>
        <li>Donations are anonymous. Each one is recorded on a public blockchain against an anonymous account ID, never your name, email or phone number.</li>
      </ul>

      <h2>4. Raising</h2>
      <ul>
        <li>Organisers must tell the truth about who the money is for and what it will pay for, and must follow the <Link href="/legal/campaign-rules">fundraiser rules</Link>.</li>
        <li>Every fundraiser is reviewed before it goes live. Approval means a reviewer checked the organiser&apos;s identity and evidence; it is not a guarantee.</li>
        <li>The target, deadline and payout wallet are fixed when the organiser signs. They cannot be changed afterwards.</li>
        <li>If we find a fundraiser is fraudulent, we can cancel it before payout. Cancelling never moves money to us; it lets every donor take back their contribution.</li>
      </ul>

      <h2>5. Fees</h2>
      <p>
        FadhiliChain charges {SITE.feePercent}% of the amount paid out when a fundraiser succeeds. The rate is copied into each fundraiser contract when it is
        created and cannot be raised afterwards. Refunds are never charged. Network fees are covered by FadhiliChain. See <Link href="/fees">fees</Link>.
      </p>

      <h2>6. What we can and can&apos;t do</h2>
      <p>
        We can decline or cancel fundraisers, remove stories that break the rules from our website, and pause new sign-ups. We cannot move, freeze or
        redirect money held in a fundraiser contract, and we cannot change a fundraiser&apos;s terms.
      </p>

      <h2>7. Risks</h2>
      <ul>
        <li>The contracts have been tested but have not had a professional security audit.</li>
        <li>Digital currencies depend on their issuers. An issuer could pause a currency or block an address, which could delay a payout or refund.</li>
        <li>Transactions on a public network cannot be reversed. Check amounts before you confirm.</li>
      </ul>

      <h2>8. Liability</h2>
      <p>
        FadhiliChain is provided as is. To the extent the law allows, we are not liable for losses caused by organisers, by currency issuers, by the
        networks the contracts run on, or by you losing access to your sign-in method.
      </p>

      <h2>9. Changes and contact</h2>
      <p>
        We may update these terms. Changes never affect the rules of a fundraiser that already exists, because those rules live in its contract. Questions:
        see <Link href="/contact">contact</Link>.
      </p>
    </Doc>
  );
}
