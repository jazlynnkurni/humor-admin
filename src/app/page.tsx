import { fetchAll, nameOf } from "@/lib/data";
import { Bars, Page, Stat } from "@/components/ui";
import { setupFor, todayNY } from "@/lib/daily";

export const dynamic = "force-dynamic";

export default async function Overview() {
  const d = await fetchAll();
  const day = todayNY();
  const byId = new Map(d.profiles.map((p) => [p.id, p]));

  /* lols per candidate, then the top five */
  const lolCount = new Map<number, number>();
  for (const v of d.votes) lolCount.set(v.candidate_id, (lolCount.get(v.candidate_id) ?? 0) + 1);
  const top = [...d.candidates].map((c) => ({ c, n: lolCount.get(c.id) ?? 0 })).sort((a, b) => b.n - a.n).slice(0, 5);
  const genById = new Map(d.generations.map((g) => [g.id, g]));

  /* the last 14 days: generations and lols per day, New York time */
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) { const t = new Date(); t.setDate(t.getDate() - i); days.push(t.toLocaleDateString("en-CA", { timeZone: "America/New_York" })); }
  const dayKey = (s: string) => new Date(s).toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const gensPerDay = days.map((k) => ({ k: k.slice(5), v: d.generations.filter((g) => g.day === k).length }));
  const lolsPerDay = days.map((k) => ({ k: k.slice(5), v: d.votes.filter((v) => dayKey(v.created_at) === k).length + d.laughs.filter((l) => dayKey(l.created_at) === k).length }));

  /* who generates most, which model answered, how many setups have been used */
  const genByUser = new Map<string, number>();
  for (const g of d.generations) genByUser.set(g.user_id, (genByUser.get(g.user_id) ?? 0) + 1);
  const topGen = [...genByUser.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const models = new Map<string, number>();
  for (const g of d.generations) models.set(g.model, (models.get(g.model) ?? 0) + 1);
  const setups = new Set(d.generations.map((g) => g.setup)).size;
  const voters = new Set(d.votes.map((v) => v.user_id)).size;
  const avgPerGen = d.generations.length ? (d.votes.length / d.generations.length).toFixed(1) : "0";

  return (
    <Page eyebrow="Overview" title={`Today is "${setupFor(day)}".`} lede="What the site has done so far: who is here, what the model wrote, and what landed.">
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <Stat n={d.profiles.length} label="members" sub={`${d.profiles.filter((p) => p.is_superadmin).length} superadmin`} i={0} />
        <Stat n={d.candidates.length} label="AI punchlines" sub={`from ${d.generations.length} generations on ${setups} setups`} i={1} />
        <Stat n={d.votes.length} label="lols on AI punchlines" sub={`${voters} ${voters === 1 ? "person" : "people"} laughing, ${avgPerGen} per generation`} i={2} />
        <Stat n={d.jokes.length} label="jokes in the record" sub={`${d.laughs.length} lols on them`} i={3} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="font-jak text-[16px] font-semibold">Generations per day</h2>
          <p className="t-sm mb-6 text-[color:var(--ink-60)]">Last fourteen days, New York time.</p>
          <Bars data={gensPerDay} label="Generations per day" />
        </section>
        <section className="card p-6">
          <h2 className="font-jak text-[16px] font-semibold">Lols per day</h2>
          <p className="t-sm mb-6 text-[color:var(--ink-60)]">On AI punchlines and member jokes together.</p>
          <Bars data={lolsPerDay} label="Lols per day" />
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="card p-6 lg:col-span-2">
          <h2 className="font-jak text-[16px] font-semibold">Most laughed at</h2>
          <ol className="mt-4 flex flex-col divide-y divide-[color:var(--ink-06)]">
            {top.map(({ c, n }, i) => (
              <li key={c.id} className="flex items-start gap-4 py-3">
                <span className="w-6 font-jak text-[13px] font-medium text-[color:var(--ink-40)] tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-jak text-[16px] font-semibold leading-[1.3]">{c.punchline}</p>
                  <p className="t-sm mt-1 text-[color:var(--ink-60)]">{genById.get(c.generation_id)?.setup} · by {nameOf(byId.get(genById.get(c.generation_id)?.user_id ?? ""))}</p>
                </div>
                <span className="font-jak text-[14px] font-medium tabular-nums">{n} lol{n === 1 ? "" : "s"}</span>
              </li>
            ))}
            {top.length === 0 && <li className="t-sm py-3 text-[color:var(--ink-60)]">Nothing generated yet.</li>}
          </ol>
        </section>
        <div className="flex flex-col gap-6">
          <section className="card p-6">
            <h2 className="font-jak text-[16px] font-semibold">Who generates</h2>
            <ul className="mt-4 flex flex-col gap-2">
              {topGen.map(([uid, n]) => (
                <li key={uid} className="flex items-center justify-between text-[14px]">
                  <span className="truncate">{nameOf(byId.get(uid))}</span>
                  <span className="tabular-nums text-[color:var(--ink-60)]">{n}</span>
                </li>
              ))}
              {topGen.length === 0 && <li className="t-sm text-[color:var(--ink-60)]">No one yet.</li>}
            </ul>
          </section>
          <section className="card p-6">
            <h2 className="font-jak text-[16px] font-semibold">Which model answered</h2>
            <ul className="mt-4 flex flex-col gap-2">
              {[...models.entries()].sort((a, b) => b[1] - a[1]).map(([m, n]) => (
                <li key={m} className="flex items-center justify-between text-[14px]">
                  <span className="truncate">{m.replace("google/", "")}</span>
                  <span className="tabular-nums text-[color:var(--ink-60)]">{n}</span>
                </li>
              ))}
              {models.size === 0 && <li className="t-sm text-[color:var(--ink-60)]">None yet.</li>}
            </ul>
          </section>
        </div>
      </div>
    </Page>
  );
}
