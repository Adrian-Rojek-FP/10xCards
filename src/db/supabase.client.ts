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
  // Don't cache - always create fresh client to pick up new cookies
  // This is especially important after PKCE redirect when cookies are just set

  // IMPORTANT: Configure browser client to use cookies (same as server)
  // Without this, browser client uses localStorage which doesn't have the session!
  supabaseBrowserClient = createBrowserClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_KEY,
    {
      cookies: {
        get(name) {
          // Read from document.cookie (only non-httpOnly cookies visible)
          const cookies = document.cookie.split("; ");
          const cookie = cookies.find((c) => c.startsWith(`${name}=`));
          return cookie?.split("=")[1];
        },
        set(name, value, options) {
          // Set cookie in browser
          let cookie = `${name}=${value}`;
          if (options?.maxAge) cookie += `; max-age=${options.maxAge}`;
          if (options?.path) cookie += `; path=${options.path}`;
          if (options?.domain) cookie += `; domain=${options.domain}`;
          if (options?.sameSite) cookie += `; samesite=${options.sameSite}`;
          if (options?.secure) cookie += "; secure";
          document.cookie = cookie;
        },
        remove(name, options) {
          // Remove cookie by setting expired date
          let cookie = `${name}=; max-age=0`;
          if (options?.path) cookie += `; path=${options.path}`;
          if (options?.domain) cookie += `; domain=${options.domain}`;
          document.cookie = cookie;
        },
      },
    }
  );

  return supabaseBrowserClient;
}

// --- SHARED TYPES ---

export type SupabaseClient = SupabaseClientType<Database>;

// This is likely a remnant of old code and should be removed if not used.
// For now, it's kept to avoid breaking changes.
export const DEFAULT_USER_ID = "872e74cc-521b-4ddf-955b-bad07835a877";
