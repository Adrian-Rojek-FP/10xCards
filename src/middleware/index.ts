import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerClient } from "../db/supabase.client";

const PROTECTED_PATHS = ["/generate"];
const PUBLIC_ONLY_PATHS = ["/login", "/register", "/password-reset"];

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, request, redirect, locals } = context;

  // Access runtime environment variables from Cloudflare
  const runtime = locals.runtime as { env?: { SUPABASE_URL?: string; SUPABASE_KEY?: string } } | undefined;
  const supabaseUrl = runtime?.env?.SUPABASE_URL || import.meta.env.SUPABASE_URL;
  const supabaseKey = runtime?.env?.SUPABASE_KEY || import.meta.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SUPABASE_URL and SUPABASE_KEY must be defined");
  }

  // Create a Supabase client for the server
  const supabase = createSupabaseServerClient(
    {
      headers: request.headers,
      cookies,
    },
    supabaseUrl,
    supabaseKey
  );
  context.locals.supabase = supabase;

  // Securely get user and session data
  const {
    data: { user },
  } = await supabase.auth.getUser();
  context.locals.user = user;

  // Protect routes based on the authenticated user
  if (PROTECTED_PATHS.some((path) => url.pathname.startsWith(path)) && !user) {
    return redirect("/login");
  }

  // Redirect logged-in users from public-only pages
  if (PUBLIC_ONLY_PATHS.includes(url.pathname) && user) {
    return redirect("/generate");
  }

  return next();
});
