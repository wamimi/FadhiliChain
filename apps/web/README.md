# Web application

Next.js 16 (App Router) front end and API for FadhiliChain.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4, Geist, Motion |
| Sign-in and accounts | Privy (email, Google, SMS; embedded wallets created on login) |
| Chain access | wagmi 3, viem |
| Database and photo storage | Supabase (schema in `/supabase/migrations`) |

## Running locally

```bash
cp .env.example .env.local   # fill in what you have; every integration is optional
pnpm dev                     # from the repository root
```

Without Supabase the site runs in preview mode with example campaigns, so pages can be reviewed before anything is deployed. Without Privy, sign-in is disabled.

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/campaigns`, `/c/[id]` | Browse campaigns; campaign page with giving, refunds, withdrawal and on-chain proof |
| `/start` | Create a campaign: story, terms, EIP-712 signature, submission for review |
| `/me` | Donor and organiser dashboard |
| `/admin` | Review queue for accounts holding `APPROVER_ROLE` |
| `/receipt`, `/receipt/[ref]` | Receipt lookup that compares the database copy with the transaction on chain |
| `/study`, `/study/receipt/[ref]` | Research study: receipt-only version and verifiable version |
| `/how-it-works`, `/fees`, `/faq`, `/about`, `/contact`, `/transparency` | Information pages |
| `/legal/*` | Terms, privacy, refund policy, campaign rules |

## API routes

| Route | Purpose |
| --- | --- |
| `POST /api/campaigns` | Verifies the organiser's EIP-712 signature and story hash, then stores the campaign as pending |
| `PATCH /api/campaigns/[id]` | Reviewer approval (checked against the `CampaignCreated` event) or rejection |
| `POST /api/contributions` | Records a contribution by reading the transaction from the chain |
| `POST /api/gas` | Gas tank: tops up a signed-in user's network-fee balance, at most once a day |
| `GET /api/me`, `GET /api/reviews` | Dashboard data and review queue |
| `POST /api/upload` | Campaign photo upload |
| `GET /api/sync` | Catch-up indexer for `Contributed` events, protected by `CRON_SECRET` |

Server routes identify users by verifying the Privy identity token sent in the `x-privy-id-token` header. Reviewer permissions are read from the factory contract (`hasRole`), not from the database.

## Configuration

See `.env.example`. In the Privy dashboard, enable identity tokens (they carry the user's linked wallets to the server), the email, Google and SMS login methods, and embedded wallets for users without wallets.
