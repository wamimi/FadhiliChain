# FadhiliChain

A blockchain-based charity contributions platform. Every contribution is recorded on a public ledger, and campaign funds are released to the recipient only if the target is met by the deadline; otherwise each donor can reclaim their contribution.

The project runs on public test networks only: Celo Sepolia (Mento KESm and USDm stablecoins) and Base Sepolia (test USDC).

## Repository layout

| Path | Contents |
| --- | --- |
| `packages/contracts` | Solidity contracts, tests and deploy modules (Hardhat 3). See its README. |
| `apps/web` | Web application (Next.js). |

## Requirements

- Node.js 22 or later
- pnpm, enabled through Corepack: `corepack enable`

## Getting started

```bash
pnpm install
pnpm contracts:test
```
