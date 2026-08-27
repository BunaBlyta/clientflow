-- Add an independent archive state. Archived notifications remain unread when
-- they were unread before archiving, so archiving never changes read state.
ALTER TABLE "Notification" ADD COLUMN "archivedAt" TIMESTAMP(3);

CREATE INDEX "Notification_userId_archivedAt_createdAt_idx"
ON "Notification"("userId", "archivedAt", "createdAt");
