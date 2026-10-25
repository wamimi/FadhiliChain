import "server-only";

/** Server-side configuration. Every integration is optional so the site still renders in preview mode. */
export const serverEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  privyAppId: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
  privyAppSecret: process.env.PRIVY_APP_SECRET,
  gasTankKey: process.env.GAS_TANK_PRIVATE_KEY as `0x${string}` | undefined,
  cronSecret: process.env.CRON_SECRET,
};

export const hasDatabase = Boolean(serverEnv.supabaseUrl && serverEnv.supabaseServiceKey);
