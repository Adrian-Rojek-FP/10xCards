import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../../db/supabase.client';
import { AuthApiError } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request, cookies }) => {
  const { email, password } = await request.json();

  if (!email || !password) {
    return new Response(
      JSON.stringify({ error: 'Brak e-maila lub hasła' }),
      { status: 400 }
    );
  }

  const supabase = createSupabaseServerClient(
    { cookies, headers: request.headers },
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_KEY
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error instanceof AuthApiError && error.message === 'Invalid login credentials') {
        return new Response(
            JSON.stringify({ error: 'Nieprawidłowy adres e-mail lub hasło.' }),
            { status: 401 }
        );
    }
    // Generic error for other cases
    return new Response(
      JSON.stringify({ error: 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.' }),
      { status: 500 }
    );
  }

  return new Response(JSON.stringify({ user: data.user }), { status: 200 });
};
