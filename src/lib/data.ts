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
