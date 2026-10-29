"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/admin";

const MAX = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

async function admin() {
  const v = await getViewer();
  if (!v) redirect("/login");
  if (!v.isSuperadmin) redirect("/denied");
  return { v, supabase: await createClient() };
}
function fail(msg: string): never { redirect(`/images?error=${encodeURIComponent(msg.slice(0, 160))}`); }
const done = () => { revalidatePath("/images"); revalidatePath("/users"); redirect("/images?saved=1"); };

function checkFile(file: unknown): File {
  if (!(file instanceof File) || file.size === 0) fail("Choose an image first.");
  if (file.size > MAX) fail("Images are capped at 5 MB.");
  if (!TYPES.includes(file.type)) fail("JPEG, PNG, WebP, GIF or AVIF only.");
  return file;
}

/** CREATE: upload into the images bucket and record it. */
export async function uploadImage(fd: FormData) {
  const { v, supabase } = await admin();
  const file = checkFile(fd.get("file"));
  const alt = String(fd.get("alt") ?? "").trim().slice(0, 300) || null;
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "img";
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("images").upload(path, file, { contentType: file.type, upsert: false });
  if (error) fail(error.message);
  const { data: pub } = supabase.storage.from("images").getPublicUrl(path);
  const { error: e2 } = await supabase.from("images").insert({ bucket: "images", path, url: pub.publicUrl, alt, size_bytes: file.size, content_type: file.type, uploaded_by: v.id === "preview" ? null : v.id });
  if (e2) { await supabase.storage.from("images").remove([path]); fail(e2.message); }
  done();
}

/** UPDATE: replace the file behind an existing image (same path, so every URL still works), and/or its alt text. */
export async function replaceImage(fd: FormData) {
  const { supabase } = await admin();
  const id = Number(fd.get("id"));
  const { data: row } = await supabase.from("images").select("id, bucket, path").eq("id", id).maybeSingle();
  if (!row) fail("That image is gone.");
  const alt = String(fd.get("alt") ?? "").trim().slice(0, 300) || null;
  const patch: Record<string, unknown> = { alt };
  const f = fd.get("file");
  if (f instanceof File && f.size > 0) {
    const file = checkFile(f);
    const { error } = await supabase.storage.from(row.bucket).update(row.path, file, { contentType: file.type, upsert: true });
    if (error) fail(error.message);
    patch.size_bytes = file.size; patch.content_type = file.type;
  }
  const { error: e2 } = await supabase.from("images").update(patch).eq("id", id);
  if (e2) fail(e2.message);
  done();
}

/** DELETE: the object and its record. */
export async function deleteImage(fd: FormData) {
  const { supabase } = await admin();
  const id = Number(fd.get("id"));
  const { data: row } = await supabase.from("images").select("id, bucket, path").eq("id", id).maybeSingle();
  if (!row) fail("That image is gone.");
  const { error } = await supabase.storage.from(row.bucket).remove([row.path]);
  if (error) fail(error.message);
  const { error: e2 } = await supabase.from("images").delete().eq("id", id);
  if (e2) fail(e2.message);
  done();
}

/** DELETE a member's avatar: the file in the avatars bucket, then the URL on their profile. */
export async function removeAvatar(fd: FormData) {
  const { supabase } = await admin();
  const userId = String(fd.get("user_id") ?? "");
  const { data: p } = await supabase.from("profiles").select("avatar_url").eq("id", userId).maybeSingle();
  if (!p?.avatar_url) fail("No avatar to remove.");
  const m = p.avatar_url.match(/\/storage\/v1\/object\/public\/avatars\/([^?]+)/);
  if (m) {
    const { error } = await supabase.storage.from("avatars").remove([decodeURIComponent(m[1])]);
    if (error) fail(error.message);
  }
  const { error: e2 } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", userId);
  if (e2) fail(e2.message);
  done();
}
