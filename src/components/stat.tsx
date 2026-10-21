/**
 * A stat tile that explains itself: what it counts, the number, how it moved
 * against the week before (colour and arrow and words together, never colour
 * alone), and seven small bars for the shape of the week.
 */
export type StatData = { title: string; what: string; total: number; thisWeek: number; lastWeek: number; days: number[] };

export function Stat({ s, i = 0 }: { s: StatData; i?: number }) {
  const diff = s.thisWeek - s.lastWeek;
  const dir = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
  const tone = dir === "up" ? "var(--sage-2, #6f8a63)" : dir === "down" ? "var(--touch)" : "var(--ink-40)";
  const max = Math.max(1, ...s.days);
  return (
    <div className="card enter flex flex-col gap-4 p-6" style={{ "--i": i } as React.CSSProperties}>
      <div>
        <p className="font-jak text-[14px] font-semibold">{s.title}</p>
        <p className="t-sm text-[color:var(--ink-60)]">{s.what}</p>
      </div>
      <div className="flex items-end justify-between gap-4">
        <span className="font-jak text-[39px] font-semibold leading-none tracking-[-0.02em] tabular-nums">{s.total}</span>
        <div className="flex h-9 items-end gap-[3px]" aria-label="last seven days" title={s.days.join(", ")}>
          {s.days.map((v, k) => (
            <span key={k} className="w-[6px] rounded-t-[3px]" style={{ height: `${Math.max(v ? 12 : 4, (v / max) * 100)}%`, background: k === s.days.length - 1 ? tone : "var(--ink-12)" }} />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <p className="t-sm flex items-center gap-2 whitespace-nowrap tabular-nums" style={{ color: tone }}>
          <span aria-hidden>{dir === "up" ? "▲" : dir === "down" ? "▼" : "—"}</span>
          <span>{dir === "flat" ? "Same as last week" : `${Math.abs(diff)} ${dir === "up" ? "more" : "fewer"} than last week`}</span>
        </p>
        <p className="t-sm text-[color:var(--ink-40)] tabular-nums">{s.thisWeek} this week · {s.lastWeek} last week</p>
      </div>
    </div>
  );
}
