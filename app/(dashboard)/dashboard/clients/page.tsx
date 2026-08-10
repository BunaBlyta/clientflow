"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Send } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { clientTotalBilledCents } from "@/lib/mock-data";
import { formatCurrency, formatDate, initials } from "@/lib/format";
import { TableToolbar } from "@/components/dashboard/table-toolbar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function ClientsPage() {
  const clients = useAppStore((s) => s.clients);
  const projects = useAppStore((s) => s.projects);
  const resendInvite = useAppStore((s) => s.resendInvite);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return clients
      .filter((c) => {
        const haystack = `${c.companyName} ${c.contactName} ${c.email}`.toLowerCase();
        return haystack.includes(search.toLowerCase());
      })
      .sort((a, b) => a.companyName.localeCompare(b.companyName));
  }, [clients, search]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-[22px]">Clients</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Every business with an active or past engagement.
        </p>
      </div>

      <TableToolbar search={search} onSearchChange={setSearch} placeholder="Search clients..." />

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
              <th className="px-4 py-2.5 font-normal">Client</th>
              <th className="px-4 py-2.5 font-normal">Contact</th>
              <th className="px-4 py-2.5 font-normal">Projects</th>
              <th className="px-4 py-2.5 text-right font-normal">Total billed</th>
              <th className="px-4 py-2.5 text-right font-normal">Client since</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((client) => {
              const clientProjects = projects.filter((p) => p.clientId === client.id);
              return (
                <tr key={client.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-7">
                        <AvatarFallback className="text-[11px]">
                          {initials(client.companyName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{client.companyName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <p>{client.contactName}</p>
                    <p className="text-[12px]">{client.email}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{clientProjects.length}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatCurrency(clientTotalBilledCents(client.id))}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatDate(client.createdAt)}
                  </td>
                  <td className="px-2 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => {
                            resendInvite(client.id);
                            toast.success(`Invitation resent to ${client.email}`);
                          }}
                        >
                          <Send />
                          Resend app invitation
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No clients match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
