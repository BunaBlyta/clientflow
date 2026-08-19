"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Bell, LoaderCircle, LogOut, Settings } from "lucide-react";
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
import { LanguageSelect } from "@/components/language-select";
import { ThemeToggle } from "@/components/theme-toggle";
import { useLocale } from "@/lib/i18n";
import type { Notification } from "@/lib/types";
import { useNotificationStore } from "@/lib/realtime-notification-store";

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "STAFF";
};

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLocale();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);
  const notifications = useNotificationStore((state) => state.notifications);
  const isLoading = useNotificationStore((state) => state.isLoading);
  const error = useNotificationStore((state) => state.error);
  const markNotificationRead = useNotificationStore((state) => state.markNotificationRead);
  const [markingNotificationId, setMarkingNotificationId] = useState<string | null>(null);
  const [notificationActionError, setNotificationActionError] = useState<string | null>(null);
  const [openedNotificationIds, setOpenedNotificationIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const scrollContainer = document.querySelector<HTMLElement>("[data-crm-scroll]");
    if (!scrollContainer) return;

    const handleScroll = () => setIsCompact(scrollContainer.scrollTop > 8);
    handleScroll();
    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });

    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

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

  const hasUnopenedUnreadNotifications = notifications.some(
    (notification) => !notification.read && !openedNotificationIds.has(notification.id),
  );

  const pageMeta =
    pathname === "/dashboard"
      ? { title: t("dashboard.overview"), description: t("dashboard.overviewIntro") }
      : pathname.startsWith("/dashboard/analytics")
        ? { title: t("dashboard.analytics"), description: t("dashboard.analyticsIntro") }
        : pathname.startsWith("/dashboard/projects") || pathname.startsWith("/dashboard/requests") || pathname.startsWith("/dashboard/inquiries")
          ? { title: t("dashboard.projects"), description: t("dashboard.projectsIntro") }
          : pathname.startsWith("/dashboard/clients")
            ? { title: t("dashboard.clients"), description: t("clients.intro") }
            : pathname.startsWith("/dashboard/invoices")
              ? { title: t("dashboard.invoices"), description: t("invoices.intro") }
              : pathname.startsWith("/dashboard/notifications")
                ? { title: t("dashboard.notifications"), description: t("notifications.intro") }
                : { title: t("dashboard.overview"), description: t("dashboard.overviewIntro") };

  const handleMarkNotificationRead = useCallback(async (notificationId: string) => {
    setMarkingNotificationId(notificationId);
    setNotificationActionError(null);

    try {
      await markNotificationRead(notificationId);
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
  }, [markNotificationRead]);

  function handleNotificationClick(
    event: React.MouseEvent<HTMLElement>,
    notification: Notification,
  ) {
    event.preventDefault();
    if (markingNotificationId === notification.id) return;
    router.push(getNotificationDestination(notification));
    if (!notification.read) void handleMarkNotificationRead(notification.id);
  }

  const handleNotificationsOpenChange = useCallback((open: boolean) => {
    setIsNotificationsOpen(open);
    if (!open) return;

    setOpenedNotificationIds((openedIds) => {
      const nextOpenedIds = new Set(openedIds);
      notifications.forEach((notification) => nextOpenedIds.add(notification.id));
      return nextOpenedIds;
    });
  }, [notifications]);

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
    <header
      className={cn(
        "sticky top-0 z-30 flex shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-6 transition-[height] duration-200 ease-out",
        isCompact ? "h-12" : "h-16",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <h1 className="shrink-0 truncate text-[15px] font-semibold tracking-tight text-foreground">
          {pageMeta.title}
        </h1>
        <span aria-hidden className="shrink-0 leading-none text-[12px] text-muted-foreground/70">•</span>
        <p className="min-w-0 truncate text-[13px] leading-4 text-muted-foreground">{pageMeta.description}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="crm-header-language flex items-center gap-2">
          <LanguageSelect
            compact
            triggerClassName="!size-9 !justify-center !rounded-md !bg-transparent transition-colors hover:!bg-muted hover:!text-foreground"
          />
          <ThemeToggle />
        </div>
        <DropdownMenu
          open={isNotificationsOpen}
          onOpenChange={(open) => void handleNotificationsOpenChange(open)}
        >
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="relative flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={t("nav.notifications")}
            />
          }
        >
          <Bell className="size-5" />
          {hasUnopenedUnreadNotifications && (
            <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-brand-accent" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="notifications-menu w-[24rem] p-0">
          <div className="notifications-menu-header flex items-center justify-between px-4 py-3">
            <p className="text-[13px] font-medium text-foreground">{t("nav.notifications")}</p>
            <Link
              href="/dashboard/notifications"
              onClick={() => setIsNotificationsOpen(false)}
              className="flex items-center gap-1 rounded-full px-3 py-2 text-[11px] font-medium text-brand-accent transition-colors hover:bg-muted hover:text-foreground"
            >
              {t("notifications.viewAll")}
              <ArrowRight className="size-3" />
            </Link>
          </div>
          <DropdownMenuSeparator className="m-0" />
          {notificationActionError && (
            <p role="alert" className="border-b border-status-danger/30 bg-status-danger/5 px-3 py-2 text-[12px] text-status-danger">
              {notificationActionError}
            </p>
          )}
          <div className="scrollbar-none max-h-[27rem] overflow-y-auto">
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
                      "notification-menu-item mx-0 flex items-start gap-3 rounded-none border-b border-border px-4 py-4 hover:bg-transparent focus:bg-transparent data-highlighted:bg-transparent last:border-0",
                      markingNotificationId === n.id && "pointer-events-none opacity-60",
                    )}
                  >
                    <Icon className={cn("notification-icon", !n.read && "notification-icon-unread")} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] leading-5 font-medium">{n.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-[12px] leading-4.5 text-muted-foreground">{n.body}</p>
                    </div>
                    <span className="shrink-0 self-center text-[11px] text-muted-foreground">
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
          render={
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-1.5 hover:!bg-transparent aria-expanded:!bg-transparent"
              aria-label={currentUser?.name ?? "Account"}
            />
          }
        >
          <Avatar className="size-8">
            <AvatarFallback className="text-[11px]">
              {isLoadingUser ? <LoaderCircle className="size-3 animate-spin" /> : initials(currentUser?.name ?? "?")}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="flex items-center gap-3 px-3 py-3">
            <Avatar className="size-9">
              <AvatarFallback className="text-[12px]">
                {isLoadingUser ? <LoaderCircle className="size-3.5 animate-spin" /> : initials(currentUser?.name ?? "?")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-foreground">
                {isLoadingUser ? t("common.loading") : currentUser?.name ?? "Account unavailable"}
              </p>
              <p className="truncate text-[12px] text-muted-foreground">
                {currentUser?.email ?? t("common.unknown")}
              </p>
            </div>
          </div>
          {userError ? (
            <>
              <p role="alert" className="px-3 py-1.5 text-[12px] font-normal text-status-danger">
                {userError}
              </p>
              <DropdownMenuItem onClick={() => void loadCurrentUser()}>
                {t("common.tryAgain")}
              </DropdownMenuItem>
            </>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-4 py-4 pl-3 text-[13px] font-medium" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="size-5" />
            {t("dashboard.settings")}
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-4 py-4 pl-3 text-[13px] font-medium" onClick={() => void handleLogout()} disabled={isLoggingOut}>
            {isLoggingOut ? (
              <LoaderCircle className="size-5 animate-spin" />
            ) : (
              <LogOut className="size-5" />
            )}
            {isLoggingOut ? t("common.loading") : t("common.logOut")}
          </DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </header>
  );
}
