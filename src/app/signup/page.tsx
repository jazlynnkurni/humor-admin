import { fetchSignup } from "@/lib/data";
import { Page } from "@/components/ui";
import { Notice, RowEditor, Section } from "@/components/crud";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign-up" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const sp = await searchParams;
  const { domains, emails } = await fetchSignup();
  const open = !domains.some((d) => d.enabled) && !emails.some((e) => e.enabled);

  return (
    <Page eyebrow="Sign-up" title="Who may sign in" lede={open ? "Both lists are empty, so anyone with a Google account can sign in. Add a domain or an address to close the door." : "A Google account gets in if its domain is listed here or its exact address is whitelisted. Everyone else is signed straight back out with a note. Superadmins always get in."}>
      <Notice saved={sp.saved} error={sp.error} />
      <Section title="Allowed sign-up domains" lede="The part after the @.">
        <RowEditor
          table="allowed_signup_domains" i={1} addLabel="Add domain" empty="No domains yet."
          rows={domains}
          fields={[
            { name: "domain", label: "Domain", w: "1fr", mono: true, placeholder: "columbia.edu" },
            { name: "note", label: "Note", w: "2fr" },
            { name: "enabled", label: "On", type: "bool", w: "auto" },
          ]}
        />
      </Section>
      <Section title="Whitelisted email addresses" lede="Exact addresses allowed in regardless of domain.">
        <RowEditor
          table="whitelisted_emails" i={2} addLabel="Add address" empty="No addresses yet."
          rows={emails}
          fields={[
            { name: "email", label: "Email", w: "1fr", mono: true, placeholder: "someone@gmail.com" },
            { name: "note", label: "Note", w: "2fr" },
            { name: "enabled", label: "On", type: "bool", w: "auto" },
          ]}
        />
      </Section>
    </Page>
  );
}
