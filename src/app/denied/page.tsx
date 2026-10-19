import { redirect } from "next/navigation";
import { getViewer } from "@/lib/admin";

export const metadata = { title: "Not an admin" };

export default async function DeniedPage() {
  const v = await getViewer();
  if (!v) redirect("/login");
  if (v.isSuperadmin) redirect("/");
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="eyebrow">Admin</p>
      <h1 className="t-h1">Not an admin.</h1>
      <p className="text-[color:var(--ink-60)]">
        You are signed in as {v.email}, but this account does not carry the superadmin flag. The flag is set in the database by its owner, not from this app.
      </p>
      <form action="/auth/signout" method="post">
        <button className="btn btn-paper">Sign out</button>
      </form>
    </main>
  );
}
