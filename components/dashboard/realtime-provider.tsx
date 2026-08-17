"use client";

import { Realtime } from "ably";
import type { InboundMessage, TokenRequest, TokenDetails } from "ably";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { fetchJson } from "@/lib/fetch-json";
import {
  isEntityChangedEvent,
  isNotificationPayload,
  useNotificationStore,
} from "@/lib/realtime-notification-store";

type CurrentUser = {
  id: string;
  role: "STAFF" | "CLIENT";
};

type RealtimeEventDetail = {
  entity: "invoice" | "project" | "note";
  projectId?: string;
  invoiceId?: string;
  reason: "payment" | "status" | "note" | "invoice";
};

function decodeMessageData(data: unknown): unknown {
  if (typeof data !== "string") return data;
  try {
    return JSON.parse(data) as unknown;
  } catch {
    return null;
  }
}

function tokenFromResponse(value: unknown): TokenRequest | TokenDetails | string | null {
  if (!value || typeof value !== "object") {
    return typeof value === "string" ? value : null;
  }

  const response = value as { tokenRequest?: unknown; tokenDetails?: unknown; token?: unknown };
  const token = response.tokenRequest ?? response.tokenDetails ?? response.token ?? value;
  return token as TokenRequest | TokenDetails | string;
}

function notifyEntityChanged(detail: RealtimeEventDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<RealtimeEventDetail>("clientflow:entity-changed", { detail }));
}

