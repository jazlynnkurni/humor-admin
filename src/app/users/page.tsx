import { fetchAll, fmtDate, nameOf } from "@/lib/data";
import { Avatar, Page, Table } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Users" };

export default async function UsersPage() {
  const d = await fetchAll();
  const gens = new Map<string, number>(), votes = new Map<string, number>(), jokes = new Map<string, number>();
  for (const g of d.generations) gens.set(g.user_id, (gens.get(g.user_id) ?? 0) + 1);
  for (const v of d.votes) votes.set(v.user_id, (votes.get(v.user_id) ?? 0) + 1);
  for (const j of d.jokes) if (j.author_id) jokes.set(j.author_id, (jokes.get(j.author_id) ?? 0) + 1);

  return (
    <Page eyebrow="Users" title={`${d.profiles.length} ${d.profiles.length === 1 ? "profile" : "profiles"}`} lede="Read only. Profiles are created by the sign-up trigger and edited by their owners; the superadmin flag is set in the database.">
      <Table
        head={["Member", "Email", "Bio", "Generations", "Lols given", "Jokes", "Role", "Joined"]}
        empty="No profiles yet."
        rows={d.profiles.map((p) => [
          <span key="n" className="flex items-center gap-2"><Avatar src={p.avatar_url} name={nameOf(p)} /><span className="whitespace-nowrap">{nameOf(p)}</span></span>,
          <span key="e" className="text-[color:var(--ink-60)]">{p.email ?? "—"}</span>,
          <span key="b" className="block max-w-[260px] truncate text-[color:var(--ink-60)]">{p.bio ?? ""}</span>,
          <span key="g" className="tabular-nums">{gens.get(p.id) ?? 0}</span>,
          <span key="v" className="tabular-nums">{votes.get(p.id) ?? 0}</span>,
          <span key="j" className="tabular-nums">{jokes.get(p.id) ?? 0}</span>,
          p.is_superadmin ? <span key="r" className="rounded-full bg-oxblood px-2 py-0.5 text-[11px] font-medium text-paper">superadmin</span> : <span key="r" className="text-[color:var(--ink-60)]">member</span>,
          <span key="d" className="whitespace-nowrap text-[color:var(--ink-60)]">{fmtDate(p.created_at)}</span>,
        ])}
      />
    </Page>
  );
}
