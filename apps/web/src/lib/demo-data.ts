import type { Campaign, Contribution } from "./types";

// Preview data, used only when no database is configured. Shown with a "preview" notice.
const DAY = 86_400;
const now = Math.floor(Date.now() / 1000);
const KES = "0xC7e4635651E3e3Af82b61d3E23c159438daE3BbF";
const USDC_BASE = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const e18 = (n: number) => (BigInt(n) * 10n ** 18n).toString();
const e6 = (n: number) => (BigInt(n) * 10n ** 6n).toString();

const base = {
  reviewStatus: "approved" as const,
  imageUrl: null,
  metadataHash: "0x5f0e4d1c3a9b2e7f6d8c0b1a2e3f4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9a0f1e" as const,
  feeBps: 200,
  verifiedLive: false,
  reviewNote: null,
};

export const DEMO_CAMPAIGNS: Campaign[] = [
  {
    ...base,
    id: "achieng-kidney",
    chainId: 11142220,
    address: "0x7a3B9c1E2d4F5a6B7c8D9e0F1a2B3c4D5e6F7a8B",
    title: "Help Achieng get a kidney transplant",
    summary: "Achieng, 29, needs a transplant at Kenyatta National Hospital. Her brother is the donor; we are raising the hospital deposit.",
    story:
      "Achieng is a primary school teacher in Kisumu. In March she was diagnosed with end-stage kidney disease and has been on dialysis three times a week since.\n\nHer younger brother Otieno has been confirmed as a match. Kenyatta National Hospital has scheduled the operation for December, but needs a deposit of KSh 50,000 before it can be confirmed.\n\nThe family has covered dialysis so far through NHIF and savings. Every shilling raised here goes straight to the hospital deposit. If we do not reach the target by the deadline, everyone is refunded automatically.",
    category: "medical",
    location: "Kisumu",
    beneficiary: "Achieng Atieno",
    organiserName: "Grace Atieno (sister)",
    organiser: "0x1111111111111111111111111111111111111111",
    recipient: "0x2222222222222222222222222222222222222222",
    token: KES,
    target: e18(50_000),
    deadline: now + 36 * DAY,
    createdAt: new Date((now - 9 * DAY) * 1000).toISOString(),
    raised: e18(38_450),
    donors: 41,
    status: "open",
  },
  {
    ...base,
    id: "kaewa-borehole",
    chainId: 11142220,
    address: "0x8b4C0d2F3e5A6b7C8d9E0f1A2b3C4d5E6f7A8b9C",
    title: "A borehole for Kaewa village",
    summary: "Three hundred households walk 6 km for water. A community borehole ends that for good.",
    story:
      "Kaewa sits in the dry hills of Machakos County. During the dry season, families walk up to 6 km to the nearest reliable water point, a trip that falls mostly on women and girls.\n\nThe Kaewa Water Committee has a hydrogeological survey and a quotation from a licensed driller. The KSh 650,000 target covers drilling, casing, a solar pump and a storage tank.\n\nThe payout goes to the committee's wallet, which needs two signatures from elected members to spend.",
    category: "community",
    location: "Machakos County",
    beneficiary: "Kaewa Water Committee",
    organiserName: "Peter Musyoka (committee chair)",
    organiser: "0x3333333333333333333333333333333333333333",
    recipient: "0x4444444444444444444444444444444444444444",
    token: KES,
    target: e18(650_000),
    deadline: now + 98 * DAY,
    createdAt: new Date((now - 20 * DAY) * 1000).toISOString(),
    raised: e18(402_000),
    donors: 212,
    status: "open",
  },
  {
    ...base,
    id: "faith-moi-fees",
    chainId: 11142220,
    address: "0x9c5D1e3A4f6B7c8D9e0F1a2B3c4D5e6F7a8B9c0D",
    title: "Faith's first year at Moi University",
    summary: "Faith scored an A- in KCSE and was admitted to study nursing. Her family can't cover first-year fees.",
    story:
      "Faith grew up in Eldoret and was the top student in her sub-county last year. She has been admitted to Moi University's School of Nursing.\n\nThe first-year fees and accommodation come to KSh 65,000. HELB covers part of second year onwards, but not the first semester.\n\nThe payout goes directly to her mother's wallet and is paid to the university fees account.",
    category: "education",
    location: "Eldoret",
    beneficiary: "Faith Chebet",
    organiserName: "Mary Chebet (mother)",
    organiser: "0x5555555555555555555555555555555555555555",
    recipient: "0x5555555555555555555555555555555555555555",
    token: KES,
    target: e18(65_000),
    deadline: now + 26 * DAY,
    createdAt: new Date((now - 12 * DAY) * 1000).toISOString(),
    raised: e18(47_300),
    donors: 58,
    status: "open",
  },
  {
    ...base,
    id: "ruiru-church-roof",
    chainId: 11142220,
    address: "0xaD6E2f4B5a7C8d9E0f1A2b3C4d5E6f7A8b9C0d1E",
    title: "New roof for PCEA Ruiru youth hall",
    summary: "The youth hall roof leaks every rainy season. We're replacing it before the long rains.",
    story:
      "The youth hall hosts Sunday school, choir practice and a weekday homework club for 80 children. The iron sheets are 30 years old and the hall floods every time it rains.\n\nThe target covers new sheets, timber and labour from a local fundi. Receipts will be posted here as the work is done.",
    category: "faith",
    location: "Ruiru, Kiambu",
    beneficiary: "PCEA Ruiru Youth",
    organiserName: "Rev. James Kariuki",
    organiser: "0x6666666666666666666666666666666666666666",
    recipient: "0x7777777777777777777777777777777777777777",
    token: KES,
    target: e18(180_000),
    deadline: now - 2 * DAY,
    createdAt: new Date((now - 40 * DAY) * 1000).toISOString(),
    raised: e18(183_900),
    donors: 133,
    status: "successful",
  },
  {
    ...base,
    id: "baby-imani-surgery",
    chainId: 84532,
    address: "0xbE7F3a5C6b8D9e0F1a2B3c4D5e6F7a8B9c0D1e2F",
    title: "Heart surgery for baby Imani",
    summary: "Imani, 8 months, needs surgery to repair a hole in her heart. Friends abroad can give in dollars.",
    story:
      "Imani was born with a ventricular septal defect. Her cardiologist at Gertrude's Children's Hospital has recommended surgery before her first birthday.\n\nMuch of the family lives abroad, so this campaign collects US dollars (USDC). The payout covers the surgery deposit.",
    category: "medical",
    location: "Nairobi",
    beneficiary: "Imani Wanjiru",
    organiserName: "Joseph Kamau (father)",
    organiser: "0x8888888888888888888888888888888888888888",
    recipient: "0x8888888888888888888888888888888888888888",
    token: USDC_BASE,
    target: e6(3_000),
    deadline: now + 45 * DAY,
    createdAt: new Date((now - 5 * DAY) * 1000).toISOString(),
    raised: e6(1_240),
    donors: 27,
    status: "open",
  },
  {
    ...base,
    id: "mama-wairimu-sendoff",
    chainId: 11142220,
    address: "0xcF8A4b6D7c9E0f1A2b3C4d5E6f7A8b9C0d1E2f3A",
    title: "Send-off for Mama Wairimu",
    summary: "Help the family give Mama Wairimu, a teacher for 38 years, a dignified send-off in Nyeri.",
    story:
      "Mama Wairimu taught at Kiganjo Primary for 38 years. Many of her former students are now parents and grandparents in the village.\n\nThe family is raising funds for the hospital bill, the burial and the send-off. Contributions above the target go towards her grandchildren's school fees.",
    category: "funeral",
    location: "Nyeri",
    beneficiary: "Family of Mama Wairimu",
    organiserName: "David Maina (son)",
    organiser: "0x9999999999999999999999999999999999999999",
    recipient: "0x9999999999999999999999999999999999999999",
    token: KES,
    target: e18(250_000),
    deadline: now + 6 * DAY,
    createdAt: new Date((now - 3 * DAY) * 1000).toISOString(),
    raised: e18(96_500),
    donors: 87,
    status: "open",
  },
];

