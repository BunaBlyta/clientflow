import { describe, expect, it } from "vitest";
import { getNotificationDestination } from "@/lib/notification-destination";

describe("getNotificationDestination", () => {
  it("prioritizes invoice targets", () => {
    expect(
      getNotificationDestination({
        invoiceId: "invoice-1",
        requestId: "request-1",
        projectId: "project-1",
        type: "NEW_NOTE",
        title: "New note",
      }),
    ).toBe("/dashboard/invoices");
  });

  it("routes request targets to the request detail page", () => {
    expect(
      getNotificationDestination({
        requestId: "request/1",
        type: "REQUEST_SUBMITTED",
        title: "New project request",
      }),
    ).toBe("/dashboard/requests/request%2F1");
  });

  it("routes project targets to the project detail page", () => {
    expect(
      getNotificationDestination({
        projectId: "project-1",
        type: "PROJECT_STAGE_CHANGED",
        title: "Project updated",
      }),
    ).toBe("/dashboard/projects/project-1");
  });

  it("routes legacy standard requests to the requests tab", () => {
    expect(
      getNotificationDestination({
        type: "REQUEST_SUBMITTED",
        title: "New project request",
      }),
    ).toBe("/dashboard/projects?tab=requests");
  });

  it("routes custom inquiries to the custom inquiries tab", () => {
    expect(
      getNotificationDestination({
        type: "REQUEST_SUBMITTED",
        title: "New custom inquiry",
      }),
    ).toBe("/dashboard/projects?tab=custom");
  });

  it("routes legacy invoice notifications to the invoices page", () => {
    expect(
      getNotificationDestination({
        type: "PAYMENT_FAILED",
        title: "Payment failed",
      }),
    ).toBe("/dashboard/invoices");
  });

  it("routes legacy project notifications to the projects page", () => {
    expect(
      getNotificationDestination({
        type: "NEW_NOTE",
        title: "New note from a client",
      }),
    ).toBe("/dashboard/projects");
  });
});
