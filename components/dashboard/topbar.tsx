"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LoaderCircle, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { fetchJson } from "@/lib/fetch-json";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { NOTIFICATION_ICON } from "@/lib/notification-meta";
import { getNotificationDestination } from "@/lib/notification-destination";
import { formatRelativeTime } from "@/lib/relative-time";
import { SettingsDialog } from "@/components/dashboard/settings-dialog";
import { useLocale } from "@/lib/i18n";
import type { Notification } from "@/lib/types";

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "STAFF";
};

export function Topbar() {
  const router = useRouter();
  const { t } = useLocale();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingNotificationId, setMarkingNotificationId] = useState<string | null>(null);
  const [notificationActionError, setNotificationActionError] = useState<string | null>(null);
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

  const markNotificationRead = useCallback(async (notificationId: string) => {
    setMarkingNotificationId(notificationId);
    setNotificationActionError(null);

    try {
      const updatedNotification = await fetchJson<Notification>(
        `/api/notifications/${encodeURIComponent(notificationId)}`,
        "We couldn't mark this notification as read.",
        undefined,
        { method: "PATCH" },
      );
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) =>
          notification.id === updatedNotification.id ? updatedNotification : notification,
        ),
      );
      return true;
    } catch (caughtError) {
      setNotificationActionError(
        caughtError instanceof Error
          ? caughtError.message
          : "We couldn't mark this notification as read.",
      );
      return false;
    } finally {
      setMarkingNotificationId(null);
    }
  }, []);

  function handleNotificationClick(
    event: React.MouseEvent<HTMLElement>,
    notification: Notification,
  ) {
    event.preventDefault();
    if (markingNotificationId === notification.id) return;
    router.push(getNotificationDestination(notification));
    if (!notification.read) void markNotificationRead(notification.id);
  }

  const loadCurrentUser = useCallback(async (signal?: AbortSignal) => {
    setIsLoadingUser(true);
    setUserError(null);

    try {
      const user = await fetchJson<CurrentUser>(
        "/api/auth/me",
        "We couldn't load your account.",
        signal,
      );

      if (
        !user ||
        typeof user.id !== "string" ||
        typeof user.name !== "string" ||
        typeof user.email !== "string" ||
        user.role !== "STAFF"
      ) {
        throw new Error("The server returned an unexpected account response.");
      }

      if (!signal?.aborted) setCurrentUser(user);
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === "AbortError") return;
      if (!signal?.aborted) {
        setUserError(caughtError instanceof Error ? caughtError.message : "We couldn't load your account.");
      }
    } finally {
      if (!signal?.aborted) setIsLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => loadCurrentUser(controller.signal));
    return () => controller.abort();
  }, [loadCurrentUser]);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-end gap-2 border-b border-border bg-background px-6">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="relative flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={t("nav.notifications")}
            />
          }
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-brand-accent" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="notifications-menu w-[22rem] p-0">
          <div className="notifications-menu-header flex items-center justify-between px-4 py-3">
            <p className="text-[13px] font-medium text-foreground">{t("nav.notifications")}</p>
            <Link
              href="/dashboard/notifications"
              className="rounded-md px-2 py-1 text-[11px] font-medium text-brand-accent transition-colors hover:bg-muted hover:text-foreground"
            >
              {t("notifications.viewAll")}
            </Link>
          </div>
          <DropdownMenuSeparator className="m-0" />
          {notificationActionError && (
            <p role="alert" className="border-b border-status-danger/30 bg-status-danger/5 px-3 py-2 text-[12px] text-status-danger">
              {notificationActionError}
            </p>
          )}
          <div className="scrollbar-none max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 px-3 py-6 text-[13px] text-muted-foreground">
                <LoaderCircle className="size-3.5 animate-spin text-brand-accent" />
                {t("common.loading")}
              </div>
            ) : error ? (
              <p className="px-3 py-6 text-center text-[13px] text-status-danger">{error}</p>
            ) : notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-[13px] text-muted-foreground">
                {t("notifications.noNotifications")}
              </p>
            ) : (
              notifications.slice(0, 8).map((n) => {
                const Icon = NOTIFICATION_ICON[n.type];
                return (
                  <DropdownMenuItem
                    key={n.id}
                    render={<Link href={getNotificationDestination(n)} />}
                    onClick={(event) => handleNotificationClick(event, n)}
                    aria-disabled={markingNotificationId === n.id}
                    className={cn(
                      "notification-menu-item flex items-start gap-3 border-b border-border px-4 py-3 last:border-0 hover:bg-transparent",
                      markingNotificationId === n.id && "pointer-events-none opacity-60",
                    )}
                  >
                    <Icon className={cn("notification-icon", !n.read && "notification-icon-unread")} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] leading-5 font-medium">{n.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-[12px] leading-4.5 text-muted-foreground">{n.body}</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatRelativeTime(n.createdAt)}
                    </span>
                  </DropdownMenuItem>
                );
              })
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="sm" className="gap-2 px-1.5" />}
        >
          <Avatar className="size-6">
            <AvatarFallback className="text-[11px]">
              {isLoadingUser ? <LoaderCircle className="size-3 animate-spin" /> : initials(currentUser?.name ?? "?")}
            </AvatarFallback>
          </Avatar>
          <span className="text-[13px]">
            {isLoadingUser ? "Loading…" : currentUser?.name ?? "Account unavailable"}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {userError ? (
            <>
              <p role="alert" className="px-2 py-1.5 text-[12px] font-normal text-status-danger">
                {userError}
              </p>
              <DropdownMenuItem onClick={() => void loadCurrentUser()}>
                {t("common.tryAgain")}
              </DropdownMenuItem>
            </>
          ) : (
            <p className="px-2 py-1.5 text-[12px] font-normal text-muted-foreground">
              {isLoadingUser ? t("common.loading") : currentUser?.email ?? t("common.unknown")}
            </p>
          )}
          <DropdownMenuSeparator />
          <SettingsDialog />
          <DropdownMenuItem onClick={() => void handleLogout()} disabled={isLoggingOut}>
            {isLoggingOut ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <LogOut className="size-4" />
            )}
            {isLoggingOut ? t("common.loading") : t("common.logOut")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
