import type { Notification, ProjectStatus } from "@/lib/types";

type Translate = (key: string, values?: Record<string, string | number>) => string;

/**
 * Notifications are written into the database as English sentences at the moment
 * the event happens, so there is nothing structured left to translate at render
 * time. This reconstructs the template from the notification type and the shape
 * of the stored text, then renders it through the message catalogue.
 *
 * A port of `mobile/lib/notification-text.ts` — the two clients read the same
 * rows, so they must recognise the same sentences. Anything unrecognised falls
 * through to the stored English, which is always better than showing nothing.
 */

const SYSTEM_NEW_NOTE_BODY = "A new note was posted to your project.";
const INVOICE_DESCRIPTION_BODY = /^(.+) is ready to review and pay\.$/;

const statusByEnglishLabel: Record<string, ProjectStatus> = {
  Pending: "PENDING",
  Discovery: "DISCOVERY",
  Design: "DESIGN",
  Development: "DEVELOPMENT",
  Review: "REVIEW",
  Launched: "LAUNCHED",
  Cancelled: "CANCELLED",
  "On Hold": "ON_HOLD",
  "On hold": "ON_HOLD",
};

/** Translates an English status word embedded in a stored sentence. */
export function localizedStatusLabel(value: string, t: Translate): string {
  const status = statusByEnglishLabel[value.replace(/[.!?]+$/, "")];
  return status ? t(`status.project.${status}`) : value;
}

function isDynamicInvoiceNotification(notification: Notification) {
  if (notification.type === "INVOICE_ISSUED") {
    return notification.title === "Invoice issued" || notification.title === "Invoice sent";
  }
  if (notification.type === "EXTRA_CHARGE_CREATED") {
    return notification.title === "Additional invoice sent" || notification.title === "Invoice sent";
  }
  return false;
}

/**
 * Invoice descriptions are staff-written text inside a fixed sentence. Pulled
 * out so the wrapper can be translated around content we leave alone.
 */
function userAuthoredInvoiceDescription(notification: Notification): string | null {
  if (!isDynamicInvoiceNotification(notification)) return null;
  return notification.body.match(INVOICE_DESCRIPTION_BODY)?.[1] ?? null;
}

