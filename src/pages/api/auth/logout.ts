import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "@/db/supabase.client";

export const prerender = false;

export const POST: APIRoute = async ({ cookies, request, redirect }) => {
  // Create Supabase server client
  const supabase = createSupabaseServerClient(
    {
      headers: request.headers,
      cookies,
    },
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_KEY
  );

  // Sign out from Supabase - this will clear all auth cookies
  await supabase.auth.signOut();

  return redirect("/login");
};
