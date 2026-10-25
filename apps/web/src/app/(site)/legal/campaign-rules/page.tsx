import type { Metadata } from "next";
import { Doc } from "@/components/doc";

export const metadata: Metadata = { title: "Fundraiser rules", alternates: { canonical: "/legal/campaign-rules" } };

export default function CampaignRules() {
  return (
    <Doc title="Fundraiser rules" updated="25 October 2026" intro={<p>Every fundraiser is verified against these rules before it goes live.</p>}>
      <h2>What you can raise for</h2>
      <ul>
        <li>Medical bills, treatment and recovery</li>
        <li>School and university fees, uniforms and learning materials</li>
        <li>Funeral and send-off costs</li>
        <li>Community projects: water, classrooms, roads, clinics</li>
        <li>Churches, mosques and faith-based community work</li>
        <li>Emergencies: fire, flood, sudden loss of income</li>
      </ul>

      <h2>What you can&apos;t</h2>
      <ul>
        <li>Anything illegal in Kenya, or payment for illegal goods or services</li>
        <li>Political fundraisers and parties</li>
        <li>Investments, loans, lotteries, or promises of returns to donors</li>
        <li>Raising for someone without their knowledge or their family&apos;s consent</li>
        <li>Publishing medical, financial or other sensitive details about someone without their consent</li>
        <li>Stories that are false, exaggerated, or copied from someone else&apos;s fundraiser</li>
      </ul>

      <h2>What reviewers check</h2>
      <ol>
        <li>That you are who you say you are, by phone or email.</li>
        <li>That the need is real: a hospital estimate, fee structure, quote or death notice.</li>
        <li>That the payout wallet belongs to you or to the institution being paid.</li>
        <li>That the target matches the evidence.</li>
      </ol>

      <h2>After you go live</h2>
      <ul>
        <li>Share receipts with your donors showing how the money was spent.</li>
        <li>If your situation changes and you no longer need the funds, close your fundraiser so donors are refunded.</li>
        <li>If we find a fundraiser broke these rules, we close it and every donor is refunded.</li>
      </ul>
    </Doc>
  );
}
