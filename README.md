# FadhiliChain

A blockchain-based charity contributions platform. Every contribution is recorded on a public ledger, and campaign funds are released to the recipient only if the target is met by the deadline; otherwise each donor can reclaim their contribution.

The project runs on public test networks only: Celo Sepolia (Mento KESm and USDm stablecoins) and Base Sepolia (test USDC).

## Repository layout

| Path | Contents |
| --- | --- |
| `packages/contracts` | Solidity contracts, tests and deploy scripts (Foundry). See its README. |
| `apps/web` | Web application and API (Next.js). See its README. |
| `supabase/migrations` | Database schema and row level security policies. |

## Requirements

- Node.js 22 or later
- [Foundry](https://getfoundry.sh) for the contracts
- pnpm 12, installed globally: `npm install -g pnpm@12` (Corepack's bundled versions cannot start pnpm 12)

## Getting started

```bash
pnpm install
pnpm contracts:test
```

## Running the web app

```bash
cp apps/web/.env.example apps/web/.env.local
pnpm dev
```

The site opens at http://localhost:3000. With no environment variables set it runs in preview mode with example campaigns.

## Setting up services

1. **Supabase:** create a project, then run `supabase/migrations/0001_init.sql` in the SQL editor. Copy the project URL and service role key into `.env.local`.
2. **Privy:** create an app, enable email, Google and SMS login, embedded wallets ("create on login") and identity tokens. Copy the app ID and secret into `.env.local`.
3. **Contracts:** deploy with `pnpm --filter @fadhili/contracts deploy:celo` and `deploy:base` (see `packages/contracts/README.md`). Copy the factory addresses and start blocks from `packages/contracts/deployments/` into `.env.local`.
4. **Gas tank:** create a new wallet used only for this, fund it with test CELO and Base Sepolia ETH, and set `GAS_TANK_PRIVATE_KEY`.
