"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/admin";
import { generatePunchlines } from "@/lib/ai";
import { todayNY } from "@/lib/daily";

/* every action re-checks the flag; the proxy is the first wall, this is the second */
async function admin() {
  const v = await getViewer();
  if (!v) redirect("/login");
  if (!v.isSuperadmin) redirect("/denied");
  return { v, supabase: await createClient() };
}
const bust = () => { revalidatePath("/"); revalidatePath("/media"); revalidatePath("/votes"); revalidatePath("/requests"); };
function fail(where: string, msg: string): never {
  redirect(`${where}?error=${encodeURIComponent(msg.slice(0, 160))}`);
}

/** CREATE a generation by hand: a setup and one to three punchlines, no model involved. */
export async function createManual(fd: FormData) {
  const { v, supabase } = await admin();
  const setup = String(fd.get("setup") ?? "").trim().slice(0, 140);
  const lines = [1, 2, 3].map((i) => String(fd.get(`p${i}`) ?? "").trim().slice(0, 240)).filter(Boolean);
  if (!setup || lines.length === 0) fail("/media/new", "A setup and at least one punchline are required.");
  const { data: gen, error } = await supabase.from("generations").insert({ user_id: v.id, setup, prompt: "(written by an admin, no model)", model: "admin/manual", day: todayNY() }).select("id").single();
  if (error) fail("/media/new", error.message);
  const { error: e2 } = await supabase.from("candidates").insert(lines.map((p) => ({ generation_id: gen.id, punchline: p })));
  if (e2) fail("/media/new", e2.message);
  bust(); redirect(`/media/${gen.id}`);
}

/** CREATE a generation with the model, on any setup. */
export async function createGenerated(fd: FormData) {
  const { v, supabase } = await admin();
  const setup = String(fd.get("setup") ?? "").trim().slice(0, 140);
  if (!setup) fail("/media/new", "A setup is required.");
  let result: Awaited<ReturnType<typeof generatePunchlines>>;
  try { result = await generatePunchlines(setup); } catch (e) { fail("/media/new", e instanceof Error ? e.message : "Generation failed."); }
  const { data: gen, error } = await supabase.from("generations").insert({ user_id: v.id, setup, prompt: result.prompt, model: result.model, day: todayNY(), chain_id: result.chainId }).select("id").single();
  if (error) fail("/media/new", error.message);
  await supabase.from("llm_responses").insert(result.responses.map((r) => ({ ...r, generation_id: gen.id })));
  const { error: e2 } = await supabase.from("candidates").insert(result.punchlines.map((p) => ({ generation_id: gen.id, punchline: p })));
  if (e2) fail("/media/new", e2.message);
  bust(); redirect(`/media/${gen.id}`);
}

/** UPDATE a generation's setup. */
export async function updateGeneration(fd: FormData) {
  const { supabase } = await admin();
  const id = Number(fd.get("id")); const setup = String(fd.get("setup") ?? "").trim().slice(0, 140);
  if (!id || !setup) fail(`/media/${id}`, "A setup is required.");
  const { error } = await supabase.from("generations").update({ setup }).eq("id", id);
  if (error) fail(`/media/${id}`, error.message);
  bust(); redirect(`/media/${id}?saved=1`);
}

/** UPDATE one punchline. */
export async function updateCandidate(fd: FormData) {
  const { supabase } = await admin();
  const id = Number(fd.get("id")), gen = Number(fd.get("generation_id")); const punchline = String(fd.get("punchline") ?? "").trim().slice(0, 240);
  if (!id || !punchline) fail(`/media/${gen}`, "A punchline cannot be empty.");
  const { error } = await supabase.from("candidates").update({ punchline }).eq("id", id);
  if (error) fail(`/media/${gen}`, error.message);
  bust(); redirect(`/media/${gen}?saved=1`);
}

/** CREATE one more punchline under an existing generation. */
export async function addCandidate(fd: FormData) {
  const { supabase } = await admin();
  const gen = Number(fd.get("generation_id")); const punchline = String(fd.get("punchline") ?? "").trim().slice(0, 240);
  if (!gen || !punchline) fail(`/media/${gen}`, "A punchline cannot be empty.");
  const { error } = await supabase.from("candidates").insert({ generation_id: gen, punchline });
  if (error) fail(`/media/${gen}`, error.message);
  bust(); redirect(`/media/${gen}?saved=1`);
}

/** DELETE one punchline (its votes cascade). */
export async function deleteCandidate(fd: FormData) {
  const { supabase } = await admin();
  const id = Number(fd.get("id")), gen = Number(fd.get("generation_id"));
  const { error } = await supabase.from("candidates").delete().eq("id", id);
  if (error) fail(`/media/${gen}`, error.message);
  bust(); redirect(`/media/${gen}?saved=1`);
}

/** DELETE a whole generation (candidates and their votes cascade). */
export async function deleteGeneration(fd: FormData) {
  const { supabase } = await admin();
  const id = Number(fd.get("id"));
  const { error } = await supabase.from("generations").delete().eq("id", id);
  if (error) fail(`/media/${id}`, error.message);
  bust(); redirect("/media?deleted=1");
}
