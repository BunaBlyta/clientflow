import Link from "next/link";
import { Button } from "@/components/ui/button";

const links = [
  { href: "#packages", label: "Packages" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#contact", label: "Contact" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-[15px] font-semibold tracking-tight">
          Clientflow
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-normal text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="hidden text-sm font-normal text-muted-foreground hover:text-foreground sm:inline"
          >
            Staff login
          </Link>
          <Button size="sm" render={<a href="#packages" />}>
            Start a project
          </Button>
        </div>
      </div>
    </header>
  );
}
