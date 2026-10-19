import { fetchAll, fmtTime, nameOf } from "@/lib/data";
import { Avatar, Page, Table } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Votes" };

export default async function VotesPage() {
  const d = await fetchAll();
  const byId = new Map(d.profiles.map((p) => [p.id, p]));
  const cand = new Map(d.candidates.map((c) => [c.id, c]));
  const joke = new Map(d.jokes.map((j) => [j.id, j]));

  return (
    <Page eyebrow="Votes" title={`${d.votes.length + d.laughs.length} lols`} lede="Every lol recorded: on the model's punchlines (votes) and on members' own jokes (laughs). Read only.">
      <h2 className="mb-3 font-jak text-[16px] font-semibold">On AI punchlines</h2>
      <Table
        head={["When", "Who", "Punchline", "Value"]}
        empty="No votes yet."
        rows={d.votes.map((v) => {
          const p = byId.get(v.user_id);
          return [
            <span key="t" className="whitespace-nowrap text-[color:var(--ink-60)]">{fmtTime(v.created_at)}</span>,
            <span key="w" className="flex items-center gap-2 whitespace-nowrap"><Avatar src={p?.avatar_url ?? null} name={nameOf(p)} />{nameOf(p)}</span>,
            <span key="c">{cand.get(v.candidate_id)?.punchline ?? <em className="text-[color:var(--ink-40)]">deleted punchline</em>}</span>,
            <span key="v" className="tabular-nums">{v.value > 0 ? "lol" : "−1"}</span>,
          ];
        })}
      />
      <h2 className="mb-3 mt-12 font-jak text-[16px] font-semibold">On members&apos; jokes</h2>
      <Table
        head={["When", "Who", "Joke"]}
        empty="No laughs yet."
        rows={d.laughs.map((l) => {
          const p = byId.get(l.user_id), j = joke.get(l.joke_id);
          return [
            <span key="t" className="whitespace-nowrap text-[color:var(--ink-60)]">{fmtTime(l.created_at)}</span>,
            <span key="w" className="flex items-center gap-2 whitespace-nowrap"><Avatar src={p?.avatar_url ?? null} name={nameOf(p)} />{nameOf(p)}</span>,
            <span key="j">{j ? `${j.setup} ${j.punchline}` : <em className="text-[color:var(--ink-40)]">deleted joke</em>}</span>,
          ];
        })}
      />
    </Page>
  );
}
