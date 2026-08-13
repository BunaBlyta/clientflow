import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-dvh min-h-0 overflow-hidden">
      <Sidebar />
      <div className="flex h-full min-w-0 flex-col md:pl-56">
        <Topbar />
        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
