"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FolderKanban, PanelLeftClose, PanelLeftOpen, Receipt, TrendingUp, Users } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

const navItems = [
  { href: "/dashboard", key: "nav.overview", icon: BarChart3, exact: true },
  { href: "/dashboard/projects", key: "nav.projects", icon: FolderKanban },
  { href: "/dashboard/clients", key: "nav.clients", icon: Users },
  { href: "/dashboard/invoices", key: "nav.invoices", icon: Receipt },
  { href: "/dashboard/analytics", key: "nav.analytics", icon: TrendingUp },
];

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const { t } = useLocale();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden h-dvh shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200 ease-out md:flex",
        collapsed ? "w-16" : "w-56",
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center",
          collapsed ? "justify-center px-4" : "px-6",
        )}
      >
        <Link
          href="/dashboard"
          className={cn(
            "flex min-w-0 items-center gap-2 text-[15px] font-semibold tracking-tight",
            collapsed && "shrink-0",
          )}
          aria-label="Clientflow overview"
        >
          <BrandLogo />
          <span className={cn("truncate transition-opacity duration-150", collapsed && "sr-only")}>
            Clientflow
          </span>
        </Link>
      </div>
      <nav className={cn("flex flex-col gap-5 pt-6", collapsed ? "px-2" : "px-4")}>
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? t(item.key) : undefined}
              className={cn(
                "crm-sidebar-link flex h-12 w-full items-center rounded-full bg-transparent text-[16px] font-normal text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
                collapsed ? "justify-center px-0" : "justify-start gap-4 px-3.5",
                isActive && "crm-sidebar-link-active bg-sidebar-accent font-medium text-foreground"
              )}
            >
              <item.icon className={cn("size-[18px]", isActive && "text-brand-accent")} />
              <span className={cn(collapsed && "sr-only")}>{t(item.key)}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-border">
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className="crm-sidebar-toggle h-12 w-full rounded-none hover:bg-sidebar-accent [&_svg]:size-5"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
      </div>
    </aside>
  );
}
