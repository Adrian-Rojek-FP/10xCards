import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../../db/supabase.client";
import { AuthApiError } from "@supabase/supabase-js";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const { email, password } = await request.json();

  if (!email || !password) {
    return new Response(JSON.stringify({ error: "Brak e-maila lub hasła" }), { status: 400 });
  }

  if (password.length < 6) {
    return new Response(JSON.stringify({ error: "Hasło musi mieć co najmniej 6 znaków" }), { status: 400 });
  }

  // Access runtime environment variables from Cloudflare
  const runtime = locals.runtime as { env?: { SUPABASE_URL?: string; SUPABASE_KEY?: string } } | undefined;
  const supabaseUrl = runtime?.env?.SUPABASE_URL || import.meta.env.SUPABASE_URL;
  const supabaseKey = runtime?.env?.SUPABASE_KEY || import.meta.env.SUPABASE_KEY;

  const supabase = createSupabaseServerClient({ cookies, headers: request.headers }, supabaseUrl, supabaseKey);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    if (error instanceof AuthApiError) {
      // Handle specific Supabase errors
      if (error.message.includes("already registered")) {
        return new Response(JSON.stringify({ error: "Ten adres e-mail jest już zarejestrowany." }), { status: 409 });
      }
      if (error.message.includes("Password should be")) {
        return new Response(JSON.stringify({ error: "Hasło nie spełnia wymagań bezpieczeństwa." }), { status: 400 });
      }
    }
    // Generic error for other cases
    return new Response(JSON.stringify({ error: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później." }), {
      status: 500,
    });
  }

  // Check if email confirmation is required
  const needsEmailConfirmation = data.user && !data.user.confirmed_at;

  return new Response(
    JSON.stringify({
      user: data.user,
      needsEmailConfirmation,
      message: needsEmailConfirmation
        ? "Rejestracja przebiegła pomyślnie! Sprawdź swoją skrzynkę e-mail i kliknij link potwierdzający, aby aktywować konto."
        : "Rejestracja przebiegła pomyślnie!",
    }),
    { status: 200 }
  );
};
