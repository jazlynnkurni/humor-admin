import { fetchModelConfig } from "@/lib/data";
import { Page } from "@/components/ui";
import { Notice, RowEditor, Section } from "@/components/crud";

export const dynamic = "force-dynamic";
export const metadata = { title: "Models" };

export default async function ModelsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const sp = await searchParams;
  const { providers, models } = await fetchModelConfig();
  const keys = providers.map((p) => ({ name: p.env_key, set: p.env_key ? Boolean(process.env[p.env_key]) : false }));

  return (
    <Page eyebrow="Models" title="Who answers, and in what order" lede="Generation tries each enabled model by priority until one answers inside its timeout. Providers name the environment variable that holds their key; the value itself lives only in Vercel.">
      <Notice saved={sp.saved} error={sp.error} />

      <Section title="Providers">
        <RowEditor
          table="llm_providers" i={1} addLabel="Add provider" empty="No providers yet."
          rows={providers}
          fields={[
            { name: "slug", label: "Slug", w: "0.7fr", mono: true, placeholder: "google" },
            { name: "name", label: "Name", w: "1.1fr" },
            { name: "env_key", label: "Env var (name)", w: "1.3fr", mono: true },
            { name: "base_url", label: "Base URL", w: "1.3fr", mono: true },
            { name: "notes", label: "Notes", w: "1fr" },
            { name: "enabled", label: "On", type: "bool", w: "auto" },
          ]}
        />
        <p className="t-sm mt-3 text-[color:var(--ink-60)]">
          Keys present in this deployment: {keys.map((k) => `${k.name ?? "(none)"} ${k.set ? "✓" : "✗"}`).join(" · ") || "none"}
        </p>
      </Section>

      <Section title="Models" lede="Lower priority runs first. Timeout is per attempt, in milliseconds.">
        <RowEditor
          table="llm_models" i={2} addLabel="Add model" empty="No models yet."
          rows={models}
          fields={[
            { name: "provider_id", label: "Provider", type: "select", w: "0.9fr", options: providers.map((p) => ({ value: p.id, label: p.name })) },
            { name: "model_id", label: "Model id", w: "1.4fr", mono: true, placeholder: "gemini-3-flash-preview" },
            { name: "label", label: "Label", w: "1.1fr" },
            { name: "priority", label: "Priority", type: "int", w: "0.55fr" },
            { name: "timeout_ms", label: "Timeout", type: "int", w: "0.6fr" },
            { name: "max_output_tokens", label: "Max tokens", type: "int", w: "0.6fr" },
            { name: "temperature", label: "Temp", type: "num", w: "0.55fr" },
            { name: "enabled", label: "On", type: "bool", w: "auto" },
          ]}
        />
      </Section>
    </Page>
  );
}
