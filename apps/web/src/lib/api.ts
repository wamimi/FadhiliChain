"use client";
import { useCallback } from "react";
import { useSession } from "@/components/providers";

/** fetch() that sends the Privy identity token so API routes know who is calling. */
export function useApi() {
  const { idToken } = useSession();
  return useCallback(
    async <T,>(url: string, init: RequestInit & { json?: unknown } = {}): Promise<T> => {
      const headers = new Headers(init.headers);
      if (idToken) headers.set("x-privy-id-token", idToken);
      let body = init.body;
      if (init.json !== undefined) {
        headers.set("content-type", "application/json");
        body = JSON.stringify(init.json);
      }
      const res = await fetch(url, { ...init, headers, body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Something went wrong");
      return data as T;
    },
    [idToken],
  );
}
