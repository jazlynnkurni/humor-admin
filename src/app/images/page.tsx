import { fetchImages, fmtTime, nameOf } from "@/lib/data";
import { Page } from "@/components/ui";
import { Notice, Section } from "@/components/crud";
import { deleteImage, removeAvatar, replaceImage, uploadImage } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Images" };

const kb = (n: number | null) => (n == null ? "" : n > 1024 * 1024 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

export default async function ImagesPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const sp = await searchParams;
  const { images, avatars } = await fetchImages();

  return (
    <Page eyebrow="Images" title={`${images.length} upload${images.length === 1 ? "" : "s"}, ${avatars.length} avatar${avatars.length === 1 ? "" : "s"}`} lede="Everything in Storage: images uploaded here, and the profile photos members uploaded themselves. Files live in buckets; only their URLs are in the database.">
      <Notice saved={sp.saved} error={sp.error} />

      <Section title="Upload an image" lede="JPEG, PNG, WebP, GIF or AVIF, up to 5 MB. It lands in the public images bucket.">
        <form action={uploadImage} className="card enter flex flex-col gap-4 p-6 sm:flex-row sm:items-end" style={{ "--i": 1 } as React.CSSProperties}>
          <label className="field flex-1"><span>File</span><input type="file" name="file" accept="image/*" required className="input min-h-0 py-2 text-[14px] file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-3 file:py-1 file:text-[12px] file:text-paper" /></label>
          <label className="field flex-1"><span>Alt text</span><input name="alt" className="input min-h-0 px-3 py-2 text-[14px]" placeholder="What is in the picture" /></label>
          <button className="btn btn-ink">Upload</button>
        </form>
      </Section>

      <Section title="Uploads" lede="Replace the file to change the picture at the same URL; edit the alt text; or delete it from the bucket.">
        {images.length === 0 && <p className="t-sm text-[color:var(--ink-60)]">Nothing uploaded yet.</p>}
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img, i) => (
            <li key={img.id} className="card enter overflow-hidden" style={{ "--i": 2 + i } as React.CSSProperties}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <a href={img.url} target="_blank" rel="noreferrer"><img src={img.url} alt={img.alt ?? ""} className="aspect-[4/3] w-full object-cover" /></a>
              <form action={replaceImage} className="flex flex-col gap-3 p-5">
                <input type="hidden" name="id" value={img.id} />
                <input name="alt" defaultValue={img.alt ?? ""} placeholder="Alt text" className="input min-h-0 px-3 py-2 text-[14px]" />
                <input type="file" name="file" accept="image/*" className="input min-h-0 py-2 text-[13px] file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-3 file:py-1 file:text-[12px] file:text-paper" />
                <p className="t-sm text-[color:var(--ink-60)]">{img.content_type?.replace("image/", "")} · {kb(img.size_bytes)} · {fmtTime(img.created_at)}</p>
                <div className="flex items-center justify-between">
                  <button className="btn btn-paper h-10 min-h-0 px-4 text-[13px]">Save</button>
                  <button formAction={deleteImage} className="btn btn-ghost h-10 min-h-0 text-[13px]">Delete</button>
                </div>
              </form>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Member avatars" lede="Uploaded by members on their profile page. Removing one deletes the file and clears their photo; they can upload another.">
        {avatars.length === 0 && <p className="t-sm text-[color:var(--ink-60)]">No member has a photo yet.</p>}
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {avatars.map((p, i) => (
            <li key={p.id} className="card enter flex items-center gap-3 p-4" style={{ "--i": 2 + images.length + i } as React.CSSProperties}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.avatar_url!} alt="" className="h-12 w-12 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{nameOf(p)}</p>
                <p className="t-sm truncate text-[color:var(--ink-60)]">{p.avatar_url!.includes("/avatars/") ? "in Storage" : "from Google"}</p>
              </div>
              <form action={removeAvatar}><input type="hidden" name="user_id" value={p.id} /><button className="btn btn-ghost h-9 min-h-0 text-[13px]">Remove</button></form>
            </li>
          ))}
        </ul>
      </Section>
    </Page>
  );
}
