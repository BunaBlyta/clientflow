import { describe, expect, it } from "vitest";
import {
  isEntityChangedEvent,
  isNotificationPayload,
  mergeNotifications,
  sortNotifications,
} from "@/lib/realtime-notification-store";
import type { Notification } from "@/lib/types";

const notification = (id: string, createdAt: string, read = false): Notification => ({
  id,
  userId: "staff-1",
  type: "NEW_NOTE",
  title: `Notification ${id}`,
  body: "A note changed.",
  read,
  createdAt,
  projectId: "project-1",
});

describe("realtime notification helpers", () => {
  it("sorts newest notifications first", () => {
    expect(sortNotifications([notification("old", "2026-01-01"), notification("new", "2026-01-02")])).toMatchObject([
      { id: "new" },
      { id: "old" },
    ]);
  });

  it("deduplicates events by ID and reports only newly added records", () => {
    const result = mergeNotifications(
      [notification("same", "2026-01-01", false)],
      [notification("same", "2026-01-01", true), notification("new", "2026-01-02")],
    );

    expect(result.addedIds).toEqual(["new"]);
    expect(result.notifications).toMatchObject([
      { id: "new" },
      { id: "same", read: true },
    ]);
  });

  it("keeps an event received before a stale snapshot", () => {
    const eventFirst = mergeNotifications(
      [notification("old", "2026-01-01")],
      [notification("new", "2026-01-02")],
    ).notifications;
    const staleSnapshot = mergeNotifications(
      eventFirst,
      [notification("old", "2026-01-01")],
    ).notifications;

    expect(staleSnapshot.map(({ id }) => id)).toEqual(["new", "old"]);
  });

  it("validates canonical notification and entity payloads", () => {
    expect(isNotificationPayload(notification("one", "2026-01-01"))).toBe(true);
    expect(isNotificationPayload({ id: "one" })).toBe(false);
    expect(
      isEntityChangedEvent({ entity: "invoice", id: "inv-1", invoiceId: "inv-1", reason: "payment" }),
    ).toBe(true);
    expect(isEntityChangedEvent({ entity: "lead", id: "lead-1", reason: "request" })).toBe(true);
    expect(isEntityChangedEvent({ entity: "request", reason: "request" })).toBe(false);
    expect(isEntityChangedEvent({ entity: "client", id: "client-1", reason: "payment" })).toBe(false);
  });
});
