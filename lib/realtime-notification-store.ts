import { create } from "zustand";
import { fetchJson } from "@/lib/fetch-json";
import type { Notification } from "@/lib/types";

export type RealtimeConnectionState =
  | "connecting"
  | "connected"
  | "degraded"
  | "disabled";

export type RealtimeEntity = "invoice" | "project" | "note" | "request";

export interface EntityChangedEvent {
  entity: RealtimeEntity;
  projectId?: string;
  invoiceId?: string;
  reason: "payment" | "status" | "note" | "invoice";
}

export function sortNotifications(notifications: Notification[]): Notification[] {
  return [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/**
 * Merges a server snapshot or realtime event without ever adding duplicate IDs.
 * Server responses win for an existing ID because they contain authoritative
 * read state; remote events win over a locally cached version for the same reason.
 */
export function mergeNotifications(
  current: Notification[],
  incoming: Notification[],
): { notifications: Notification[]; addedIds: string[] } {
  const byId = new Map(current.map((notification) => [notification.id, notification]));
  const addedIds: string[] = [];

  for (const notification of incoming) {
    if (!byId.has(notification.id)) addedIds.push(notification.id);
    byId.set(notification.id, notification);
  }

  return { notifications: sortNotifications([...byId.values()]), addedIds };
}

export function isNotificationPayload(value: unknown): value is Notification {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Notification>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.userId === "string" &&
    typeof candidate.type === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.body === "string" &&
    typeof candidate.read === "boolean" &&
    typeof candidate.createdAt === "string"
  );
}

export function isEntityChangedEvent(value: unknown): value is EntityChangedEvent {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<EntityChangedEvent>;
  return (
    (candidate.entity === "invoice" ||
      candidate.entity === "project" ||
      candidate.entity === "note" ||
      candidate.entity === "request") &&
    (candidate.reason === "payment" ||
      candidate.reason === "status" ||
      candidate.reason === "note" ||
      candidate.reason === "invoice")
  );
}

function publishReadToOtherTabs(notificationId: string): void {
  if (typeof window === "undefined" || typeof window.BroadcastChannel === "undefined") return;

  try {
    const channel = new window.BroadcastChannel("clientflow:notifications");
    channel.postMessage({ type: "notification.read", notificationId });
    channel.close();
  } catch {
    // BroadcastChannel is an enhancement only. The API remains authoritative.
  }
}

interface NotificationStore {
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
  connectionState: RealtimeConnectionState;
  lastSyncedAt: string | null;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setConnectionState: (connectionState: RealtimeConnectionState) => void;
  replaceNotifications: (notifications: Notification[]) => void;
  mergeRemoteNotification: (notification: Notification) => boolean;
  setNotificationRead: (notification: Notification) => void;
  setReadLocally: (notificationId: string) => void;
  markNotificationRead: (notificationId: string) => Promise<Notification>;
  markAllNotificationsRead: (notificationIds: string[]) => Promise<Notification[]>;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  isLoading: true,
  error: null,
  connectionState: "connecting",
  lastSyncedAt: null,

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setConnectionState: (connectionState) => set({ connectionState }),

  replaceNotifications: (notifications) =>
    set((state) => ({
      // A GET can resolve after an Ably event has already arrived. Merge the
      // snapshot so that a stale response cannot erase a newer event; for IDs
      // present in both collections, the server response remains authoritative.
      notifications: mergeNotifications(state.notifications, notifications).notifications,
      isLoading: false,
      error: null,
      lastSyncedAt: new Date().toISOString(),
    })),

  mergeRemoteNotification: (notification) => {
    const { notifications, addedIds } = mergeNotifications(get().notifications, [notification]);
    set({ notifications, lastSyncedAt: new Date().toISOString() });
    return addedIds.includes(notification.id);
  },

  setNotificationRead: (notification) =>
    set((state) => ({
      notifications: state.notifications.map((current) =>
        current.id === notification.id ? notification : current,
      ),
    })),

  setReadLocally: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification,
      ),
    })),

  markNotificationRead: async (notificationId) => {
    const updated = await fetchJson<Notification>(
      `/api/notifications/${encodeURIComponent(notificationId)}`,
      "We couldn't mark this notification as read.",
      undefined,
      { method: "PATCH" },
    );
    get().setNotificationRead(updated);
    publishReadToOtherTabs(notificationId);
    return updated;
  },

  markAllNotificationsRead: async (notificationIds) => {
    const updated = await Promise.all(
      notificationIds.map((notificationId) =>
        fetchJson<Notification>(
          `/api/notifications/${encodeURIComponent(notificationId)}`,
          "We couldn't mark all notifications as read.",
          undefined,
          { method: "PATCH" },
        ),
      ),
    );
    const updatedById = new Map(updated.map((notification) => [notification.id, notification]));
    set((state) => ({
      notifications: state.notifications.map(
        (notification) => updatedById.get(notification.id) ?? notification,
      ),
    }));
    for (const notification of updated) publishReadToOtherTabs(notification.id);
    return updated;
  },
}));
