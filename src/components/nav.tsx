import Link from "next/link";
import { getViewer } from "@/lib/admin";
import { NavPill, type NavItem } from "./nav-pill";

export async function Nav() {
  const v = await getViewer();
  const items: NavItem[] = v?.isSuperadmin
    ? [
        { href: "/", label: "Overview" },
        { href: "/users", label: "Users" },
        { href: "/media", label: "Media" },
        { href: "/requests", label: "Requests" },
        { href: "/prompts", label: "Prompts" },
        { href: "/models", label: "Models" },
        { href: "/signup", label: "Sign-up", smHide: true },
        { href: "/images", label: "Images", smHide: true },
        { href: "/votes", label: "Votes", smHide: true },
        { signout: true },
      ]
    : v ? [{ signout: true }] : [{ href: "/login", label: "Sign in" }];
  return (
    <nav className="nav">
      <div className="in mx-auto max-w-7xl px-6 md:px-16">
        <Link href="/" className="mark">
          <span className="word">Columbia Laughs</span>
          <span className="rounded-full bg-oxblood px-2 py-0.5 text-[11px] font-medium text-paper">admin</span>
        </Link>
        <NavPill items={items} />
      </div>
    </nav>
  );
}
