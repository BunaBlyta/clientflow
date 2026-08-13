import type { Notification } from "@/lib/types";

export function getNotificationDestination(
  notification: Pick<Notification, "invoiceId" | "requestId" | "projectId" | "title" | "type">,
): string {
  if (notification.invoiceId) return "/dashboard/invoices";
  if (notification.requestId) {
    return `/dashboard/requests/${encodeURIComponent(notification.requestId)}`;
  }
  if (notification.projectId) {
    return `/dashboard/projects/${encodeURIComponent(notification.projectId)}`;
  }

  // Notifications created before navigation targets were added still need to
  // take staff somewhere useful. Custom inquiries intentionally have no
  // request record, so their stable title distinguishes that queue.
  switch (notification.type) {
    case "REQUEST_SUBMITTED":
      return notification.title === "New custom inquiry"
        ? "/dashboard/projects?tab=custom"
        : "/dashboard/projects?tab=requests";
    case "REQUEST_APPROVED":
    case "REQUEST_REJECTED":
      return "/dashboard/projects?tab=requests";
    case "INVOICE_ISSUED":
    case "PAYMENT_SUCCEEDED":
    case "PAYMENT_FAILED":
    case "EXTRA_CHARGE_CREATED":
      return "/dashboard/invoices";
    case "PROJECT_STAGE_CHANGED":
    case "NEW_NOTE":
      return "/dashboard/projects";
  }

  return "/dashboard/notifications";
}
