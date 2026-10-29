import { removeRow, saveRow } from "@/app/crud-actions";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "int" | "num" | "bool" | "select";
  options?: { value: string | number; label: string }[];
  placeholder?: string;
  /** fraction of the row, as a CSS grid track */
  w?: string;
  mono?: boolean;
};

type Row = Record<string, unknown> & { id: number };

function Input({ f, value, form }: { f: Field; value: unknown; form?: string }) {
  const v = value === null || value === undefined ? "" : String(value);
  const cls = `input min-h-0 px-3 py-2 text-[14px] ${f.mono ? "font-mono text-[12.5px]" : ""}`;
  if (f.type === "bool") {
    return (
      <label className="flex h-10 items-center gap-2 text-[13px] text-[color:var(--ink-60)]">
        <input type="checkbox" form={form} name={f.name} defaultChecked={Boolean(value)} className="h-4 w-4 accent-[color:var(--ink)]" />
        <span className="sm:hidden">{f.label}</span>
      </label>
    );
  }
  if (f.type === "select") {
    return (
      <select form={form} name={f.name} defaultValue={v} className={cls}>
        {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }
  if (f.type === "textarea") return <textarea form={form} name={f.name} defaultValue={v} rows={2} placeholder={f.placeholder} className={`${cls} min-h-[40px]`} />;
  return <input form={form} name={f.name} type={f.type === "int" || f.type === "num" ? "number" : "text"} step={f.type === "num" ? "0.05" : undefined} defaultValue={v} placeholder={f.placeholder} className={cls} />;
}

/**
 * Create, read, update and delete for one table. Every existing row is a form
 * (Save, Delete); the last row is the blank one that creates. Columns and the
 * allowlist live in crud-actions.ts, so the table name here is a key, not SQL.
 */
export function RowEditor({ table, fields, rows, addLabel = "Add", empty = "Nothing yet.", i = 1 }: { table: string; fields: Field[]; rows: Row[]; addLabel?: string; empty?: string; i?: number }) {
  const save = saveRow.bind(null, table);
  const remove = removeRow.bind(null, table);
  const cols = fields.map((f) => f.w ?? "1fr").join(" ") + " auto";
  const grid = { gridTemplateColumns: cols } as React.CSSProperties;
  return (
    <div className="card enter overflow-x-auto" style={{ "--i": i } as React.CSSProperties}>
      <div className="min-w-[720px]">
        <div className="hidden gap-3 border-b border-[color:var(--ink-12)] px-5 py-3 sm:grid" style={grid}>
          {fields.map((f) => <span key={f.name} className="font-jak text-[12px] font-medium text-[color:var(--ink-60)]">{f.label}</span>)}
          <span />
        </div>
        {rows.length === 0 && <p className="t-sm px-5 py-4 text-[color:var(--ink-60)]">{empty}</p>}
        {rows.map((r) => (
          <div key={r.id} className="grid items-start gap-3 border-b border-[color:var(--ink-06)] px-5 py-3 hover:bg-[color:var(--ink-06)]" style={grid}>
            {fields.map((f) => <Input key={f.name} f={f} value={r[f.name]} form={`${table}-${r.id}`} />)}
            <div className="flex items-center gap-1">
              {/* inputs belong to the Save form through the form attribute; Delete is its own form */}
              <button form={`${table}-${r.id}`} className="btn btn-paper h-10 min-h-0 px-4 text-[13px]">Save</button>
              <form action={remove}>
                <input type="hidden" name="id" value={r.id} />
                <button className="btn btn-ghost h-10 min-h-0 text-[13px]" aria-label="Delete">Delete</button>
              </form>
            </div>
            <form id={`${table}-${r.id}`} action={save} className="hidden"><input type="hidden" name="id" value={r.id} /></form>
          </div>
        ))}
        <form action={save} className="grid items-start gap-3 bg-[color:var(--ink-06)] px-5 py-3" style={grid}>
          {fields.map((f) => <Input key={f.name} f={f} value={f.type === "bool" ? true : f.type === "select" ? f.options?.[0]?.value : ""} />)}
          <button className="btn btn-ink h-10 min-h-0 px-4 text-[13px]">{addLabel}</button>
        </form>
      </div>
    </div>
  );
}

export function Notice({ saved, error }: { saved?: string; error?: string }) {
  if (error) return <p className="t-sm mb-4 text-oxblood">{decodeURIComponent(error)}</p>;
  if (saved) return <p className="t-sm mb-4 text-[color:var(--ink-60)]">Saved.</p>;
  return null;
}

export function Section({ title, lede, children, id }: { title: string; lede?: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="mt-12 first:mt-0">
      <h2 className="font-jak text-[20px] font-semibold">{title}</h2>
      {lede && <p className="t-sm mt-1 max-w-[640px] text-[color:var(--ink-60)]">{lede}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
