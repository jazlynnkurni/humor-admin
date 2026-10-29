import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchRequests, fmtTime, nameOf } from "@/lib/data";
import { Page, BackLink } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Request" };

export default async function RequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await fetchRequests();
  const g = d.generations.find((x) => x.id === Number(id));
  if (!g) notFound();
  const rs = d.responses.filter((r) => r.generation_id === g.id);
  const chain = g.chain_id ? d.chains.find((c) => c.id === g.chain_id)?.name : null;

  return (
    <Page eyebrow="Generation request" title={g.setup} lede={`${chain ?? (g.model === "admin/manual" ? "written by hand" : "built-in prompt")} · answered by ${g.model.replace(/^google\//, "")} · by ${nameOf(d.profiles.find((p) => p.id === g.user_id))} · ${fmtTime(g.created_at)}`} action={<BackLink href="/requests">All requests</BackLink>}>
      <p className="t-sm mb-6 text-[color:var(--ink-60)]">The punchlines this produced are under <Link href={`/media/${g.id}`} className="link">media</Link>.</p>
      {rs.length === 0 && <p className="t-sm text-[color:var(--ink-60)]">No raw replies were recorded for this request (it predates the log, or was written by hand).</p>}
      <ol className="flex flex-col gap-6">
        {rs.map((r, i) => (
          <li key={r.id} className="card enter p-6" style={{ "--i": i + 1 } as React.CSSProperties}>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="font-jak text-[16px] font-semibold">{r.step_name ?? "call"} · {r.model}</span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${r.status === "ok" ? "bg-sage text-paper" : "bg-oxblood text-paper"}`}>{r.status}</span>
              <span className="t-sm tabular-nums text-[color:var(--ink-60)]">{r.latency_ms != null ? `${(r.latency_ms / 1000).toFixed(1)}s` : ""}</span>
              <span className="t-sm text-[color:var(--ink-60)]">{r.provider}</span>
            </div>
            {r.error && <pre className="mt-3 whitespace-pre-wrap rounded-[12px] bg-[color:var(--ink-06)] p-4 text-[12px] leading-[1.5] text-oxblood">{r.error}</pre>}
            {r.raw_text && (
              <details className="mt-3" open={i === rs.length - 1}>
                <summary className="t-sm cursor-pointer text-[color:var(--ink-60)]">Raw reply</summary>
                <pre className="mt-2 whitespace-pre-wrap rounded-[12px] bg-[color:var(--ink-06)] p-4 text-[12px] leading-[1.5]">{r.raw_text}</pre>
              </details>
            )}
            {r.prompt && (
              <details className="mt-2">
                <summary className="t-sm cursor-pointer text-[color:var(--ink-60)]">Prompt sent</summary>
                <pre className="mt-2 whitespace-pre-wrap rounded-[12px] bg-[color:var(--ink-06)] p-4 text-[12px] leading-[1.5] text-[color:var(--ink-60)]">{r.prompt}</pre>
              </details>
            )}
          </li>
        ))}
      </ol>
    </Page>
  );
}
