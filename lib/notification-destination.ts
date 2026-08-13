import type { Notification } from "@/lib/types";

export function getNotificationDestination(
  notification: Pick<Notification, "invoiceId" | "requestId" | "projectId">,
): string {
  if (notification.invoiceId) return "/dashboard/invoices";
  if (notification.requestId) {
    return `/dashboard/requests/${encodeURIComponent(notification.requestId)}`;
  }
  if (notification.projectId) {
    return `/dashboard/projects/${encodeURIComponent(notification.projectId)}`;
  }
  return "/dashboard/notifications";
}
