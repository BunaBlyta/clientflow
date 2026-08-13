"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { fetchJson } from "@/lib/fetch-json";
import { formatRelativeTime } from "@/lib/relative-time";
import { NOTIFICATION_ICON } from "@/lib/notification-meta";
import { getNotificationDestination } from "@/lib/notification-destination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/types";
import { Button } from "@/components/ui/button";

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const loadNotifications = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      const notificationData = await fetchJson<Notification[]>(
        "/api/notifications",
        "We couldn't load the notifications.",
        signal,
      );
      if (!Array.isArray(notificationData)) {
        throw new Error("The server returned an unexpected notifications response.");
      }
      if (!signal?.aborted) setNotifications(notificationData);
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === "AbortError") return;
      if (!signal?.aborted) {
        setError(caughtError instanceof Error ? caughtError.message : "We couldn't load the notifications.");
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

  const sorted = useMemo(
    () =>
      [...notifications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [notifications]
  );
  const unread = sorted.filter((n) => !n.read);

  const markNotificationRead = useCallback(async (notificationId: string) => {
    setMarkingId(notificationId);
    setActionError(null);

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
      setActionError(
        caughtError instanceof Error
          ? caughtError.message
          : "We couldn't mark this notification as read.",
      );
      return false;
    } finally {
      setMarkingId(null);
    }
  }, []);

  async function markAllNotificationsRead() {
    const unreadIds = unread.map((notification) => notification.id);
    if (unreadIds.length === 0) return;

    setIsMarkingAll(true);
    setActionError(null);
    try {
      const updatedNotifications = await Promise.all(
        unreadIds.map((notificationId) =>
          fetchJson<Notification>(
            `/api/notifications/${encodeURIComponent(notificationId)}`,
            "We couldn't mark all notifications as read.",
            undefined,
            { method: "PATCH" },
          ),
        ),
      );
      const updatedById = new Map(updatedNotifications.map((notification) => [notification.id, notification]));
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => updatedById.get(notification.id) ?? notification),
      );
    } catch (caughtError) {
      setActionError(
        caughtError instanceof Error
          ? caughtError.message
          : "We couldn't mark all notifications as read.",
      );
      void loadNotifications();
    } finally {
      setIsMarkingAll(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-56 items-center justify-center border border-border">
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin text-brand-accent" />
          Loading notifications…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center border border-status-danger/30 px-6 text-center">
        <p className="text-[13px] font-medium text-status-danger">Notifications couldn&apos;t load</p>
        <p className="mt-1 max-w-sm text-[12px] text-muted-foreground">{error}</p>
        <Button className="mt-4" variant="outline" size="sm" onClick={() => void loadNotifications()}>
          <RefreshCw />
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-[22px]">Notifications</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Everything that needs your attention across requests, invoices, and projects.
          </p>
        </div>
        {unread.length > 0 && (
          <div className="text-right">
            <button
              type="button"
              disabled={isMarkingAll || markingId !== null}
              onClick={() => void markAllNotificationsRead()}
              className="text-[13px] text-brand-accent hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground"
            >
              {isMarkingAll ? "Marking…" : "Mark all read"}
            </button>
          </div>
        )}
      </div>

      {actionError && (
        <p role="alert" className="border border-status-danger/30 bg-status-danger/5 px-3 py-2.5 text-[13px] text-status-danger">
          {actionError}
        </p>
      )}

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread{unread.length > 0 ? ` (${unread.length})` : ""}</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <NotificationList
            notifications={sorted}
            emptyLabel="No notifications yet."
            markingId={markingId}
            onRead={(notification) => {
              router.push(getNotificationDestination(notification));
              if (!notification.read) void markNotificationRead(notification.id);
            }}
          />
        </TabsContent>
        <TabsContent value="unread" className="mt-4">
          <NotificationList
            notifications={unread}
            emptyLabel="You're all caught up."
            markingId={markingId}
            onRead={(notification) => {
              router.push(getNotificationDestination(notification));
              void markNotificationRead(notification.id);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NotificationList({
  notifications,
  emptyLabel,
  markingId,
  onRead,
}: {
  notifications: Notification[];
  emptyLabel: string;
  markingId: string | null;
  onRead: (notification: Notification) => void;
}) {
  if (notifications.length === 0) {
    return (
      <div className="rounded-lg border border-border">
        <p className="px-4 py-10 text-center text-[13px] text-muted-foreground">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
      {notifications.map((n) => {
        const Icon = NOTIFICATION_ICON[n.type];
        return (
          <Link
            key={n.id}
            href={getNotificationDestination(n)}
            onClick={(event) => {
              event.preventDefault();
              if (markingId === n.id) return;
              onRead(n);
            }}
            aria-disabled={markingId === n.id}
            className={cn(
              "flex items-start gap-3 px-4 py-3.5 hover:bg-muted/40",
              !n.read && "bg-brand-accent/5",
              markingId === n.id && "pointer-events-none opacity-60",
            )}
          >
            <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium">{n.title}</p>
              <p className="text-[13px] text-muted-foreground">{n.body}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-[12px] text-muted-foreground">{formatRelativeTime(n.createdAt)}</span>
              {!n.read && <span className="size-1.5 rounded-full bg-brand-accent" />}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
