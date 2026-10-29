import { fetchPromptConfig } from "@/lib/data";
import { Page } from "@/components/ui";
import { Notice, RowEditor, Section } from "@/components/crud";
import { updateMix } from "@/app/crud-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Prompts" };

export default async function PromptsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const sp = await searchParams;
  const { chains, terms, examples } = await fetchPromptConfig();
  const live = chains.filter((c) => c.enabled);
  const total = live.reduce((s, c) => s + c.mix_weight, 0);

  return (
    <Page eyebrow="Prompts" title="How the model is asked" lede="The chain that runs, the steps inside it, the Columbia vocabulary and the examples the steps pull in. The app reads all of this at generation time, so a change here is live on the next tap of the button.">
      <Notice saved={sp.saved} error={sp.error} />

      <Section title="Prompt chains and the mix" lede="A chain is an ordered list of calls to the model. The mix is how new generations split between enabled chains: weights, shown as a percentage. Set a chain to 0 to rest it.">
        <form action={updateMix} className="card enter p-6" style={{ "--i": 1 } as React.CSSProperties}>
          <ul className="flex flex-col divide-y divide-[color:var(--ink-06)]">
            {chains.map((c) => {
              const pct = c.enabled && total ? Math.round((c.mix_weight / total) * 100) : 0;
              return (
                <li key={c.id} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-6">
                  <div className="flex-1">
                    <p className="font-medium">{c.name} {!c.enabled && <span className="t-sm text-[color:var(--ink-40)]">(disabled)</span>}</p>
                    <p className="t-sm text-[color:var(--ink-60)]">{c.description} · {c.steps.length} step{c.steps.length === 1 ? "" : "s"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-[color:var(--ink-06)]"><div className="h-full rounded-full bg-ink" style={{ width: `${pct}%` }} /></div>
                    <span className="w-10 text-right tabular-nums text-[color:var(--ink-60)]">{pct}%</span>
                    <input type="number" name={`w${c.id}`} min={0} defaultValue={c.mix_weight} className="input min-h-0 w-24 px-3 py-2 text-[14px] tabular-nums" aria-label={`${c.name} weight`} />
                  </div>
                </li>
              );
            })}
          </ul>
          <button className="btn btn-ink mt-6 self-start">Update mix</button>
        </form>
      </Section>

      <Section title="Steps" lede="What each step says. {{setup}} is the member's setup; {{terms}}, {{banned}} and {{examples}} come from the tables below; {{previous}} is the last step's output.">
        <div className="grid gap-6 lg:grid-cols-2">
          {chains.map((c, i) => (
            <div key={c.id} className="card enter p-6" style={{ "--i": 2 + i } as React.CSSProperties}>
              <h3 className="font-jak text-[16px] font-semibold">{c.name}</h3>
              <ol className="mt-4 flex flex-col gap-4">
                {c.steps.map((s) => (
                  <li key={s.id}>
                    <p className="t-sm font-medium"><span className="text-[color:var(--ink-40)] tabular-nums">{s.position}.</span> {s.name}</p>
                    <pre className="mt-2 whitespace-pre-wrap rounded-[12px] bg-[color:var(--ink-06)] p-4 text-[12px] leading-[1.5] text-[color:var(--ink-60)]">{s.template}</pre>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Terms" lede="Flavour terms are the Columbia things the model may lean on. Banned terms are listed in every prompt as off limits.">
        <RowEditor
          table="terms" i={4} addLabel="Add term" empty="No terms yet."
          rows={terms}
          fields={[
            { name: "term", label: "Term", w: "1.4fr" },
            { name: "kind", label: "Kind", type: "select", w: "0.7fr", options: [{ value: "flavor", label: "flavour" }, { value: "banned", label: "banned" }] },
            { name: "note", label: "Note", w: "1.6fr" },
            { name: "enabled", label: "On", type: "bool", w: "auto" },
          ]}
        />
      </Section>

      <Section title="Generation examples" lede="Few-shot examples of the tone, quoted inside every prompt.">
        <RowEditor
          table="generation_examples" i={5} addLabel="Add example" empty="No examples yet."
          rows={examples}
          fields={[
            { name: "setup", label: "Setup", w: "1.2fr" },
            { name: "punchline", label: "Punchline", type: "textarea", w: "2fr" },
            { name: "note", label: "Note", w: "1fr" },
            { name: "enabled", label: "On", type: "bool", w: "auto" },
          ]}
        />
      </Section>
    </Page>
  );
}
