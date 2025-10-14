import type { AstroCookies } from "astro";
import { createBrowserClient, createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { Database } from "./database.types";

// --- SERVER-SIDE CLIENT ---

export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: import.meta.env.PROD, // Set to true in production
  httpOnly: true,
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 365, // 1 year
};

// This function is needed to parse the cookie header because Astro's context.cookies.getAll()
// is not available in the middleware for requests.
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  if (!cookieHeader) return [];
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

export const createSupabaseServerClient = (
  context: { headers: Headers; cookies: AstroCookies },
  supabaseUrl: string,
  supabaseKey: string
) => {
  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });
};

// --- BROWSER-SIDE CLIENT ---

import { type SupabaseClient as SupabaseClientType } from "@supabase/supabase-js";

let supabaseBrowserClient: SupabaseClientType<Database> | null = null;

export function getSupabaseBrowserClient() {
  if (supabaseBrowserClient) {
    return supabaseBrowserClient;
  }

  supabaseBrowserClient = createBrowserClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_KEY
  );

  return supabaseBrowserClient;
}

// --- SHARED TYPES ---

export type SupabaseClient = typeof supabaseBrowserClient;

// This is likely a remnant of old code and should be removed if not used.
// For now, it's kept to avoid breaking changes.
export const DEFAULT_USER_ID = "872e74cc-521b-4ddf-955b-bad07835a877";
