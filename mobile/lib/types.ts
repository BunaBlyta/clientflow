// Local type definitions for the Clientflow mobile app.
// Mirrors the shape the real backend (Prisma/Next.js API routes, owned by a
// separate agent) is expected to eventually return. There is no shared code
// between the web and mobile projects, so this is intentionally a standalone
// copy — see /mobile/../STATUS.md for the reconciliation note.

export type ProjectStatus =
  | 'PENDING'
  | 'DISCOVERY'
  | 'DESIGN'
  | 'DEVELOPMENT'
  | 'REVIEW'
  | 'LAUNCHED'
  | 'CANCELLED'
  | 'ON_HOLD';

export type InvoiceStatus =
  | 'DRAFT'
  | 'SENT'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'FAILED'
  | 'VOIDED'
  | 'REFUNDED';

export type InvoiceKind = 'DEPOSIT' | 'FINAL' | 'EXTRA' | 'CUSTOM';

export type NoteAuthorRole = 'STAFF' | 'CLIENT' | 'SYSTEM';

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Package {
  id: string;
  name: string;
  priceCents: number;
  description: string;
}

export interface Client {
  id: string;
  name: string;
  companyName: string;
  email: string;
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
  authorId: string | null;
  authorName: string;
  authorRole: NoteAuthorRole;
  body: string;
  createdAt: string;
}

export interface ProjectRequest {
  id: string;
  packageId: string;
  prospectName: string;
  prospectEmail: string;
  status: RequestStatus;
  createdAt: string;
  reviewedAt?: string;
}

export interface Notification {
  id: string;
  type:
    | 'REQUEST_SUBMITTED'
    | 'REQUEST_APPROVED'
    | 'REQUEST_REJECTED'
    | 'INVOICE_ISSUED'
    | 'PAYMENT_SUCCEEDED'
    | 'PAYMENT_FAILED'
    | 'PROJECT_STAGE_CHANGED'
    | 'NEW_NOTE'
    | 'EXTRA_CHARGE_CREATED';
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  projectId?: string;
  invoiceId?: string;
  requestId?: string;
}
