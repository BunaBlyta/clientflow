"use client";

import Link from "next/link";
import { Bell, LogOut, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { currentStaffUser } from "@/lib/mock-data";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { NOTIFICATION_ICON } from "@/lib/notification-meta";
import { formatRelativeTime } from "@/lib/relative-time";

export function Topbar() {
  const notifications = useAppStore((s) => s.notifications);
  const markNotificationRead = useAppStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useAppStore((s) => s.markAllNotificationsRead);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="flex h-16 shrink-0 items-center justify-end gap-2 border-b border-border px-6">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="relative flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Notifications"
            />
          }
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-brand-accent" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 p-0">
          <div className="flex items-center justify-between px-3 py-2.5">
            <p className="text-[13px] font-medium text-foreground">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllNotificationsRead()}
                className="text-[12px] text-brand-accent hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <DropdownMenuSeparator className="m-0" />
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-[13px] text-muted-foreground">
                No notifications yet.
              </p>
            ) : (
              notifications.slice(0, 8).map((n) => {
                const Icon = NOTIFICATION_ICON[n.type];
                return (
                  <Link
                    key={n.id}
                    href={n.link ?? "/dashboard/notifications"}
                    onClick={() => markNotificationRead(n.id)}
                    className={cn(
                      "flex items-start gap-2.5 border-b border-border px-3 py-2.5 last:border-0 hover:bg-muted",
                      !n.read && "bg-brand-accent/5"
                    )}
                  >
                    <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{n.title}</p>
                      <p className="truncate text-[12px] text-muted-foreground">{n.body}</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatRelativeTime(n.createdAt)}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
          <DropdownMenuSeparator className="m-0" />
          <Link
            href="/dashboard/notifications"
            className="block px-3 py-2.5 text-center text-[13px] text-brand-accent hover:underline"
          >
            View all
          </Link>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="sm" className="gap-2 px-1.5" />}
        >
          <Avatar className="size-6">
            <AvatarFallback className="text-[11px]">
              {initials(currentStaffUser.name)}
            </AvatarFallback>
          </Avatar>
          <span className="text-[13px]">{currentStaffUser.name}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <p className="px-2 py-1.5 text-[12px] font-normal text-muted-foreground">
            {currentStaffUser.email}
          </p>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
            <Settings className="size-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/" />}>
            <LogOut className="size-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

