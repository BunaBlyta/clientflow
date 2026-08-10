import {
  Bell,
  CreditCard,
  FileWarning,
  MessageSquare,
  ReceiptText,
  UserCheck,
  UserX,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { NotificationType } from "@/lib/types";

export const NOTIFICATION_ICON: Record<NotificationType, LucideIcon> = {
  REQUEST_SUBMITTED: Bell,
  REQUEST_APPROVED: UserCheck,
  REQUEST_REJECTED: UserX,
  INVOICE_ISSUED: ReceiptText,
  PAYMENT_SUCCEEDED: CreditCard,
  PAYMENT_FAILED: FileWarning,
  PROJECT_STAGE_CHANGED: Workflow,
  NEW_NOTE: MessageSquare,
  EXTRA_CHARGE_CREATED: ReceiptText,
};
