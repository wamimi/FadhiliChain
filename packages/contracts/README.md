# Contracts

Two production contracts and test-only mocks, built with Foundry, Solidity 0.8.28 and OpenZeppelin Contracts 5.6. Dependencies (OpenZeppelin, forge-std) are installed by pnpm into `node_modules` and mapped in `foundry.toml`, so no git submodules are needed.

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

## Platform fee

- The factory holds a fee rate (`feeBps`, at most 500 = 5%) and a `treasury` address, both set by the default admin with `setFee`.
- Each campaign copies the rate when it is created, so later changes never affect existing campaigns.
- The fee is taken once, from the balance paid out by a successful withdrawal. Refunds are never charged.
- If the treasury is unset or cannot receive the token (for example, blocked by the issuer), the recipient receives the full balance, so the fee can never block a payout.
- The deploy modules set 2% (`feeBps` 200) with the deployer as treasury unless parameters say otherwise.

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

Requires [Foundry](https://getfoundry.sh) (`forge`, `anvil`, `cast`).

```bash
pnpm test            # forge test
pnpm test:gas        # with a gas report
pnpm coverage        # line and branch coverage
```

The suite has 42 Solidity tests: 37 unit tests (`TC01`–`TC37`), a fuzz test over random contribution sets and four invariant tests (withdrawal and refunds are exclusive, outstanding contributions are fully backed, per-donor accounting matches deposits and refunds, and tokens in equal tokens held plus tokens paid out, including the fee).

## Deployment

The deploy script (`script/Deploy.s.sol`) deploys the factory, grants the approver and canceller roles, sets the fee and allows the network's stablecoins. It writes the addresses and start block to `deployments/<chain id>.json`.

Keys are kept in Foundry's encrypted keystore rather than in files:

```bash
cast wallet import deployerfadhilichain --interactive   # paste the deployer private key, choose a password
```

```bash
pnpm deploy:celo --sender <deployer address>    # factory + KESm, USDm and test USDC allowed, verified on Blockscout
pnpm deploy:base --sender <deployer address>    # factory + test USDC allowed, verified on Blockscout
```

Optional environment variables: `APPROVER`, `CANCELLER` and `TREASURY` default to the deployer, `FEE_BPS` to 200 and `ADMIN_TRANSFER_DELAY` to 86400 seconds. On Celo Sepolia, `DEPLOY_TEST_KES=true` also deploys and allows a labelled test Kenyan shilling (`tKES`) with an open mint, because Mento's KESm has no usable liquidity on the test network.

Both deploy commands verify the contracts on Blockscout (no API key needed). If the Campaign implementation, which the factory deploys in its constructor, is not verified automatically:

```bash
forge verify-contract <implementation> contracts/Campaign.sol:Campaign --chain 11142220 \
  --verifier blockscout --verifier-url https://celo-sepolia.blockscout.com/api/
```

Roles can be granted later with `cast`:

```bash
cast send <factory> "grantRole(bytes32,address)" $(cast keccak APPROVER_ROLE) <account> \
  --account deployerfadhilichain --rpc-url celo_sepolia
```

### Local chain

```bash
pnpm node            # anvil, in one terminal
pnpm deploy:local    # factory plus mock KESm and USDC, using anvil's first default account
```

### Token addresses

| Network | Token | Address |
| --- | --- | --- |
| Celo Sepolia (11142220) | KESm | `0xC7e4635651E3e3Af82b61d3E23c159438daE3BbF` |
| Celo Sepolia (11142220) | USDm | `0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b` |
| Celo Sepolia (11142220) | USDC (Circle test) | `0x01C5C0122039549AD1493B8220cABEdD739BC44E` |
| Base Sepolia (84532) | USDC | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |

`script/DeployMockKES.s.sol` deploys a clearly labelled mock Kenyan shilling and allows it on an existing factory, for use only if test KESm is unavailable.

## ABI export

```bash
pnpm export-abi
```

Builds the contracts and writes the factory and campaign ABIs to `abi/index.ts`, which the web app imports.
