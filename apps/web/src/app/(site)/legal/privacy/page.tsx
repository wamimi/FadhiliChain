import type { Metadata } from "next";
import Link from "next/link";
import { Doc } from "@/components/doc";

export const metadata: Metadata = { title: "Privacy policy", alternates: { canonical: "/legal/privacy" } };

export default function Privacy() {
  return (
    <Doc
      title="Privacy policy"
      updated="25 October 2026"
      intro={
        <p>
          The short version: donors are anonymous by default, we collect only what we need to run fundraisers, and we never sell your data.
        </p>
      }
    >
      <h2>What we collect</h2>
      <ul>
        <li><b>Sign-in details.</b> Your email, Google account email or phone number, handled by our sign-in provider, Privy, to let you sign in.</li>
        <li><b>Your account address.</b> The public address created for you when you first sign in.</li>
        <li><b>Organiser details.</b> For campaigns: the story, photo, names, and a private phone number or email the reviewer uses to verify you.</li>
        <li><b>Donation details.</b> A copy of each donation (amount, account ID, time) and the optional message you add.</li>
        <li><b>Basic technical logs</b> needed to keep the service running and stop abuse, such as rate limits on network-fee top-ups.</li>
      </ul>

      <h2>What is public</h2>
      <p>
        Fundraiser stories, organiser display names, fundraiser totals, and donation amounts with any message of support, shown without the donor&apos;s name.
      </p>
      <p>
        To make totals verifiable, each donation is also recorded permanently on a public blockchain. That record contains the amount and an anonymous account ID,
        never your name, email or phone number. We never publish which person an account ID belongs to.
      </p>

      <h2>What is never public</h2>
      <p>Donor names, emails and phone numbers, and the contact details organisers give reviewers. Reviewers see organiser contact details only to verify fundraisers.</p>

      <h2>Who we share with</h2>
      <ul>
        <li>Privy, for sign-in and to secure your account key. We never receive your key.</li>
        <li>Supabase, which hosts our database and photos.</li>
        <li>The Celo and Base blockchains, which record donations against anonymous account IDs as described above.</li>
      </ul>
      <p>We do not sell data, show ads, or share data with advertisers.</p>

      <h2>Your rights</h2>
      <p>
        Under Kenya&apos;s Data Protection Act, 2019 you can ask to see, correct or delete the personal data we hold. We can delete data in our database, such as
        your messages or your contact details. Blockchain records cannot be deleted by anyone, which is why they never contain your personal details. To make a request, see <Link href="/contact">contact</Link>.
      </p>

      <h2>How long we keep data</h2>
      <p>Organiser contact details are deleted 12 months after a fundraiser ends. Donation copies are kept while the fundraiser page exists.</p>
    </Doc>
  );
}
