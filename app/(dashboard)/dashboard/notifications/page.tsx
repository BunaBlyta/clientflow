"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { fetchJson } from "@/lib/fetch-json";
import { formatRelativeTime } from "@/lib/relative-time";
import { NOTIFICATION_ICON } from "@/lib/notification-meta";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/types";
import { Button } from "@/components/ui/button";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
              disabled
              className="cursor-not-allowed text-[13px] text-muted-foreground"
            >
              Mark all read
            </button>
            <p className="mt-1 text-[11px] text-muted-foreground">Read state is not wired up yet.</p>
          </div>
        )}
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread{unread.length > 0 ? ` (${unread.length})` : ""}</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <NotificationList
            notifications={sorted}
            emptyLabel="No notifications yet."
          />
        </TabsContent>
        <TabsContent value="unread" className="mt-4">
          <NotificationList
            notifications={unread}
            emptyLabel="You're all caught up."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NotificationList({
  notifications,
  emptyLabel,
}: {
  notifications: Notification[];
  emptyLabel: string;
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
            href={n.link ?? "/dashboard/notifications"}
            className={cn(
              "flex items-start gap-3 px-4 py-3.5 hover:bg-muted/40",
              !n.read && "bg-brand-accent/5"
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
