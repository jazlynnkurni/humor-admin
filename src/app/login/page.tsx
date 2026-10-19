import { redirect } from "next/navigation";
import { GoogleButton } from "@/components/google-button";
import { getViewer } from "@/lib/admin";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const v = await getViewer();
  if (v) redirect(v.isSuperadmin ? "/" : "/denied");
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="eyebrow">Admin</p>
      <h1 className="t-h1">Sign in</h1>
      <p className="text-[color:var(--ink-60)]">Every page here is behind this wall. Only superadmins get through.</p>
      <GoogleButton />
      {error && <p className="t-sm text-oxblood">That sign-in didn&apos;t finish. Try once more.</p>}
    </main>
  );
}
