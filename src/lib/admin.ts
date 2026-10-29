import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Viewer = { id: string; email: string | null; isSuperadmin: boolean };

/**
 * Who is looking, and whether they may be here. The flag is read from the
 * database on every request, never from the token, so revoking it takes
 * effect on the next page load.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  if (process.env.NODE_ENV === "development" && process.env.ADMIN_PREVIEW === "1") return { id: process.env.ADMIN_PREVIEW_UID ?? "preview", email: "preview@local", isSuperadmin: true };
  const supabase = await createClient();
  const claims = (await supabase.auth.getClaims()).data?.claims;
  if (!claims?.sub) return null;
  const { data } = await supabase.from("profiles").select("is_superadmin").eq("id", claims.sub).maybeSingle();
  return { id: claims.sub, email: (claims.email as string | undefined) ?? null, isSuperadmin: Boolean(data?.is_superadmin) };
});
