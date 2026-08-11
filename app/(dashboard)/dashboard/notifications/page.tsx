"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { formatRelativeTime } from "@/lib/relative-time";
import { NOTIFICATION_ICON } from "@/lib/notification-meta";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/types";

export default function NotificationsPage() {
  const notifications = useAppStore((s) => s.notifications);
  const markNotificationRead = useAppStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useAppStore((s) => s.markAllNotificationsRead);

  const sorted = useMemo(
    () =>
      [...notifications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [notifications]
  );
  const unread = sorted.filter((n) => !n.read);

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
          <button
            onClick={() => markAllNotificationsRead()}
            className="text-[13px] text-brand-accent hover:underline"
          >
            Mark all read
          </button>
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
            onRead={markNotificationRead}
          />
        </TabsContent>
        <TabsContent value="unread" className="mt-4">
          <NotificationList
            notifications={unread}
            emptyLabel="You're all caught up."
            onRead={markNotificationRead}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NotificationList({
  notifications,
  emptyLabel,
  onRead,
}: {
  notifications: Notification[];
  emptyLabel: string;
  onRead: (id: string) => void;
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
            onClick={() => onRead(n.id)}
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
