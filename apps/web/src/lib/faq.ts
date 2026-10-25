import { SITE } from "./site";

export type Faq = { q: string; a: string };

/** Shown on the home page. */
export const HOME_FAQ: Faq[] = [
  { q: "What is FadhiliChain?", a: "A fundraising platform where every donation is tracked in real time and refunded in full if the fundraiser misses its goal. You never have to take anyone's word for where the money went." },
  { q: "Do I need a crypto wallet or an app?", a: "No. Log in with your email, Google account or phone number and your account is ready. There's nothing to download and no recovery phrase to remember." },
  { q: "Which currencies can I donate in?", a: "Digital Kenyan shillings (KESm) and digital dollars (USDC and USDm). USDT and direct M-Pesa donations are coming soon." },
  { q: "What happens if a fundraiser misses its goal?", a: "Every donor gets a full refund. No fees, no forms, no waiting for anyone's approval." },
  { q: "Will people see that I donated?", a: "No. Donations are anonymous by default. Your name, email and phone number are never shown publicly." },
  { q: "How much does it cost?", a: `${SITE.feePercent}% of the funds raised, taken only when a fundraiser hits its goal. Donating is free, and so are refunds.` },
  { q: "How do I know a fundraiser is genuine?", a: "Every fundraiser is reviewed before it goes live. If one is found to be fraudulent, we close it and every donor is refunded." },
  { q: "Can FadhiliChain take or freeze the money?", a: "No. Funds can only go to the fundraiser when the goal is met, or back to donors when it isn't. Not even we can move them anywhere else." },
];

export const FAQ_GROUPS: { title: string; items: Faq[] }[] = [
  {
    title: "Donating",
    items: [
      HOME_FAQ[1],
      HOME_FAQ[2],
      { q: "How do I get digital shillings or dollars?", a: "During our test phase, new accounts receive free test funds so you can try donating. Top-ups from M-Pesa and bank cards are coming soon." },
      HOME_FAQ[4],
      { q: "Can I cancel my donation?", a: "Not while a fundraiser is running, so fundraisers can rely on what's been pledged. If the goal is missed or the fundraiser is closed, you get everything back." },
      { q: "How do I verify my donation?", a: "Every donation comes with a reference. Enter it on the Verify a donation page to confirm it was counted, without revealing who gave it." },
    ],
  },
  {
    title: "Fundraising",
    items: [
      { q: "Who can start a fundraiser?", a: "Anyone raising for a genuine need: medical bills, school fees, funerals, emergencies, community projects or faith groups. We review every fundraiser before it goes live." },
      { q: "How long does review take?", a: "Usually less than two days. A reviewer will contact you to confirm a few details." },
      { q: "Can I change my goal or deadline later?", a: "No. Your goal, deadline and where the funds go are locked when you submit. That's what gives donors confidence." },
      { q: "Can funds go straight to a hospital or school?", a: "Yes. When you set up your fundraiser, choose to send funds directly to the institution's account." },
      { q: "How do I withdraw?", a: "Once your fundraiser hits its goal and the deadline passes, withdraw from your dashboard in one tap. M-Pesa withdrawals are coming soon." },
      HOME_FAQ[5],
    ],
  },
  {
    title: "Trust, safety and privacy",
    items: [
      HOME_FAQ[0],
      HOME_FAQ[7],
      HOME_FAQ[6],
      { q: "What data do you collect?", a: "Only what we need to run your account and review fundraisers. We never sell your data or show ads. See our privacy policy for details." },
      { q: "What if FadhiliChain shuts down?", a: "Your money doesn't depend on us. Every fundraiser's funds are held independently, and payouts and refunds can still be claimed." },
      { q: "Is FadhiliChain live?", a: "We're in our test phase. Everything works end to end using test funds, so no real money is at risk." },
    ],
  },
];
