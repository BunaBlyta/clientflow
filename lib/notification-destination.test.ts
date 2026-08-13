import { describe, expect, it } from "vitest";
import { getNotificationDestination } from "@/lib/notification-destination";

describe("getNotificationDestination", () => {
  it("prioritizes invoice targets", () => {
    expect(
      getNotificationDestination({ invoiceId: "invoice-1", requestId: "request-1", projectId: "project-1" }),
    ).toBe("/dashboard/invoices");
  });

  it("routes request targets to the request detail page", () => {
    expect(getNotificationDestination({ requestId: "request/1" })).toBe("/dashboard/requests/request%2F1");
  });

  it("routes project targets to the project detail page", () => {
    expect(getNotificationDestination({ projectId: "project-1" })).toBe("/dashboard/projects/project-1");
  });

  it("uses the notifications page when there is no target", () => {
    expect(getNotificationDestination({})).toBe("/dashboard/notifications");
  });
});
