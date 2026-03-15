import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_HEADERS = {
  Accept: "application/json",
  "Content-Type": "application/json",
} as const;

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { ...SUPABASE_HEADERS },
      },
    }
  );
}
