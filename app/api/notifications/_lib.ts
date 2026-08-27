export const DEFAULT_NOTIFICATION_PAGE_SIZE = 20;
export const MAX_NOTIFICATION_PAGE_SIZE = 50;
export const LEGACY_NOTIFICATION_LIMIT = 200;

export const notificationSelect = {
  id: true,
  userId: true,
  type: true,
  title: true,
  message: true,
  readAt: true,
  archivedAt: true,
  createdAt: true,
  projectId: true,
  invoiceId: true,
  requestId: true,
} as const;

export type NotificationRecord = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  readAt: Date | null;
  archivedAt: Date | null;
  createdAt: Date;
  projectId: string | null;
  invoiceId: string | null;
  requestId: string | null;
};

export function serializeNotification(notification: NotificationRecord) {
  return {
    id: notification.id,
    userId: notification.userId,
    type: notification.type,
    title: notification.title,
    body: notification.message,
    projectId: notification.projectId,
    invoiceId: notification.invoiceId,
    requestId: notification.requestId,
    read: notification.readAt !== null,
    archived: notification.archivedAt != null,
    createdAt: notification.createdAt.toISOString(),
  };
}
