# Contracts

Two production contracts and test-only mocks, built with Hardhat 3, Solidity 0.8.28 and OpenZeppelin Contracts 5.6.

| Contract | Purpose |
| --- | --- |
| `CampaignFactory` | Creates reviewed campaigns as EIP-1167 clones of one `Campaign` implementation, keeps the list of accepted stablecoins and holds the platform roles. |
| `Campaign` | Holds one fundraiser's contributions in a single stablecoin and enforces its withdrawal and refund rules. |
| `test/MockStablecoin` | Mintable ERC-20 with configurable decimals for local development and tests. |
| `test/HostileTokens` | Fee-on-transfer, re-entering and blocklisting tokens used only by the tests. |

## Campaign rules

- Contributions are accepted while `block.timestamp < deadline` and the campaign is not cancelled.
- At or after the deadline, a campaign whose `totalRaised >= target` can be withdrawn once by its recipient (`withdraw` or `withdrawTo`).
- At or after the deadline with `totalRaised < target`, or after cancellation, each donor can reclaim their own contribution once (`claimRefund`).
- Withdrawal and refunds are mutually exclusive.
- The organiser can cancel only while the campaign is open. An account with `CANCELLER_ROLE` can cancel at any time before withdrawal. Cancelling moves no funds; it only opens refunds.
- No function lets an administrator send campaign funds anywhere other than the recipient (on success) or the donor who paid them (on failure or cancellation).

## Creating a campaign

The organiser signs the campaign terms as EIP-712 typed data (`CampaignRequest`: token, organiser, recipient, target, deadline, metadata hash, nonce, expiry). An account with `APPROVER_ROLE` submits the signed request to `CampaignFactory.createCampaign` after review. Because the factory verifies the organiser's signature (EOA or ERC-1271), the approver cannot change the recipient, target or deadline. Nonces prevent a request from being used twice and `expiry` limits how long an unused request stays valid.

`target` is expressed in the token's smallest unit: 18 decimals for KESm and USDm, 6 for USDC.

## Security considerations

The contracts were written against the attack categories used by the Pashov Audit Group solidity-auditor agents (access control, execution trace, invariants, math precision, boundaries, asymmetry, economic security, periphery and first principles).

- Clones are initialised by the factory in the same transaction that creates them; the implementation's initialiser is disabled.
- State changes precede external transfers in `withdraw` and `claimRefund`, and all fund-moving functions are `nonReentrant`.
- Transfers use `SafeERC20`. `contribute` measures the balance change and rejects tokens that deliver less than the stated amount, such as fee-on-transfer tokens.
- One status function (`status()`) defines the open, successful, failed, cancelled and withdrawn states, so every entry point uses the same deadline boundary.
- Refunds are pulled by each donor, so there are no loops over donors and one failing donor cannot block others.
- `withdrawTo` lets a recipient blocked by a token issuer (as USDC can do) direct the payout elsewhere.
- Default admin transfer is two-step with a delay (`AccessControlDefaultAdminRules`).

Accepted limitations:

- Tokens sent to a campaign without calling `contribute` are not recorded. On a successful campaign they are paid to the recipient; otherwise they remain in the contract.
- An account with `CANCELLER_ROLE` can cancel a successful campaign before it is withdrawn. Donors are refunded in that case, but the recipient loses the payout, so the role is reserved for responding to fraud.
- An account with `APPROVER_ROLE` decides which signed requests become campaigns. It cannot alter a request, but it can decline one.
- If a token issuer blocks or pauses the campaign contract itself, funds stay locked until the issuer lifts the block.
- Only standard, non-rebasing stablecoins should be added to the token list.
- The contracts have not had a professional audit and are intended for test networks.

## Tests

```bash
pnpm test
```

Runs 37 Solidity tests: 32 unit tests (`TC01`–`TC32`), a fuzz test over random contribution sets and four invariant tests (withdrawal and refunds are exclusive, outstanding contributions are fully backed, per-donor accounting matches deposits and refunds, and tokens in equal tokens held plus tokens paid out).

## Deployment

Secrets are read through Hardhat configuration variables. Store them in the encrypted Hardhat keystore rather than in files:

```bash
npx hardhat keystore set DEPLOYER_PRIVATE_KEY
npx hardhat keystore set CELO_SEPOLIA_RPC_URL     # e.g. https://forno.celo-sepolia.celo-testnet.org
npx hardhat keystore set BASE_SEPOLIA_RPC_URL     # e.g. https://sepolia.base.org
```

```bash
pnpm deploy:celo    # factory + KESm and USDm allowed
pnpm deploy:base    # factory + test USDC allowed
```

Optional module parameters (`approver`, `canceller`, `adminTransferDelay`) default to the deployer. Additional roles can be granted later:

```bash
FACTORY=0x... ACCOUNT=0x... ROLE=APPROVER_ROLE npx hardhat run scripts/grant-role.ts --network celoSepolia
```

Token addresses used by the deploy modules:

| Network | Token | Address |
| --- | --- | --- |
| Celo Sepolia (11142220) | KESm | `0xC7e4635651E3e3Af82b61d3E23c159438daE3BbF` |
| Celo Sepolia (11142220) | USDm | `0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b` |
| Base Sepolia (84532) | USDC | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |

`ignition/modules/MockKES.ts` deploys a clearly labelled mock Kenyan shilling token for use only if test KESm is unavailable.
