import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "@/db/supabase.client";

export const prerender = false;

export const POST: APIRoute = async ({ cookies, request, redirect, locals }) => {
  // Access runtime environment variables from Cloudflare
  const runtime = locals.runtime as { env?: { SUPABASE_URL?: string; SUPABASE_KEY?: string } } | undefined;
  const supabaseUrl = runtime?.env?.SUPABASE_URL || import.meta.env.SUPABASE_URL;
  const supabaseKey = runtime?.env?.SUPABASE_KEY || import.meta.env.SUPABASE_KEY;

  // Create Supabase server client
  const supabase = createSupabaseServerClient(
    {
      headers: request.headers,
      cookies,
    },
    supabaseUrl,
    supabaseKey
  );

  // Sign out from Supabase - this will clear all auth cookies
  await supabase.auth.signOut();

  return redirect("/login");
};
