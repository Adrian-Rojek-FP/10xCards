import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../../db/supabase.client";
import { AuthApiError } from "@supabase/supabase-js";
import { passwordResetSchema } from "../../../lib/validation/auth.validation";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Nieprawidłowe dane żądania" }), { status: 400 });
  }

  // Validate input with Zod
  const validation = passwordResetSchema.safeParse(body);
  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return new Response(JSON.stringify({ error: firstError.message }), { status: 400 });
  }

  const { email } = validation.data;

  // Access runtime environment variables from Cloudflare
  const runtime = locals.runtime as { env?: { SUPABASE_URL?: string; SUPABASE_KEY?: string } } | undefined;
  const supabaseUrl = runtime?.env?.SUPABASE_URL || import.meta.env.SUPABASE_URL;
  const supabaseKey = runtime?.env?.SUPABASE_KEY || import.meta.env.SUPABASE_KEY;

  const supabase = createSupabaseServerClient({ cookies, headers: request.headers }, supabaseUrl, supabaseKey);

  // Get the origin for the redirect URL
  const origin = new URL(request.url).origin;
  const redirectTo = `${origin}/update-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    if (error instanceof AuthApiError) {
      // For security reasons, we don't want to reveal if an email exists or not
      // So we still return success even if there's an error
      console.error("Password reset error:", error.message);
    } else {
      // Only return error for unexpected server errors
      return new Response(JSON.stringify({ error: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później." }), {
        status: 500,
      });
    }
  }

  // Always return success message for security (don't reveal if email exists)
  return new Response(
    JSON.stringify({
      message: "Jeśli podany adres e-mail jest zarejestrowany w systemie, otrzymasz instrukcje resetowania hasła.",
    }),
    { status: 200 }
  );
};
