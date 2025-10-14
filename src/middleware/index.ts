import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerClient } from '../db/supabase.client';

const PROTECTED_PATHS = ['/generate'];
const PUBLIC_ONLY_PATHS = ['/login', '/register', '/password-reset'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, request, redirect } = context;

  // Create a Supabase client for the server
  const supabase = createSupabaseServerClient(
    {
      headers: request.headers,
      cookies,
    },
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_KEY
  );
  context.locals.supabase = supabase;

  // Securely get user and session data
  const { data: { user } } = await supabase.auth.getUser();
  const { data: { session } } = await supabase.auth.getSession();

  context.locals.user = user;
  context.locals.session = session;

  // Protect routes based on the authenticated user
  if (PROTECTED_PATHS.some(path => url.pathname.startsWith(path)) && !user) {
    return redirect('/login');
  }

  // Redirect logged-in users from public-only pages
  if (PUBLIC_ONLY_PATHS.includes(url.pathname) && user) {
    return redirect('/generate');
  }

  return next();
});
