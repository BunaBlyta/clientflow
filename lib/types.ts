/**
 * Shared entity types for the dashboard + landing page, built against mock data
 * while the Prisma schema is still being defined (see AGENTS.md section 4 for
 * the entity list this was derived from). Field names/shapes here are what the
 * frontend expects the real API to return — see STATUS.md for the note to Codex.
 */

export type Role = "STAFF" | "CLIENT";

export type ProjectStatus =
  | "PENDING"
  | "DISCOVERY"
  | "DESIGN"
  | "DEVELOPMENT"
  | "REVIEW"
  | "LAUNCHED"
  | "CANCELLED"
  | "ON_HOLD";

export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type InvoiceStatus =
  | "DRAFT"
  | "SENT"
  | "PAYMENT_PENDING"
  | "PAID"
  | "FAILED"
  | "VOIDED"
  | "REFUNDED";

export type InvoiceKind = "DEPOSIT" | "FINAL" | "EXTRA";

export type NoteAuthorRole = "STAFF" | "CLIENT" | "SYSTEM";

export type NotificationType =
  | "REQUEST_SUBMITTED"
  | "REQUEST_APPROVED"
  | "REQUEST_REJECTED"
  | "INVOICE_ISSUED"
  | "PAYMENT_SUCCEEDED"
  | "PAYMENT_FAILED"
  | "PROJECT_STAGE_CHANGED"
  | "NEW_NOTE"
  | "EXTRA_CHARGE_CREATED";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  userId: string;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export interface Package {
  id: string;
  name: string;
  slug: "landing-page" | "full-website" | "web-app-build";
  priceCents: number | null; // null for the custom package (Web App Build) — "custom pricing"
  isCustom: boolean;
  description: string;
  features: string[];
  turnaroundDays: number;
}

export interface ProjectRequest {
  id: string;
  packageId: string;
  prospectName: string;
  prospectEmail: string;
  prospectPhone?: string;
  companyName?: string;
  message?: string;
  status: RequestStatus;
  createdAt: string;
  reviewedAt?: string;
}

export interface ContactLead {
  id: string;
  name: string;
  email: string;
  companyName?: string;
  message: string;
  createdAt: string;
}

export interface Project {
  id: string;
  clientId: string;
  packageId: string | null;
  name: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  targetLaunchDate?: string;
}

export interface Invoice {
  id: string;
  projectId: string;
  kind: InvoiceKind;
  label: string;
  amountCents: number;
  status: InvoiceStatus;
  dueDate?: string;
  paidAt?: string;
  createdAt: string;
}

export interface Note {
  id: string;
  projectId: string;
  authorId: string | null; // null for SYSTEM notes
  authorName: string;
  authorRole: NoteAuthorRole;
  body: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  link?: string;
}
