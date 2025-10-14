
import type { APIRoute } from "astro";


export const POST: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete("supabase-auth-token", { path: "/" });
  return redirect("/login");
}
