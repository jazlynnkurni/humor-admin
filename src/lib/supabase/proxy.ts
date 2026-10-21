import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Every route in the admin area is behind the login wall. Anyone without a
 * session goes to /login; anyone with a session but without the superadmin
 * flag goes to /denied. Only /login, /denied and the auth routes are open.
 */
const OPEN = ["/login", "/denied", "/auth/"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  /* local preview only: never engages in a production build */
  if (process.env.NODE_ENV === "development" && process.env.ADMIN_PREVIEW === "1") return response;

  const path = request.nextUrl.pathname;
  const open = OPEN.some((p) => path.startsWith(p));
  const { data } = await supabase.auth.getClaims();
  const uid = data?.claims?.sub;

  if (!uid) {
    if (open) return response;
    const url = request.nextUrl.clone(); url.pathname = "/login"; url.search = "";
    return NextResponse.redirect(url);
  }
  if (open) return response;

  const { data: prof } = await supabase.from("profiles").select("is_superadmin").eq("id", uid).maybeSingle();
  if (!prof?.is_superadmin) {
    const url = request.nextUrl.clone(); url.pathname = "/denied"; url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}
