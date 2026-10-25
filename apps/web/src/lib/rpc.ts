import { createPublicClient, http, type PublicClient } from "viem";
import { chainInfo } from "./chains";

const clients = new Map<number, PublicClient>();

export function publicClient(chainId: number): PublicClient {
  const info = chainInfo(chainId);
  if (!info) throw new Error(`Unsupported chain ${chainId}`);
  let c = clients.get(chainId);
  if (!c) {
    c = createPublicClient({ chain: info.chain, transport: http(info.rpcUrl, { timeout: 8_000 }) }) as PublicClient;
    clients.set(chainId, c);
  }
  return c;
}
