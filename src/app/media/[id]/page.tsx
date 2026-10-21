import { notFound } from "next/navigation";
import { fetchAll, fmtTime, nameOf } from "@/lib/data";
import { Page, BackLink } from "@/components/ui";
import { addCandidate, deleteCandidate, deleteGeneration, updateCandidate, updateGeneration } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit generation" };

export default async function EditMedia({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { id } = await params; const sp = await searchParams;
  const d = await fetchAll();
  const g = d.generations.find((x) => x.id === Number(id));
  if (!g) notFound();
  const cands = d.candidates.filter((c) => c.generation_id === g.id).sort((a, b) => a.id - b.id);
  const lols = new Map<number, number>();
  for (const v of d.votes) lols.set(v.candidate_id, (lols.get(v.candidate_id) ?? 0) + 1);
  const author = d.profiles.find((p) => p.id === g.user_id);

  return (
    <Page eyebrow="AI generated media" title={g.setup} lede={`${g.model.replace("google/", "")} · by ${nameOf(author)} · ${fmtTime(g.created_at)} · day ${g.day}`} action={<BackLink href="/media">All media</BackLink>}>
      {sp.saved && <p className="t-sm mb-4 text-[color:var(--ink-60)]">Saved.</p>}
      {sp.error && <p className="t-sm mb-4 text-oxblood">{decodeURIComponent(sp.error)}</p>}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          <form action={updateGeneration} className="card enter flex flex-col gap-4 p-6" style={{ "--i": 1 } as React.CSSProperties}>
            <input type="hidden" name="id" value={g.id} />
            <h2 className="font-jak text-[16px] font-semibold">Setup</h2>
            <input name="setup" defaultValue={g.setup} required className="input" />
            <button className="btn btn-paper self-start">Save setup</button>
          </form>

          <section className="card enter p-6" style={{ "--i": 2 } as React.CSSProperties}>
            <h2 className="font-jak text-[16px] font-semibold">Punchlines</h2>
            <ul className="mt-4 flex flex-col divide-y divide-[color:var(--ink-06)]">
              {cands.map((c) => (
                <li key={c.id} className="flex flex-col gap-3 py-4">
                  <form action={updateCandidate} className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <input type="hidden" name="id" value={c.id} /><input type="hidden" name="generation_id" value={g.id} />
                    <textarea name="punchline" defaultValue={c.punchline} rows={2} className="input flex-1" />
                    <div className="flex items-center gap-2">
                      <button className="btn btn-paper h-10 min-h-0 px-4 text-[14px]">Save</button>
                    </div>
                  </form>
                  <div className="flex items-center justify-between">
                    <span className="t-sm text-[color:var(--ink-60)] tabular-nums">{lols.get(c.id) ?? 0} lol{(lols.get(c.id) ?? 0) === 1 ? "" : "s"}</span>
                    <form action={deleteCandidate}>
                      <input type="hidden" name="id" value={c.id} /><input type="hidden" name="generation_id" value={g.id} />
                      <button className="btn btn-ghost h-9 min-h-0 text-[14px]">Delete punchline</button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
            <form action={addCandidate} className="mt-4 flex flex-col gap-3 border-t border-[color:var(--ink-12)] pt-4 sm:flex-row">
              <input type="hidden" name="generation_id" value={g.id} />
              <input name="punchline" placeholder="Add a punchline" required className="input flex-1" />
              <button className="btn btn-ink h-12 min-h-0 px-5 text-[14px]">Add</button>
            </form>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="card enter p-6" style={{ "--i": 3 } as React.CSSProperties}>
            <h2 className="font-jak text-[16px] font-semibold">Prompt sent</h2>
            <pre className="mt-3 whitespace-pre-wrap text-[12px] leading-[1.5] text-[color:var(--ink-60)]">{g.prompt}</pre>
          </section>
          <form action={deleteGeneration} className="card enter flex flex-col gap-3 p-6" style={{ "--i": 4 } as React.CSSProperties}>
            <input type="hidden" name="id" value={g.id} />
            <h2 className="font-jak text-[16px] font-semibold text-oxblood">Delete this generation</h2>
            <p className="t-sm text-[color:var(--ink-60)]">Removes the setup, its {cands.length} punchline{cands.length === 1 ? "" : "s"}, and every lol on them. This cannot be undone.</p>
            <button className="btn btn-paper self-start text-oxblood">Delete generation</button>
          </form>
        </div>
      </div>
    </Page>
  );
}
