"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FolderKanban, Receipt, TrendingUp, Users } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

const navItems = [
  { href: "/dashboard", key: "nav.overview", icon: BarChart3, exact: true },
  { href: "/dashboard/projects", key: "nav.projects", icon: FolderKanban },
  { href: "/dashboard/clients", key: "nav.clients", icon: Users },
  { href: "/dashboard/invoices", key: "nav.invoices", icon: Receipt },
  { href: "/dashboard/analytics", key: "nav.analytics", icon: TrendingUp },
];

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden h-dvh w-56 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
      <div className="flex h-16 items-center px-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          <BrandLogo />
          Clientflow
        </Link>
      </div>
      <nav className="flex flex-col gap-3 px-4">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3.5 py-3 text-[15px] font-normal text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
                isActive && "bg-sidebar-accent font-medium text-foreground"
              )}
            >
              <item.icon className={cn("size-4", isActive && "text-brand-accent")} />
              {t(item.key)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
