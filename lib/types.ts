// Shared entity types for the frontend (web + mobile build against these while
// Codex CLI builds the real Prisma schema/API — see AGENTS.md section 4 for the
// authoritative entity list these mirror). Once the real API exists, these
// should match prisma/schema.prisma field-for-field; treat drift as a bug.

export type UserRole = "staff" | "client";

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: string; // ISO date
}

export interface Client extends User {
  role: "client";
  company: string;
}

export interface Staff extends User {
  role: "staff";
}

export type PackageSlug = "landing-page" | "full-website" | "web-app-build";

export interface Package {
  id: string;
  slug: PackageSlug;
  name: string;
  tagline: string;
  priceUsd: number | null; // null = "custom pricing" (Web App Build)
  isCustom: boolean; // true only for Web App Build
  isMostPopular?: boolean;
  features: string[];
  turnaroundWeeks: [number, number]; // [min, max]
}

export type ProjectRequestStatus = "Pending" | "Approved" | "Rejected";

export interface ProjectRequest {
  id: string;
  packageId: string;
  prospectName: string;
  prospectEmail: string;
  companyName: string;
  notes: string;
  status: ProjectRequestStatus;
  createdAt: string;
  decidedAt?: string;
}

export interface ContactLead {
  id: string;
  name: string;
  email: string;
  company: string;
  message: string;
  createdAt: string;
}

export type ProjectStatus =
  | "Pending"
  | "Discovery"
  | "Design"
  | "Development"
  | "Review"
  | "Launched"
  | "On Hold"
  | "Cancelled";

export const PROJECT_STAGE_ORDER: ProjectStatus[] = [
  "Discovery",
  "Design",
  "Development",
  "Review",
  "Launched",
];

export interface Project {
  id: string;
  clientId: string;
  packageId: string;
  name: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus =
  | "Draft"
  | "Sent"
  | "Payment Pending"
  | "Paid"
  | "Failed"
  | "Voided"
  | "Refunded";

export interface Invoice {
  id: string;
  projectId: string;
  label: string; // e.g. "Deposit", "Final payment", "Extra: logo revisions"
  amountUsd: number;
  status: InvoiceStatus;
  dueDate?: string;
  createdAt: string;
  paidAt?: string;
}

export type NoteAuthorRole = "staff" | "client" | "system";

export interface Note {
  id: string;
  projectId: string;
  authorRole: NoteAuthorRole;
  authorName: string;
  body: string;
  createdAt: string;
}

export type NotificationType =
  | "request_submitted"
  | "request_approved"
  | "request_rejected"
  | "invoice_issued"
  | "payment_succeeded"
  | "payment_failed"
  | "project_stage_changed"
  | "new_note"
  | "extra_charge_created";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  href?: string;
}
