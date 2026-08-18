import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

function getCookie(name: string) {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : undefined;
}

function setCookie(name: string, value: string, options: { maxAge?: number; path?: string } = {}) {
  if (typeof document === "undefined") return;
  const maxAge = options.maxAge ?? 60 * 60 * 24 * 7;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=${options.path ?? "/"}; max-age=${maxAge}; SameSite=Lax`;
}

function removeCookie(name: string, options: { path?: string } = {}) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=${options.path ?? "/"}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function createClient() {
  if (client) return client;
  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return getCookie(name);
        },
        set(name: string, value: string, options: { maxAge?: number; path?: string }) {
          setCookie(name, value, options);
        },
        remove(name: string, options: { path?: string }) {
          removeCookie(name, options);
        },
      },
    }
  );
  return client;
}
