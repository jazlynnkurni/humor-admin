import Link from "next/link";

export function Page({ eyebrow, title, lede, action, children }: { eyebrow: string; title: string; lede?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-7xl px-6 pb-16 pt-32 md:px-16">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-[640px]">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="t-h1 mt-3">{title}</h1>
          {lede && <p className="t-sm mt-3 text-[color:var(--ink-60)]">{lede}</p>}
        </div>
        {action}
      </div>
      <div className="mt-10">{children}</div>
    </main>
  );
}

/** One series of thin bars with 4px rounded ends, baseline anchored, hover tooltip via title. */
export function Bars({ data, label }: { data: { k: string; v: number }[]; label: string }) {
  const max = Math.max(1, ...data.map((d) => d.v));
  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-40 items-end gap-[6px]" role="img" aria-label={label}>
        {data.map((d) => (
          <div key={d.k} className="group relative flex h-full flex-1 flex-col justify-end" title={`${d.k}: ${d.v}`}>
            <div className="w-full rounded-t-[4px] bg-ink transition-opacity group-hover:opacity-70" style={{ height: `${(d.v / max) * 100}%`, minHeight: d.v ? 3 : 0 }} />
            <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded-full bg-ink px-2 py-0.5 text-[11px] text-paper opacity-0 transition-opacity group-hover:opacity-100 tabular-nums">{d.v}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-[6px]">
        {data.map((d, i) => (
          <span key={d.k} className="flex-1 truncate text-center text-[11px] text-[color:var(--ink-40)]">{data.length > 10 && i % 2 ? "" : d.k}</span>
        ))}
      </div>
    </div>
  );
}

export function Table({ head, rows, empty }: { head: string[]; rows: React.ReactNode[][]; empty: string }) {
  if (rows.length === 0) return <p className="t-sm text-[color:var(--ink-60)]">{empty}</p>;
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-left text-[14px]">
        <thead>
          <tr className="border-b border-[color:var(--ink-12)]">
            {head.map((h) => (
              <th key={h} className="whitespace-nowrap px-5 py-3 font-jak text-[12px] font-medium text-[color:var(--ink-60)]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-[color:var(--ink-06)] last:border-0 hover:bg-[color:var(--ink-06)]">
              {r.map((c, j) => (
                <td key={j} className="px-5 py-3 align-top">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Avatar({ src, name }: { src: string | null; name: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="h-6 w-6 rounded-full object-cover" />
  ) : (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sage text-[11px] font-semibold text-paper">{name[0]?.toUpperCase() ?? "?"}</span>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="t-sm text-[color:var(--ink-60)] hover:text-oxblood">← {children}</Link>;
}