const names = ["Wanjiku", "Otieno", null, "Kiprop", "Achieng", "Hassan", "Njeri", null, "Mutua", "Akinyi"];
const amounts = [1500, 500, 2000, 750, 300, 1000, 2500, 5000, 200, 1200];

export const DEMO_CONTRIBUTIONS: Contribution[] = DEMO_CAMPAIGNS.flatMap((c, ci) =>
  amounts.slice(0, 6 + (ci % 4)).map((a, i) => {
    const hash = `0x${(ci * 97 + i * 13 + 1).toString(16).padStart(4, "0")}9f2c41d7a8e3b60c5d1f4a7e2b9c8d3f6a1e0b7c4d9f2a5e8b1c6d3f0a7e4b1c`.slice(0, 66) as `0x${string}`;
    const usd = c.token === USDC_BASE;
    return {
      ref: `FC-${hash.slice(2, 6).toUpperCase()}-${hash.slice(6, 10).toUpperCase()}-0${i}`,
      chainId: c.chainId,
      campaign: c.address!,
      txHash: hash,
      logIndex: i,
      donor: `0x${(i + 1).toString(16).repeat(40)}`.slice(0, 42) as `0x${string}`,
      amount: usd ? e6(Math.round(a / 130)) : e18(a),
      blockNumber: 1_000_000 + ci * 1000 + i,
      blockTime: new Date((now - (((ci * 5 + i * 3) % 47) + i) * 3600) * 1000).toISOString(),
      displayName: names[i],
      message: i === 0 ? "Pole sana. Praying for you." : i === 3 ? "Tuko pamoja!" : null,
    };
  }),
);

/** A preview receipt whose database copy has been edited, to show what tamper detection looks like. */
export const DEMO_TAMPERED_REF = "FC-DEMO-EDIT-01";
