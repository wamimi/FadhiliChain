import { anvil, baseSepolia, celoSepolia } from "viem/chains";
import type { Address, Chain } from "viem";

export type TokenInfo = {
  address: Address;
  symbol: string;
  /** What people see. KESm is shown as Kenyan shillings, the dollar coins as dollars. */
  currency: "KES" | "USD";
  decimals: number;
  label: string;
  /** Test token with an open mint: the gas tank mints starter funds instead of transferring them. */
  mintable?: boolean;
};

export type ChainInfo = {
  chain: Chain;
  name: string;
  short: string;
  factory: Address | undefined;
  /** First block worth scanning for campaign events. */
  fromBlock: bigint;
  rpcUrl: string;
  explorer: string;
  tokens: TokenInfo[];
  testnet: boolean;
};

const addr = (v: string | undefined) => (v && /^0x[0-9a-fA-F]{40}$/.test(v) ? (v as Address) : undefined);

export const CHAINS: ChainInfo[] = [
  {
    chain: celoSepolia,
    name: "Celo Sepolia",
    short: "Celo",
    factory: addr(process.env.NEXT_PUBLIC_FACTORY_CELO_SEPOLIA),
    fromBlock: BigInt(process.env.NEXT_PUBLIC_FROM_BLOCK_CELO_SEPOLIA ?? "0"),
    // RPC_* (server only, may contain a provider API key) → NEXT_PUBLIC_RPC_* → public endpoint.
    rpcUrl: process.env.RPC_CELO_SEPOLIA || process.env.NEXT_PUBLIC_RPC_CELO_SEPOLIA || "https://forno.celo-sepolia.celo-testnet.org",
    explorer: "https://celo-sepolia.blockscout.com",
    testnet: true,
    tokens: [
      // Mento's KESm has no usable liquidity on Celo Sepolia, so demos use a labelled test shilling when one is deployed.
      addr(process.env.NEXT_PUBLIC_TEST_KES_CELO_SEPOLIA)
        ? { address: addr(process.env.NEXT_PUBLIC_TEST_KES_CELO_SEPOLIA)!, symbol: "tKES", currency: "KES", decimals: 18, label: "Kenyan shilling (test)", mintable: true }
        : { address: "0xC7e4635651E3e3Af82b61d3E23c159438daE3BbF", symbol: "KESm", currency: "KES", decimals: 18, label: "Kenyan shilling (KESm)" },
      // USDm is allowed by the contracts but not offered here: it cannot be obtained on Celo Sepolia.
      { address: "0x01C5C0122039549AD1493B8220cABEdD739BC44E", symbol: "USDC", currency: "USD", decimals: 6, label: "US dollar (USDC)" },
    ],
  },
  {
    chain: baseSepolia,
    name: "Base Sepolia",
    short: "Base",
    factory: addr(process.env.NEXT_PUBLIC_FACTORY_BASE_SEPOLIA),
    fromBlock: BigInt(process.env.NEXT_PUBLIC_FROM_BLOCK_BASE_SEPOLIA ?? "0"),
    rpcUrl: process.env.RPC_BASE_SEPOLIA || process.env.NEXT_PUBLIC_RPC_BASE_SEPOLIA || "https://sepolia.base.org",
    explorer: "https://sepolia.basescan.org",
    testnet: true,
    tokens: [
      { address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", symbol: "USDC", currency: "USD", decimals: 6, label: "US dollar (USDC)" },
    ],
  },
];

// Optional local chain (anvil) for development: `pnpm --filter @fadhili/contracts node`, then `deploy:local`.
const localFactory = addr(process.env.NEXT_PUBLIC_FACTORY_LOCAL);
if (localFactory) {
  CHAINS.push({
    chain: anvil,
    name: "Local",
    short: "Local",
    factory: localFactory,
    fromBlock: 0n,
    rpcUrl: process.env.NEXT_PUBLIC_RPC_LOCAL ?? "http://127.0.0.1:8545",
    explorer: "",
    testnet: true,
    tokens: [
      { address: addr(process.env.NEXT_PUBLIC_LOCAL_KESM) ?? "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", symbol: "KESm", currency: "KES", decimals: 18, label: "Kenyan shilling (mock)", mintable: true },
      { address: addr(process.env.NEXT_PUBLIC_LOCAL_USDC) ?? "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", symbol: "USDC", currency: "USD", decimals: 6, label: "US dollar (mock)", mintable: true },
    ],
  });
}

export const DEFAULT_CHAIN_ID = celoSepolia.id;

export function chainInfo(chainId: number): ChainInfo | undefined {
  return CHAINS.find((c) => c.chain.id === chainId);
}

export function tokenInfo(chainId: number, token: string): TokenInfo | undefined {
  return chainInfo(chainId)?.tokens.find((t) => t.address.toLowerCase() === token.toLowerCase());
}

export function liveChains(): ChainInfo[] {
  return CHAINS.filter((c) => c.factory);
}

export function txUrl(chainId: number, hash: string) {
  const c = chainInfo(chainId);
  return c?.explorer ? `${c.explorer}/tx/${hash}` : undefined;
}

export function addressUrl(chainId: number, address: string) {
  const c = chainInfo(chainId);
  return c?.explorer ? `${c.explorer}/address/${address}` : undefined;
}
