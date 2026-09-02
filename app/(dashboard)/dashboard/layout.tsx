import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardRealtimeProvider } from "@/components/dashboard/realtime-provider";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardRealtimeProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardRealtimeProvider>
  );
}
