"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LoaderCircle, LogOut, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { currentStaffUser } from "@/lib/mock-data";
import { fetchJson } from "@/lib/fetch-json";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { NOTIFICATION_ICON } from "@/lib/notification-meta";
import { formatRelativeTime } from "@/lib/relative-time";
import type { Notification } from "@/lib/types";

export function Topbar() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Logout request failed.");
    } catch {
      // Leave the dashboard immediately even if the request cannot complete.
      // The next request will let middleware re-evaluate the session state.
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  const loadNotifications = useCallback(async (signal?: AbortSignal) => {
    try {
      const notificationData = await fetchJson<Notification[]>(
        "/api/notifications",
        "We couldn't load notifications.",
        signal,
      );
      if (!Array.isArray(notificationData)) throw new Error("We couldn't load notifications.");
      if (!signal?.aborted) setNotifications(notificationData);
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === "AbortError") return;
      if (!signal?.aborted) {
        setError(caughtError instanceof Error ? caughtError.message : "We couldn't load notifications.");
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => loadNotifications(controller.signal));
    return () => controller.abort();
  }, [loadNotifications]);

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
              <span className="text-[11px] text-muted-foreground">Read state is not wired up yet.</span>
            )}
          </div>
          <DropdownMenuSeparator className="m-0" />
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 px-3 py-6 text-[13px] text-muted-foreground">
                <LoaderCircle className="size-3.5 animate-spin text-brand-accent" />
                Loading…
              </div>
            ) : error ? (
              <p className="px-3 py-6 text-center text-[13px] text-status-danger">{error}</p>
            ) : notifications.length === 0 ? (
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
          <DropdownMenuItem onClick={() => void handleLogout()} disabled={isLoggingOut}>
            {isLoggingOut ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <LogOut className="size-4" />
            )}
            {isLoggingOut ? "Logging out…" : "Log out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
