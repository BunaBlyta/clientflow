import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardRealtimeProvider } from "@/components/dashboard/realtime-provider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardRealtimeProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardRealtimeProvider>
  );
}
