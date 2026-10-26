"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider, usePrivy, useWallets, useIdentityToken } from "@privy-io/react-auth";
import { WagmiProvider as PrivyWagmiProvider, useSetActiveWallet } from "@privy-io/wagmi";
import { useConnection } from "wagmi";
import { setExpectedAccount } from "@/lib/tx";
import { WagmiProvider } from "wagmi";
import { getAddress, type Address } from "viem";
import { Toaster, toast } from "sonner";
import { celoSepolia } from "viem/chains";
import { CHAINS } from "@/lib/chains";
import { privyWagmiConfig, plainWagmiConfig } from "@/lib/wagmi";
import { SITE } from "@/lib/site";

export type Session = {
  enabled: boolean;
  ready: boolean;
  authenticated: boolean;
  address?: Address;
  label?: string;
  idToken: string | null;
  login: () => void;
  logout: () => Promise<void>;
};

const SessionContext = createContext<Session | null>(null);

export function useSession() {
  const s = useContext(SessionContext);
  if (!s) throw new Error("useSession must be used inside <Providers>");
  return s;
}

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

function PrivySession({ children }: { children: ReactNode }) {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const { identityToken } = useIdentityToken();
  const wallet = wallets.find((w) => w.walletClientType === "privy") ?? wallets[0];
  const { setActiveWallet } = useSetActiveWallet();
  const { address: activeAddress } = useConnection();

  // Sign with the FadhiliChain account, not with a browser extension wallet that may also be connected.
  useEffect(() => {
    if (!authenticated || !wallet) {
      setExpectedAccount(null);
      return;
    }
    setExpectedAccount({ address: getAddress(wallet.address), activate: () => setActiveWallet(wallet) });
    if (activeAddress?.toLowerCase() !== wallet.address.toLowerCase()) void setActiveWallet(wallet);
  }, [authenticated, wallet, activeAddress, setActiveWallet]);
  const session = useMemo<Session>(
    () => ({
      enabled: true,
      ready,
      authenticated,
      address: wallet ? getAddress(wallet.address) : undefined,
      label: user?.email?.address ?? user?.google?.email ?? user?.phone?.number ?? undefined,
      idToken: identityToken,
      login: () => login(),
      logout,
    }),
    [ready, authenticated, wallet, user, identityToken, login, logout],
  );
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

const disabledSession: Session = {
  enabled: false,
  ready: true,
  authenticated: false,
  idToken: null,
  login: () => toast("Sign-in is being set up", { description: "Add NEXT_PUBLIC_PRIVY_APP_ID to enable email and Google sign-in." }),
  logout: async () => {},
};

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 15_000 } } }));

  const toaster = <Toaster position="bottom-center" toastOptions={{ style: { borderRadius: 16, fontFamily: "var(--font-geist-sans)" } }} />;

  if (!appId) {
    return (
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={plainWagmiConfig}>
          <SessionContext.Provider value={disabledSession}>
            {children}
            {toaster}
          </SessionContext.Provider>
        </WagmiProvider>
      </QueryClientProvider>
    );
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["email", "google", "sms", "wallet"],
        appearance: {
          theme: "light",
          accentColor: "#3f5a2a",
          landingHeader: "Sign in to FadhiliChain",
          loginMessage: "Use your email, Google or phone. No wallet app needed.",
          walletChainType: "ethereum-only",
        },
        embeddedWallets: {
          ethereum: { createOnLogin: "users-without-wallets" },
          showWalletUIs: false,
        },
        defaultChain: celoSepolia,
        supportedChains: CHAINS.map((c) => c.chain),
        legal: { termsAndConditionsUrl: `${SITE.url}/legal/terms`, privacyPolicyUrl: `${SITE.url}/legal/privacy` },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <PrivyWagmiProvider config={privyWagmiConfig}>
          <PrivySession>
            {children}
            {toaster}
          </PrivySession>
        </PrivyWagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
