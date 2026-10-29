import Link from "next/link";
import { fetchRequests, fmtTime, nameOf } from "@/lib/data";
import { Page, Table } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Requests" };

export default async function RequestsPage() {
  const d = await fetchRequests();
  const byId = new Map(d.profiles.map((p) => [p.id, p]));
  const chain = new Map(d.chains.map((c) => [c.id, c.name]));
  const calls = new Map<number, { ok: number; err: number; ms: number }>();
  for (const r of d.responses) {
    if (!r.generation_id) continue;
    const c = calls.get(r.generation_id) ?? { ok: 0, err: 0, ms: 0 };
    if (r.status === "ok") c.ok++; else c.err++;
    c.ms += r.latency_ms ?? 0;
    calls.set(r.generation_id, c);
  }
  const errs = d.responses.filter((r) => r.status === "error").length;

  return (
    <Page eyebrow="Generation requests" title={`${d.generations.length} requests, ${d.responses.length} model calls`} lede={`Every time a member or an admin asked for punchlines, which chain ran, which model finally answered, and how many calls it took. ${errs} call${errs === 1 ? "" : "s"} failed and fell through to the next model. Open one to read every raw reply.`}>
      <Table
        head={["When", "Setup", "By", "Chain", "Answered by", "Calls", "Time", ""]}
        empty="No requests yet."
        rows={d.generations.map((g) => {
          const c = calls.get(g.id);
          return [
            <span key="t" className="whitespace-nowrap text-[color:var(--ink-60)]">{fmtTime(g.created_at)}</span>,
            <Link key="s" href={`/requests/${g.id}`} className="font-medium hover:text-oxblood">{g.setup}</Link>,
            <span key="b" className="whitespace-nowrap">{nameOf(byId.get(g.user_id))}</span>,
            <span key="c" className="whitespace-nowrap text-[color:var(--ink-60)]">{g.chain_id ? chain.get(g.chain_id) ?? `#${g.chain_id}` : g.model === "admin/manual" ? "by hand" : "built-in"}</span>,
            <span key="m" className="whitespace-nowrap text-[color:var(--ink-60)]">{g.model.replace(/^google\//, "")}</span>,
            <span key="n" className="whitespace-nowrap tabular-nums">{c ? <>{c.ok + c.err}{c.err ? <span className="text-oxblood"> ({c.err} failed)</span> : null}</> : "—"}</span>,
            <span key="ms" className="whitespace-nowrap tabular-nums text-[color:var(--ink-60)]">{c ? `${(c.ms / 1000).toFixed(1)}s` : "—"}</span>,
            <Link key="e" href={`/requests/${g.id}`} className="t-sm whitespace-nowrap text-[color:var(--ink-60)] hover:text-oxblood">Replies →</Link>,
          ];
        })}
      />
    </Page>
  );
}
