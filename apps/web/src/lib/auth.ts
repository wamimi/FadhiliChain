import "server-only";
import { PrivyClient } from "@privy-io/node";
import { getAddress, keccak256, toHex, type Address } from "viem";
import { campaignFactoryAbi } from "@fadhili/contracts/abi";
import { serverEnv } from "./env";
import { chainInfo } from "./chains";
import { publicClient } from "./rpc";

let privy: PrivyClient | null = null;

export class AuthError extends Error {
  constructor(message: string, public status = 401) {
    super(message);
  }
}

/**
 * Verifies the Privy identity token sent by the browser (header `x-privy-id-token`)
 * and returns the user's id and the Ethereum wallets linked to their account.
 */
export async function requireUser(req: Request): Promise<{ userId: string; wallets: Address[] }> {
  const token = req.headers.get("x-privy-id-token");
  if (!token) throw new AuthError("Sign in to continue");
  if (!serverEnv.privyAppId || !serverEnv.privyAppSecret) throw new AuthError("Sign-in is not configured", 503);
  privy ??= new PrivyClient({ appId: serverEnv.privyAppId, appSecret: serverEnv.privyAppSecret });
  try {
    const user = await privy.utils().auth().verifyIdentityToken(token);
    const wallets = user.linked_accounts
      .filter((a): a is typeof a & { address: string; chain_type: "ethereum" } =>
        "address" in a && "chain_type" in a && a.chain_type === "ethereum",
      )
      .map((a) => getAddress(a.address));
    return { userId: user.id, wallets };
  } catch {
    throw new AuthError("Your session has expired. Sign in again.");
  }
}

export const APPROVER_ROLE = keccak256(toHex("APPROVER_ROLE"));
export const CANCELLER_ROLE = keccak256(toHex("CANCELLER_ROLE"));

export async function hasRole(chainId: number, role: `0x${string}`, account: Address) {
  const factory = chainInfo(chainId)?.factory;
  if (!factory) return false;
  try {
    return await publicClient(chainId).readContract({
      address: factory,
      abi: campaignFactoryAbi,
      functionName: "hasRole",
      args: [role, account],
    });
  } catch {
    return false;
  }
}

export async function requireReviewer(req: Request, chainId: number) {
  const user = await requireUser(req);
  for (const w of user.wallets) if (await hasRole(chainId, APPROVER_ROLE, w)) return { ...user, reviewer: w };
  throw new AuthError("Only reviewers can do this", 403);
}

export function errorResponse(e: unknown) {
  if (e instanceof AuthError) return Response.json({ error: e.message }, { status: e.status });
  console.error(e);
  return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}
