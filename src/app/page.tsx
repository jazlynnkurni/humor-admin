import { fetchAll, nameOf } from "@/lib/data";
import { Bars, Page } from "@/components/ui";
import { Stat, type StatData } from "@/components/stat";
import { setupFor, todayNY } from "@/lib/daily";

export const dynamic = "force-dynamic";

const DAY = 86400000;
const nyKey = (d: Date | string) => new Date(d).toLocaleDateString("en-CA", { timeZone: "America/New_York" });

/** counts for a list of timestamps: total, last 7 days, the 7 before, and a per-day series for the last 7 */
function series(stamps: string[], now: number): Omit<StatData, "title" | "what"> {
  const t = stamps.map((s) => new Date(s).getTime());
  const thisWeek = t.filter((x) => x > now - 7 * DAY).length;
  const lastWeek = t.filter((x) => x <= now - 7 * DAY && x > now - 14 * DAY).length;
  const days = Array.from({ length: 7 }, (_, i) => { const k = nyKey(new Date(now - (6 - i) * DAY)); return stamps.filter((s) => nyKey(s) === k).length; });
  return { total: stamps.length, thisWeek, lastWeek, days };
}

export default async function Overview() {
  const d = await fetchAll();
  const now = Date.now();
  const byId = new Map(d.profiles.map((p) => [p.id, p]));
  const genById = new Map(d.generations.map((g) => [g.id, g]));

  const tiles: StatData[] = [
    { title: "Members", what: "People who have signed in with Google", ...series(d.profiles.map((p) => p.created_at), now) },
    { title: "AI punchlines", what: "Lines the model has written for members", ...series(d.candidates.map((c) => c.created_at), now) },
    { title: "Lols", what: "Taps of lol? on any punchline or joke", ...series([...d.votes, ...d.laughs].map((v) => v.created_at), now) },
    { title: "Member jokes", what: "Jokes members wrote themselves", ...series(d.jokes.map((j) => j.created_at), now) },
  ];

  /* the fortnight, per day */
  const days: string[] = Array.from({ length: 14 }, (_, i) => nyKey(new Date(now - (13 - i) * DAY)));
  const gensPerDay = days.map((k) => ({ k: k.slice(5), v: d.generations.filter((g) => g.day === k).length }));
  const lolsPerDay = days.map((k) => ({ k: k.slice(5), v: d.votes.filter((v) => nyKey(v.created_at) === k).length + d.laughs.filter((l) => nyKey(l.created_at) === k).length }));
  const sum = (a: { v: number }[], from: number, to: number) => a.slice(from, to).reduce((s, x) => s + x.v, 0);

  /* what is landing, and who is showing up */
  const lolCount = new Map<number, number>();
  for (const v of d.votes) lolCount.set(v.candidate_id, (lolCount.get(v.candidate_id) ?? 0) + 1);
  const top = d.candidates.map((c) => ({ c, n: lolCount.get(c.id) ?? 0 })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n).slice(0, 5);
  const activity = new Map<string, number>();
  for (const g of d.generations) activity.set(g.user_id, (activity.get(g.user_id) ?? 0) + 1);
  for (const v of d.votes) activity.set(v.user_id, (activity.get(v.user_id) ?? 0) + 1);
  for (const j of d.jokes) if (j.author_id) activity.set(j.author_id, (activity.get(j.author_id) ?? 0) + 1);
  const active = [...activity.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <Page eyebrow="Overview" title="How the site is doing" lede={`Today's setup is "${setupFor(todayNY())}". Each tile is a running total, with how it moved against the week before.`}>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t, i) => <Stat key={t.title} s={t} i={i} />)}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Chart i={4} title="Generations per day" what="How often members asked the model for punchlines, last 14 days" thisWeek={sum(gensPerDay, 7, 14)} lastWeek={sum(gensPerDay, 0, 7)} data={gensPerDay} />
        <Chart i={5} title="Lols per day" what="How many punchlines and jokes got a laugh, last 14 days" thisWeek={sum(lolsPerDay, 7, 14)} lastWeek={sum(lolsPerDay, 0, 7)} data={lolsPerDay} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="card enter p-6 lg:col-span-2" style={{ "--i": 6 } as React.CSSProperties}>
          <h2 className="font-jak text-[16px] font-semibold">What&apos;s landing</h2>
          <p className="t-sm text-[color:var(--ink-60)]">The five AI punchlines with the most lols, all time.</p>
          <ol className="mt-4 flex flex-col divide-y divide-[color:var(--ink-06)]">
            {top.map(({ c, n }, i) => (
              <li key={c.id} className="flex items-start gap-4 py-3">
                <span className="w-6 font-jak text-[13px] font-medium text-[color:var(--ink-40)] tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-jak text-[16px] font-semibold leading-[1.3]">{c.punchline}</p>
                  <p className="t-sm mt-1 text-[color:var(--ink-60)]">{genById.get(c.generation_id)?.setup}</p>
                </div>
                <span className="whitespace-nowrap font-jak text-[14px] font-medium tabular-nums">{n} lol{n === 1 ? "" : "s"}</span>
              </li>
            ))}
            {top.length === 0 && <li className="t-sm py-3 text-[color:var(--ink-60)]">No punchline has a lol yet.</li>}
          </ol>
        </section>
        <section className="card enter p-6" style={{ "--i": 7 } as React.CSSProperties}>
          <h2 className="font-jak text-[16px] font-semibold">Most active members</h2>
          <p className="t-sm text-[color:var(--ink-60)]">Generations, lols and jokes, added up.</p>
          <ul className="mt-4 flex flex-col gap-3">
            {active.map(([uid, n]) => (
              <li key={uid} className="flex items-center justify-between text-[14px]">
                <span className="truncate">{nameOf(byId.get(uid))}</span>
                <span className="tabular-nums text-[color:var(--ink-60)]">{n} action{n === 1 ? "" : "s"}</span>
              </li>
            ))}
            {active.length === 0 && <li className="t-sm text-[color:var(--ink-60)]">No one yet.</li>}
          </ul>
        </section>
      </div>
    </Page>
  );
}

function Chart({ i = 0, title, what, thisWeek, lastWeek, data }: { i?: number; title: string; what: string; thisWeek: number; lastWeek: number; data: { k: string; v: number }[] }) {
  const diff = thisWeek - lastWeek;
  const tone = diff > 0 ? "var(--sage-2, #6f8a63)" : diff < 0 ? "var(--touch)" : "var(--ink-40)";
  return (
    <section className="card enter p-6" style={{ "--i": i } as React.CSSProperties}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-jak text-[16px] font-semibold">{title}</h2>
          <p className="t-sm text-[color:var(--ink-60)]">{what}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="t-sm whitespace-nowrap tabular-nums" style={{ color: tone }}>
            <span aria-hidden>{diff > 0 ? "▲" : diff < 0 ? "▼" : "—"}</span> {diff === 0 ? "Same as last week" : `${Math.abs(diff)} ${diff > 0 ? "more" : "fewer"} than last week`}
          </p>
          <p className="t-sm whitespace-nowrap text-[color:var(--ink-40)] tabular-nums">{thisWeek} this week · {lastWeek} last week</p>
        </div>
      </div>
      <div className="mt-6">
        <Bars data={data} label={title} />
      </div>
    </section>
  );
}
