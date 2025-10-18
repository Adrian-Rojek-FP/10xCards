import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../../db/supabase.client";
import { AuthApiError } from "@supabase/supabase-js";
import { updatePasswordSchema } from "../../../lib/validation/auth.validation";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Nieprawidłowe dane żądania" }), { status: 400 });
  }

  // Validate input with Zod
  const validation = updatePasswordSchema.safeParse(body);
  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return new Response(JSON.stringify({ error: firstError.message }), { status: 400 });
  }

  const { password } = validation.data;

  // Access runtime environment variables from Cloudflare
  const runtime = locals.runtime as { env?: { SUPABASE_URL?: string; SUPABASE_KEY?: string } } | undefined;
  const supabaseUrl = runtime?.env?.SUPABASE_URL || import.meta.env.SUPABASE_URL;
  const supabaseKey = runtime?.env?.SUPABASE_KEY || import.meta.env.SUPABASE_KEY;

  const supabase = createSupabaseServerClient({ cookies, headers: request.headers }, supabaseUrl, supabaseKey);

  // Check if user is authenticated (should have a session from the password reset link)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response(
      JSON.stringify({ error: "Sesja wygasła lub link resetowania jest nieprawidłowy. Poproś o nowy link." }),
      { status: 401 }
    );
  }

  // Update the user's password
  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    if (error instanceof AuthApiError) {
      // Handle specific Supabase errors
      if (error.message.includes("Password should be")) {
        return new Response(JSON.stringify({ error: "Hasło nie spełnia wymagań bezpieczeństwa." }), { status: 400 });
      }
      if (error.message.includes("same as the old password")) {
        return new Response(JSON.stringify({ error: "Nowe hasło musi być inne niż poprzednie." }), { status: 400 });
      }
    }
    // Generic error for other cases
    return new Response(JSON.stringify({ error: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później." }), {
      status: 500,
    });
  }

  return new Response(
    JSON.stringify({
      message: "Hasło zostało pomyślnie zmienione.",
    }),
    { status: 200 }
  );
};

