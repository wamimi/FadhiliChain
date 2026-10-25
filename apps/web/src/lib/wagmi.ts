"use client";
import { http, type Transport } from "viem";
import type { Chain } from "viem";
import { createConfig as createPrivyConfig } from "@privy-io/wagmi";
import { createConfig } from "wagmi";
import { CHAINS } from "./chains";

const chains = CHAINS.map((c) => c.chain) as unknown as readonly [Chain, ...Chain[]];
const transports = Object.fromEntries(CHAINS.map((c) => [c.chain.id, http(c.rpcUrl)])) as Record<number, Transport>;

export const privyWagmiConfig = createPrivyConfig({ chains, transports, ssr: true });
export const plainWagmiConfig = createConfig({ chains, transports, ssr: true });
