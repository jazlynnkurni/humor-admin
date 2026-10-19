import { Page, BackLink } from "@/components/ui";
import { setupFor, todayNY } from "@/lib/daily";
import { createGenerated, createManual } from "../actions";

export const metadata = { title: "New generation" };
export const maxDuration = 60;

export default async function NewMedia({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const today = setupFor(todayNY());
  return (
    <Page eyebrow="AI generated media" title="New generation" lede="Two ways in: let the model write three punchlines on a setup, or type them yourself." action={<BackLink href="/media">All media</BackLink>}>
      {error && <p className="t-sm mb-6 text-oxblood">{decodeURIComponent(error)}</p>}
      <div className="grid gap-6 lg:grid-cols-2">
        <form action={createGenerated} className="card flex flex-col gap-4 p-6">
          <h2 className="font-jak text-[16px] font-semibold">Ask the model</h2>
          <label className="field"><span>Setup</span><input name="setup" defaultValue={today} required className="input" /></label>
          <p className="t-sm text-[color:var(--ink-60)]">The prompt, the model that answered, and all three punchlines are stored.</p>
          <button className="btn btn-ink self-start">Write me three punchlines</button>
        </form>
        <form action={createManual} className="card flex flex-col gap-4 p-6">
          <h2 className="font-jak text-[16px] font-semibold">Write them by hand</h2>
          <label className="field"><span>Setup</span><input name="setup" required className="input" placeholder="The Hamilton deli line at 12:10pm" /></label>
          <label className="field"><span>Punchline 1</span><input name="p1" required className="input" /></label>
          <label className="field"><span>Punchline 2</span><input name="p2" className="input" /></label>
          <label className="field"><span>Punchline 3</span><input name="p3" className="input" /></label>
          <button className="btn btn-paper self-start">Save</button>
        </form>
      </div>
    </Page>
  );
}
