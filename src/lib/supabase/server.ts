import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/* local preview only (next dev + ADMIN_PREVIEW=1): the service role stands in for a
   signed-in superadmin so every page and action can be exercised without Google.
   A production build never reads this branch. */
const preview = () => process.env.NODE_ENV === "development" && process.env.ADMIN_PREVIEW === "1" && process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function createClient() {
  const cookieStore = await cookies();
  const key = preview() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component; the proxy refreshes sessions instead.
        }
      },
    },
  });
}
