"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/admin";

/**
 * One save and one delete for every simple table in the admin area. The table
 * and its columns come from this allowlist, never from the form, so a request
 * can only touch what is named here, and RLS still has the last word.
 */
type Kind = "text" | "int" | "num" | "bool";
const TABLES: Record<string, { cols: Record<string, Kind>; required: string[]; back: string }> = {
  terms: { cols: { term: "text", kind: "text", note: "text", enabled: "bool" }, required: ["term"], back: "/prompts" },
  generation_examples: { cols: { setup: "text", punchline: "text", note: "text", enabled: "bool" }, required: ["setup", "punchline"], back: "/prompts" },
  prompt_chains: { cols: { name: "text", description: "text", enabled: "bool" }, required: ["name"], back: "/prompts" },
  llm_providers: { cols: { slug: "text", name: "text", env_key: "text", base_url: "text", enabled: "bool", notes: "text" }, required: ["slug", "name"], back: "/models" },
  llm_models: { cols: { provider_id: "int", model_id: "text", label: "text", priority: "int", timeout_ms: "int", max_output_tokens: "int", temperature: "num", enabled: "bool", notes: "text" }, required: ["provider_id", "model_id"], back: "/models" },
  allowed_signup_domains: { cols: { domain: "text", note: "text", enabled: "bool" }, required: ["domain"], back: "/signup" },
  whitelisted_emails: { cols: { email: "text", note: "text", enabled: "bool" }, required: ["email"], back: "/signup" },
  images: { cols: { alt: "text" }, required: [], back: "/images" },
};

async function admin() {
  const v = await getViewer();
  if (!v) redirect("/login");
  if (!v.isSuperadmin) redirect("/denied");
  return { v, supabase: await createClient() };
}
function fail(back: string, msg: string): never { redirect(`${back}?error=${encodeURIComponent(msg.slice(0, 160))}`); }
const bust = (back: string) => { revalidatePath(back); revalidatePath("/"); };

function read(fd: FormData, cols: Record<string, Kind>) {
  const row: Record<string, unknown> = {};
  for (const [name, kind] of Object.entries(cols)) {
    const raw = fd.get(name);
    if (kind === "bool") { row[name] = raw === "on" || raw === "true"; continue; }
    if (raw === null) continue; /* field not on this form: leave the column alone */
    const s = String(raw).trim();
    if (kind === "text") row[name] = s === "" ? null : s.slice(0, 4000);
    else if (kind === "int") row[name] = s === "" ? null : Math.trunc(Number(s));
    else row[name] = s === "" ? null : Number(s);
    if ((kind === "int" || kind === "num") && row[name] !== null && Number.isNaN(row[name])) fail("/", `${name} must be a number.`);
  }
  return row;
}

/** CREATE when the form carries no id, UPDATE when it does. */
export async function saveRow(table: string, fd: FormData) {
  const spec = TABLES[table];
  if (!spec) fail("/", "Unknown table.");
  const { supabase } = await admin();
  const id = Number(fd.get("id")) || null;
  const row = read(fd, spec.cols);
  for (const r of spec.required) if (row[r] === null || row[r] === undefined) fail(spec.back, `${r.replace(/_/g, " ")} is required.`);
  const { error } = id ? await supabase.from(table).update(row).eq("id", id) : await supabase.from(table).insert(row);
  if (error) fail(spec.back, error.message);
  bust(spec.back);
  redirect(`${spec.back}?saved=1`);
}

/** DELETE one row by id. */
export async function removeRow(table: string, fd: FormData) {
  const spec = TABLES[table];
  if (!spec) fail("/", "Unknown table.");
  const { supabase } = await admin();
  const id = Number(fd.get("id"));
  if (!id) fail(spec.back, "Nothing to delete.");
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) fail(spec.back, error.message);
  bust(spec.back);
  redirect(`${spec.back}?saved=1`);
}

/** UPDATE the prompt chain mix: one weight per chain, all at once. */
export async function updateMix(fd: FormData) {
  const { supabase } = await admin();
  const updates: { id: number; w: number }[] = [];
  for (const [k, v] of fd.entries()) {
    const m = k.match(/^w(\d+)$/);
    if (m) updates.push({ id: Number(m[1]), w: Math.max(0, Math.trunc(Number(v) || 0)) });
  }
  if (updates.every((u) => u.w === 0)) fail("/prompts", "At least one chain needs a weight above zero, or nothing can generate.");
  for (const u of updates) {
    const { error } = await supabase.from("prompt_chains").update({ mix_weight: u.w }).eq("id", u.id);
    if (error) fail("/prompts", error.message);
  }
  bust("/prompts");
  redirect("/prompts?saved=1");
}