export function localizeNotification(notification: Notification, t: Translate) {
  let title = notification.title;
  let body = notification.body;

  switch (notification.type) {
    case "REQUEST_SUBMITTED": {
      title = t("notifications.requestSubmittedTitle");
      if (notification.body === "A new project request needs your review.") {
        body = t("notifications.requestSubmittedBody");
      } else {
        const match = notification.body.match(/^(.+) requested a (.+)\.$/);
        if (match) body = t("notifications.requestSubmittedDetailBody", { requester: match[1], package: match[2] });
      }
      break;
    }
    case "REQUEST_APPROVED": {
      title = t("notifications.requestApprovedTitle");
      if (notification.body === "Your project request was approved.") body = t("notifications.requestApprovedBody");
      else if (notification.body === "Your project is ready. Your deposit invoice is available to pay.") {
        body = t("notifications.projectReadyBody");
      }
      break;
    }
    case "REQUEST_REJECTED": {
      title = t("notifications.requestRejectedTitle");
      if (notification.body === "There is an update to your project request.") body = t("notifications.requestRejectedBody");
      else if (notification.body === "Your project request was not approved at this time.") {
        body = t("notifications.requestNotApprovedBody");
      }
      break;
    }
    case "INVOICE_ISSUED":
    case "EXTRA_CHARGE_CREATED": {
      const titleMatch = notification.title.match(/^New invoice:\s*(.+)$/);
      if (titleMatch) {
        title = t("notifications.newInvoiceTitle", { label: titleMatch[1] });
        const bodyMatch = notification.body.match(/^A new invoice for (.+) was added to (.+)\.$/);
        if (bodyMatch) body = t("notifications.invoiceCreatedBody", { amount: bodyMatch[1], project: bodyMatch[2] });
      } else if (notification.type === "EXTRA_CHARGE_CREATED" && notification.title === "Additional invoice ready") {
        title = t("notifications.additionalInvoiceTitle");
        if (notification.body === "An additional invoice is ready to review.") body = t("notifications.additionalInvoiceBody");
      } else if (notification.type === "EXTRA_CHARGE_CREATED" && notification.title === "Additional invoice sent") {
        title = t("notifications.additionalInvoiceSentTitle");
        const description = userAuthoredInvoiceDescription(notification);
        body = description
          ? t("notifications.invoiceDescriptionBody", { description })
          : t("notifications.invoiceReadyToPayBody");
      } else if (notification.title === "Invoice ready") {
        title = t("notifications.invoiceReadyTitle");
        if (notification.body === "A new invoice is ready to review.") body = t("notifications.invoiceReadyBody");
      } else if (notification.title === "Invoice sent" || notification.title === "Invoice issued") {
        // Custom invoices from a converted inquiry still carry the legacy
        // "Invoice issued" title for the same sent-for-payment event.
        title = t("notifications.invoiceSentTitle");
        const description = userAuthoredInvoiceDescription(notification);
        body = description
          ? t("notifications.invoiceDescriptionBody", { description })
          : t("notifications.invoiceReadyToPayBody");
      }
      break;
    }
    case "PAYMENT_SUCCEEDED": {
      title = t("notifications.paymentSucceededTitle");
      const match = notification.body.match(/^Thanks! Your (?:final )?payment for ['“](.+?)['”] was received\.$/);
      if (match) body = t("notifications.paymentSucceededBody", { invoice: match[1] });
      else if (notification.body === "Your payment was confirmed.") body = t("notifications.paymentConfirmedBody");
      else if (notification.body === "Your invoice payment was confirmed.") body = t("notifications.invoicePaymentConfirmedBody");
      else if (notification.body === "A client invoice payment was confirmed.") body = t("notifications.invoicePaymentConfirmedBody");
      break;
    }
    case "PAYMENT_FAILED": {
      title = notification.title === "Payment update"
        ? t("notifications.paymentUpdateTitle")
        : t("notifications.paymentFailedTitle");
      const match = notification.body.match(/^Your payment for ['“](.+?)['”] (?:didn't|didn’t) go through\. Tap to try again\.$/);
      if (match) body = t("notifications.paymentFailedBody", { invoice: match[1] });
      else if (notification.body === "Your payment could not be completed.") body = t("notifications.paymentIncompleteBody");
      else if (notification.body === "Your invoice payment could not be completed.") body = t("notifications.invoicePaymentIncompleteBody");
      else if (notification.body === "A client invoice payment could not be completed.") body = t("notifications.invoicePaymentIncompleteBody");
      break;
    }
    case "PROJECT_STAGE_CHANGED": {
      const titleMatch = notification.title.match(/^(.+) moved to (.+)$/);
      if (titleMatch) {
        title = t("notifications.stageChangedTitle", {
          project: titleMatch[1],
          status: localizedStatusLabel(titleMatch[2], t),
        });
      } else if (notification.title === "Project status updated") {
        title = t("notifications.stageUpdatedTitle");
      }
      const stageMatch = notification.body.match(/^Your project is now in the (.+) stage\.$/);
      const transitionMatch = notification.body.match(/^Your project moved from (.+) to (.+)\.$/);
      if (stageMatch) body = t("notifications.stageChangedBody", { status: localizedStatusLabel(stageMatch[1], t) });
      else if (/^We(?:'|’)ve paused this project\./.test(notification.body)) body = t("notifications.projectPausedBody");
      else if (notification.body === "Your project status has changed.") body = t("notifications.stageUpdatedBody");
      else if (transitionMatch) {
        body = t("notifications.stageTransitionBody", {
          from: localizedStatusLabel(transitionMatch[1], t),
          to: localizedStatusLabel(transitionMatch[2], t),
        });
      }
      break;
    }
    case "NEW_NOTE": {
      const match = notification.title.match(/^New note from (.+)$/);
      if (match) title = t("notifications.newNoteTitle", { author: match[1] });
      else if (notification.title === "New project note") title = t("notifications.newProjectNoteTitle");
      if (notification.body === SYSTEM_NEW_NOTE_BODY) body = t("notifications.newProjectNoteBody");
      break;
    }
  }

  return { title, body };
}
