"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="crm-shell h-dvh min-h-0 overflow-hidden">
      <Sidebar
        collapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
      />
      <div
        className={cn(
          "flex h-full min-w-0 flex-col transition-[padding-left] duration-200 ease-out",
          isSidebarCollapsed ? "md:pl-16" : "md:pl-56",
        )}
      >
        <Topbar />
        <main data-crm-scroll className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
