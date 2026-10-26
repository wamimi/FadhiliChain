import { z } from "zod";
import { createWalletClient, erc20Abi, http, parseAbi, parseEther, parseUnits, getAddress, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { requireUser, errorResponse, AuthError } from "@/lib/auth";
import { serverEnv, hasDatabase } from "@/lib/env";
import { chainInfo, type TokenInfo } from "@/lib/chains";
import { publicClient } from "@/lib/rpc";
import { db } from "@/lib/supabase";

/**
 * Gas tank. Network fees are paid in the network's own coin (CELO or ETH), which new users don't have.
 * This route sends a signed-in user a small amount, at most once a day, so they never have to buy it.
 * On test networks it can also send starter test money (STARTER_KES / STARTER_USDC) so people can try donating.
 */
const Body = z.object({ chainId: z.number().int(), address: z.string() });

const MINT_ABI = parseAbi(["function mint(address to, uint256 amount)"]);

const recent = new Map<string, number>(); // fallback rate limit when no database

/** Network coin used for fees. viem names Celo Sepolia's coin "S-CELO", so match on the name, not the exact symbol. */
const native = (chainId: number) => (chainInfo(chainId)?.chain.nativeCurrency.name === "CELO" ? "CELO" : "ETH");
/** Top-ups allowed per account per network per day. Each one only happens when the balance is actually low. */
const MAX_GRANTS_PER_DAY = 5;
const topUp = (chainId: number) =>
  parseEther(native(chainId) === "CELO" ? (process.env.GAS_TOPUP_CELO ?? "0.05") : (process.env.GAS_TOPUP_ETH ?? "0.0003"));

export async function POST(req: Request) {
  try {
    if (!serverEnv.gasTankKey) return Response.json({ sent: [], note: "Gas tank not configured" });
    const user = await requireUser(req);
    const body = Body.safeParse(await req.json());
    const info = body.success ? chainInfo(body.data.chainId) : undefined;
    if (!body.success || !info) return Response.json({ error: "Invalid request" }, { status: 400 });
    const address = getAddress(body.data.address) as Address;
    if (!user.wallets.includes(address)) throw new AuthError("That wallet is not on your account.", 403);

    const chainId = info.chain.id;
    const key = `${chainId}:${address}`;
    const dayAgo = Date.now() - 86_400_000;
    if (hasDatabase) {
      const { count } = await db()
        .from("gas_grants")
        .select("id", { count: "exact", head: true })
        .eq("chain_id", chainId)
        .eq("address", address.toLowerCase())
        .gte("created_at", new Date(dayAgo).toISOString());
      if ((count ?? 0) >= MAX_GRANTS_PER_DAY) return Response.json({ sent: [], note: "Daily top-up limit reached" });
    } else if ((recent.get(key) ?? 0) > dayAgo) {
      return Response.json({ sent: [], note: "Already topped up today" });
    }

    const client = publicClient(chainId);
    const account = privateKeyToAccount(serverEnv.gasTankKey);
    const wallet = createWalletClient({ account, chain: info.chain, transport: http(info.rpcUrl) });
    const sent: { asset: string; amount: string; hash: string }[] = [];

    const amount = topUp(chainId);
    const balance = await client.getBalance({ address });
    if (balance < amount / 2n) {
      const hash = await wallet.sendTransaction({ to: address, value: amount - balance });
      await client.waitForTransactionReceipt({ hash });
      sent.push({ asset: native(chainId), amount: (amount - balance).toString(), hash });
    }

    // Starter test money, test networks only.
    if (info.testnet) {
      const starters = [
        { name: "KES", match: (t: TokenInfo) => t.currency === "KES", env: process.env.STARTER_KES ?? process.env.STARTER_KESM },
        { name: "USDC", match: (t: TokenInfo) => t.symbol === "USDC", env: process.env.STARTER_USDC },
      ];
      for (const s of starters) {
        const token = info.tokens.find(s.match);
        if (!token || !s.env || Number(s.env) <= 0) continue;
        const want = parseUnits(s.env, token.decimals);
        const has = await client.readContract({ address: token.address, abi: erc20Abi, functionName: "balanceOf", args: [address] });
        if (has >= want / 10n) continue;
        let hash: `0x${string}`;
        if (token.mintable) {
          // Labelled test token with an open mint: create the starter funds directly.
          hash = await wallet.writeContract({ address: token.address, abi: MINT_ABI, functionName: "mint", args: [address, want] });
        } else {
          const tank = await client.readContract({ address: token.address, abi: erc20Abi, functionName: "balanceOf", args: [account.address] });
          if (tank < want) continue;
          hash = await wallet.writeContract({ address: token.address, abi: erc20Abi, functionName: "transfer", args: [address, want] });
        }
        await client.waitForTransactionReceipt({ hash });
        sent.push({ asset: token.symbol, amount: want.toString(), hash });
      }
    }

    if (sent.length) {
      if (hasDatabase) await db().from("gas_grants").insert({ chain_id: chainId, address: address.toLowerCase(), tx_hash: sent[0].hash });
      else recent.set(key, Date.now());
    }
    return Response.json({ sent });
  } catch (e) {
    return errorResponse(e);
  }
}
