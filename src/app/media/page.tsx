import Link from "next/link";
import { fetchAll, fmtTime, nameOf } from "@/lib/data";
import { Page, Table } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Media" };

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const sp = await searchParams;
  const d = await fetchAll();
  const byId = new Map(d.profiles.map((p) => [p.id, p]));
  const cands = new Map<number, number>(), lols = new Map<number, number>();
  const candGen = new Map(d.candidates.map((c) => [c.id, c.generation_id]));
  for (const c of d.candidates) cands.set(c.generation_id, (cands.get(c.generation_id) ?? 0) + 1);
  for (const v of d.votes) { const g = candGen.get(v.candidate_id); if (g) lols.set(g, (lols.get(g) ?? 0) + 1); }

  return (
    <Page
      eyebrow="AI generated media"
      title={`${d.generations.length} generations, ${d.candidates.length} punchlines`}
      lede="Each generation is one call to the model: the setup, the exact prompt, the model that answered, and the punchlines it returned. Open one to edit or delete it."
      action={<Link href="/media/new" className="btn btn-ink self-start">New generation</Link>}
    >
      {sp.deleted && <p className="t-sm mb-4 text-[color:var(--ink-60)]">Deleted.</p>}
      <Table
        head={["Setup", "Model", "By", "Punchlines", "Lols", "Day", "Created", ""]}
        empty="Nothing generated yet."
        rows={d.generations.map((g) => [
          <Link key="s" href={`/media/${g.id}`} className="font-medium hover:text-oxblood">{g.setup}</Link>,
          <span key="m" className="whitespace-nowrap text-[color:var(--ink-60)]">{g.model.replace("google/", "")}</span>,
          <span key="b" className="whitespace-nowrap">{nameOf(byId.get(g.user_id))}</span>,
          <span key="c" className="tabular-nums">{cands.get(g.id) ?? 0}</span>,
          <span key="l" className="tabular-nums">{lols.get(g.id) ?? 0}</span>,
          <span key="d" className="whitespace-nowrap text-[color:var(--ink-60)]">{g.day}</span>,
          <span key="t" className="whitespace-nowrap text-[color:var(--ink-60)]">{fmtTime(g.created_at)}</span>,
          <Link key="e" href={`/media/${g.id}`} className="t-sm whitespace-nowrap text-[color:var(--ink-60)] hover:text-oxblood">Edit →</Link>,
        ])}
      />
    </Page>
  );
}