export function DashboardRealtimeProvider({ children }: { children: React.ReactNode }) {
  const realtimeRef = useRef<Realtime | null>(null);
  const entityTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const setLoading = useNotificationStore((state) => state.setLoading);
  const setError = useNotificationStore((state) => state.setError);
  const setConnectionState = useNotificationStore((state) => state.setConnectionState);
  const replaceNotifications = useNotificationStore((state) => state.replaceNotifications);
  const mergeRemoteNotification = useNotificationStore((state) => state.mergeRemoteNotification);
  const setReadLocally = useNotificationStore((state) => state.setReadLocally);

  const loadNotifications = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await fetchJson<unknown>(
        "/api/notifications",
        "We couldn't load notifications.",
        signal,
      );
      if (!Array.isArray(data)) throw new Error("We couldn't load notifications.");
      replaceNotifications(data);
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === "AbortError") return;
      if (!signal?.aborted) {
        setError(caughtError instanceof Error ? caughtError.message : "We couldn't load notifications.");
        setLoading(false);
      }
    }
  }, [replaceNotifications, setError, setLoading]);

  useEffect(() => {
    let disposed = false;
    let degradedPolling: ReturnType<typeof setInterval> | null = null;
    const controller = new AbortController();
    const entityTimers = entityTimersRef.current;

    const sync = () => {
      if (!disposed) void loadNotifications();
    };

    const scheduleEntityRefetch = (detail: RealtimeEventDetail) => {
      const key = `${detail.entity}:${detail.projectId ?? detail.invoiceId ?? "all"}`;
      const existingTimer = entityTimers.get(key);
      if (existingTimer) clearTimeout(existingTimer);
      entityTimers.set(
        key,
        setTimeout(() => {
          entityTimers.delete(key);
          notifyEntityChanged(detail);
        }, 180),
      );
    };

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "hidden") return;
      sync();
    };

    const handleBroadcastMessage = (event: MessageEvent<unknown>) => {
      const message = event.data as { type?: unknown; notificationId?: unknown } | null;
      if (message?.type === "notification.read" && typeof message.notificationId === "string") {
        setReadLocally(message.notificationId);
      }
    };

    const start = async () => {
      setConnectionState("connecting");
      try {
        const currentUser = await fetchJson<CurrentUser>(
          "/api/auth/me",
          "We couldn't load your account.",
          controller.signal,
        );
        if (disposed || currentUser.role !== "STAFF") {
          setConnectionState("disabled");
          return;
        }

        const realtime = new Realtime({
          authCallback: (_params, callback) => {
            fetch("/api/realtime/token", { credentials: "include", cache: "no-store" })
              .then(async (response) => {
                const payload = (await response.json().catch(() => null)) as unknown;
                if (!response.ok) {
                  const message =
                    payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
                      ? payload.error
                      : "Realtime authentication failed.";
                  throw new Error(message);
                }
                return tokenFromResponse(payload);
              })
              .then((token) => {
                if (!token) throw new Error("Realtime authentication returned no token.");
                callback(null, token);
              })
              .catch((error: unknown) => {
                console.error("Clientflow realtime authentication failed", {
                  message: error instanceof Error ? error.message : "Unknown authentication error",
                });
                callback(error instanceof Error ? error.message : "Realtime authentication failed.", null);
              });
          },
        });
        realtimeRef.current = realtime;

        const handleConnectionState = (change: { current: string }) => {
          if (change.current === "connected") {
            setConnectionState("connected");
            sync();
            return;
          }
          if (["failed", "suspended", "disconnected"].includes(change.current)) {
            setConnectionState("degraded");
            console.error("Clientflow realtime connection degraded", { state: change.current });
          } else if (change.current === "connecting") {
            setConnectionState("connecting");
          }
        };
        realtime.connection.on(handleConnectionState);

        const handleMessage = (message: InboundMessage) => {
          const payload = decodeMessageData(message.data);
          if (message.name === "notification.created" && isNotificationPayload(payload)) {
            if (mergeRemoteNotification(payload)) {
              toast(payload.title, { description: payload.body, duration: 5000 });
            }
            return;
          }
          if (message.name === "entity.changed" && isEntityChangedEvent(payload)) {
            scheduleEntityRefetch(payload);
          }
        };

        const channelNames = [`clientflow:user:${currentUser.id}`, "clientflow:staff"];
        const channels = channelNames.map((name) => realtime.channels.get(name));
        await Promise.all(
          channels.map((channel) =>
            channel.subscribe(["notification.created", "entity.changed"], handleMessage),
          ),
        );

        // Attach before the first snapshot. Any event that arrives during the
        // GET is merged by the store, while events missed during startup are
        // recovered by this authoritative catch-up request.
        await loadNotifications(controller.signal);
      } catch (caughtError) {
        if (!disposed && !(caughtError instanceof DOMException && caughtError.name === "AbortError")) {
          setConnectionState("degraded");
          setLoading(false);
          console.error("Clientflow realtime startup failed", {
            message: caughtError instanceof Error ? caughtError.message : "Unknown startup error",
          });
        }
      }
    };

    const handleConnectionRecovery = () => {
      sync();
    };

    const handleExplicitRefresh = () => sync();

    void start();
    window.addEventListener("focus", handleConnectionRecovery);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("clientflow:realtime-focus", handleConnectionRecovery);
    window.addEventListener("clientflow:notifications-refresh", handleExplicitRefresh);

    if (typeof window.BroadcastChannel !== "undefined") {
      try {
        const channel = new window.BroadcastChannel("clientflow:notifications");
        channel.addEventListener("message", handleBroadcastMessage);
        broadcastChannelRef.current = channel;
      } catch {
        broadcastChannelRef.current = null;
      }
    }

    degradedPolling = setInterval(() => {
      if (useNotificationStore.getState().connectionState === "degraded") sync();
    }, 30_000);

    return () => {
      disposed = true;
      controller.abort();
      if (degradedPolling) clearInterval(degradedPolling);
      window.removeEventListener("focus", handleConnectionRecovery);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("clientflow:realtime-focus", handleConnectionRecovery);
      window.removeEventListener("clientflow:notifications-refresh", handleExplicitRefresh);
      for (const timer of entityTimers.values()) clearTimeout(timer);
      entityTimers.clear();
      const broadcastChannel = broadcastChannelRef.current;
      if (broadcastChannel) {
        broadcastChannel.removeEventListener("message", handleBroadcastMessage);
        broadcastChannel.close();
        broadcastChannelRef.current = null;
      }
      realtimeRef.current?.close();
      realtimeRef.current = null;
    };
  }, [loadNotifications, mergeRemoteNotification, setConnectionState, setError, setLoading, setReadLocally]);

  return children;
}
