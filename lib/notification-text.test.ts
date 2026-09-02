import { describe, expect, it } from "vitest";
import { localizeNotification } from "@/lib/notification-text";
import { localizeSystemNote } from "@/lib/system-note-text";
import type { Notification } from "@/lib/types";

/**
 * Stands in for the message catalogue: echoes the key plus its interpolated
 * values, so a test can tell which template was matched and what was pulled out
 * of the stored English sentence.
 */
function t(key: string, values?: Record<string, string | number>) {
  const suffix = values
    ? ` ${Object.entries(values).map(([name, value]) => `${name}=${value}`).join(",")}`
    : "";
  return `${key}${suffix}`;
}

function notification(overrides: Partial<Notification>): Notification {
  return {
    id: "n1",
    type: "NEW_NOTE",
    title: "",
    body: "",
    read: false,
    createdAt: "2026-09-01T10:00:00.000Z",
    ...overrides,
  } as Notification;
}

describe("localizeNotification", () => {
  it("translates a stage change and the status words inside it", () => {
    expect(
      localizeNotification(
        notification({
          type: "PROJECT_STAGE_CHANGED",
          title: "Riverside Cafe moved to Development",
          body: "Your project moved from Design to Development.",
        }),
        t,
      ),
    ).toEqual({
      title: "notifications.stageChangedTitle project=Riverside Cafe,status=status.project.DEVELOPMENT",
      body: "notifications.stageTransitionBody from=status.project.DESIGN,to=status.project.DEVELOPMENT",
    });
  });

  it("keeps the staff-written invoice description inside a translated wrapper", () => {
    expect(
      localizeNotification(
        notification({
          type: "INVOICE_ISSUED",
          title: "Invoice sent",
          body: "Extra homepage revisions is ready to review and pay.",
        }),
        t,
      ),
    ).toEqual({
      title: "notifications.invoiceSentTitle",
      body: "notifications.invoiceDescriptionBody description=Extra homepage revisions",
    });
  });

  it("pulls the requester and package out of a request notification", () => {
    expect(
      localizeNotification(
        notification({
          type: "REQUEST_SUBMITTED",
          title: "New project request",
          body: "Dana Chen requested a Full Website.",
        }),
        t,
      ).body,
    ).toBe("notifications.requestSubmittedDetailBody requester=Dana Chen,package=Full Website");
  });

  it("handles both the straight and typographic apostrophe in payment failures", () => {
    for (const body of [
      "Your payment for “Deposit” didn't go through. Tap to try again.",
      "Your payment for “Deposit” didn’t go through. Tap to try again.",
    ]) {
      expect(localizeNotification(notification({ type: "PAYMENT_FAILED", title: "Payment failed", body }), t).body).toBe(
        "notifications.paymentFailedBody invoice=Deposit",
      );
    }
  });

  it("falls back to the stored text when nothing matches", () => {
    const unknown = notification({
      type: "PAYMENT_SUCCEEDED",
      title: "Payment received",
      body: "Some wording nobody anticipated.",
    });
    expect(localizeNotification(unknown, t)).toEqual({
      title: "notifications.paymentSucceededTitle",
      body: "Some wording nobody anticipated.",
    });
  });
});

describe("localizeSystemNote", () => {
  it("translates a status-change note and the statuses in it", () => {
    expect(localizeSystemNote("Project status changed from Design to Review.", t)).toBe(
      "notes.statusChanged from=status.project.DESIGN,to=status.project.REVIEW",
    );
  });

  it("distinguishes deposit from custom invoice confirmations", () => {
    expect(localizeSystemNote("Deposit payment confirmed. Project moved to Discovery.", t)).toBe(
      "notes.depositConfirmed status=status.project.DISCOVERY",
    );
    expect(localizeSystemNote("Custom invoice payment confirmed. Project moved to Discovery.", t)).toBe(
      "notes.customInvoiceConfirmed status=status.project.DISCOVERY",
    );
  });

  it("leaves a note written by a person untouched", () => {
    const written = "Can we push the launch to next Tuesday?";
    expect(localizeSystemNote(written, t)).toBe(written);
  });
});
