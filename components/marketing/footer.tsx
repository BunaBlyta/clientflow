import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-[13px] text-muted-foreground">
          &copy; {new Date().getFullYear()} Clientflow Studio. All rights reserved.
        </p>
        <div className="flex items-center gap-6">
          <a href="#packages" className="text-[13px] text-muted-foreground hover:text-foreground">
            Packages
          </a>
          <a href="#contact" className="text-[13px] text-muted-foreground hover:text-foreground">
            Contact
          </a>
          <Link href="/login" className="text-[13px] text-muted-foreground hover:text-foreground">
            Staff login
          </Link>
        </div>
      </div>
    </footer>
  );
}
