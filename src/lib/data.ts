import { createClient } from "@/lib/supabase/server";

export type ProfileRow = { id: string; email: string | null; first_name: string | null; last_name: string | null; avatar_url: string | null; bio: string | null; is_superadmin: boolean; created_at: string };
export type GenerationRow = { id: number; user_id: string; setup: string; prompt: string; model: string; day: string; created_at: string };
export type CandidateRow = { id: number; generation_id: number; punchline: string; created_at: string };
export type VoteRow = { candidate_id: number; user_id: string; value: number; created_at: string };
export type LaughRow = { joke_id: number; user_id: string; created_at: string };
export type JokeRow = { id: number; setup: string; punchline: string; rating: number; author_id: string | null; created_at: string };

export async function fetchAll() {
  const supabase = await createClient();
  const [profiles, generations, candidates, votes, laughs, jokes] = await Promise.all([
    supabase.from("profiles").select("id, email, first_name, last_name, avatar_url, bio, is_superadmin, created_at").order("created_at"),
    supabase.from("generations").select("id, user_id, setup, prompt, model, day, created_at").order("created_at", { ascending: false }),
    supabase.from("candidates").select("id, generation_id, punchline, created_at").order("created_at", { ascending: false }),
    supabase.from("votes").select("candidate_id, user_id, value, created_at").order("created_at", { ascending: false }),
    supabase.from("laughs").select("joke_id, user_id, created_at").order("created_at", { ascending: false }),
    supabase.from("jokes").select("id, setup, punchline, rating, author_id, created_at").order("created_at", { ascending: false }),
  ]);
  const err = [profiles, generations, candidates, votes, laughs, jokes].find((r) => r.error)?.error;
  if (err) throw new Error(err.message);
  return {
    profiles: (profiles.data ?? []) as ProfileRow[],
    generations: (generations.data ?? []) as GenerationRow[],
    candidates: (candidates.data ?? []) as CandidateRow[],
    votes: (votes.data ?? []) as VoteRow[],
    laughs: (laughs.data ?? []) as LaughRow[],
    jokes: (jokes.data ?? []) as JokeRow[],
  };
}

export function nameOf(p: ProfileRow | undefined) {
  if (!p) return "unknown";
  return [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || p.id.slice(0, 8);
}
export const fmtDate = (s: string) => new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
export const fmtTime = (s: string) => new Date(s).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/* ---------------------------------------------------------------- week 7 */
export type ProviderRow = { id: number; slug: string; name: string; env_key: string | null; base_url: string | null; enabled: boolean; notes: string | null; created_at: string };
export type ModelRow = { id: number; provider_id: number; model_id: string; label: string | null; priority: number; timeout_ms: number; max_output_tokens: number; temperature: number; enabled: boolean; notes: string | null; created_at: string };
export type StepRow = { id: number; chain_id: number; position: number; name: string; template: string };
export type ChainRow = { id: number; name: string; description: string | null; mix_weight: number; enabled: boolean; created_at: string; steps: StepRow[] };
export type TermRow = { id: number; term: string; kind: "flavor" | "banned"; note: string | null; enabled: boolean };
export type ExampleRow = { id: number; setup: string; punchline: string; note: string | null; enabled: boolean };
export type ResponseRow = { id: number; generation_id: number | null; chain_id: number | null; step_name: string | null; provider: string | null; model: string; status: "ok" | "error"; latency_ms: number | null; prompt: string | null; raw_text: string | null; error: string | null; created_at: string };
export type DomainRow = { id: number; domain: string; note: string | null; enabled: boolean };
export type EmailRow = { id: number; email: string; note: string | null; enabled: boolean };
export type ImageRow = { id: number; bucket: string; path: string; url: string; alt: string | null; size_bytes: number | null; content_type: string | null; uploaded_by: string | null; created_at: string };
export type GenerationRow7 = GenerationRow & { chain_id: number | null };

function unwrap<T>(r: { data: unknown; error: { message: string } | null }): T[] {
  if (r.error) throw new Error(r.error.message);
  return (r.data ?? []) as T[];
}

export async function fetchPromptConfig() {
  const supabase = await createClient();
  const [chains, terms, examples] = await Promise.all([
    supabase.from("prompt_chains").select("id, name, description, mix_weight, enabled, created_at, steps:prompt_chain_steps(id, chain_id, position, name, template)").order("id"),
    supabase.from("terms").select("id, term, kind, note, enabled").order("kind").order("term"),
    supabase.from("generation_examples").select("id, setup, punchline, note, enabled").order("id"),
  ]);
  return {
    chains: unwrap<ChainRow>(chains).map((c) => ({ ...c, steps: [...(c.steps ?? [])].sort((a, b) => a.position - b.position) })),
    terms: unwrap<TermRow>(terms),
    examples: unwrap<ExampleRow>(examples),
  };
}

export async function fetchModelConfig() {
  const supabase = await createClient();
  const [providers, models] = await Promise.all([
    supabase.from("llm_providers").select("id, slug, name, env_key, base_url, enabled, notes, created_at").order("id"),
    supabase.from("llm_models").select("id, provider_id, model_id, label, priority, timeout_ms, max_output_tokens, temperature, enabled, notes, created_at").order("priority"),
  ]);
  return { providers: unwrap<ProviderRow>(providers), models: unwrap<ModelRow>(models) };
}

export async function fetchRequests() {
  const supabase = await createClient();
  const [generations, responses, chains, profiles] = await Promise.all([
    supabase.from("generations").select("id, user_id, setup, prompt, model, day, chain_id, created_at").order("created_at", { ascending: false }),
    supabase.from("llm_responses").select("id, generation_id, chain_id, step_name, provider, model, status, latency_ms, prompt, raw_text, error, created_at").order("id"),
    supabase.from("prompt_chains").select("id, name"),
    supabase.from("profiles").select("id, email, first_name, last_name, avatar_url, bio, is_superadmin, created_at"),
  ]);
  return { generations: unwrap<GenerationRow7>(generations), responses: unwrap<ResponseRow>(responses), chains: unwrap<{ id: number; name: string }>(chains), profiles: unwrap<ProfileRow>(profiles) };
}

export async function fetchSignup() {
  const supabase = await createClient();
  const [domains, emails] = await Promise.all([
    supabase.from("allowed_signup_domains").select("id, domain, note, enabled").order("domain"),
    supabase.from("whitelisted_emails").select("id, email, note, enabled").order("email"),
  ]);
  return { domains: unwrap<DomainRow>(domains), emails: unwrap<EmailRow>(emails) };
}

export async function fetchImages() {
  const supabase = await createClient();
  const [images, profiles] = await Promise.all([
    supabase.from("images").select("id, bucket, path, url, alt, size_bytes, content_type, uploaded_by, created_at").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, email, first_name, last_name, avatar_url, bio, is_superadmin, created_at").not("avatar_url", "is", null),
  ]);
  return { images: unwrap<ImageRow>(images), avatars: unwrap<ProfileRow>(profiles) };
}
