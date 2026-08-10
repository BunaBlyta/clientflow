import { create } from "zustand";
import {
  clients as initialClients,
  contactLeads as initialContactLeads,
  currentStaffUser,
  invoices as initialInvoices,
  notes as initialNotes,
  notifications as initialNotifications,
  packages,
  projectRequests as initialProjectRequests,
  projects as initialProjects,
} from "@/lib/mock-data";
import type {
  Client,
  ContactLead,
  Invoice,
  InvoiceKind,
  Note,
  Notification,
  Project,
  ProjectRequest,
  ProjectStatus,
} from "@/lib/types";
import { PROJECT_STATUS_LABEL } from "@/lib/status";

/**
 * Everything in this store stands in for the real database/API until Codex's
 * backend lanes come online (see STATUS.md). It's seeded from lib/mock-data.ts
 * and mutated entirely client-side, so table actions (approve/reject, status
 * changes, invoicing) are genuinely clickable in the demo, not static mockups.
 * Actions here are named/shaped to mirror what the real API routes will need
 * to do — swapping them for real fetch calls later should be close to 1:1.
 */

let idCounter = 1000;
const nextId = (prefix: string) => `${prefix}-${idCounter++}`;

interface AppState {
  clients: Client[];
  projects: Project[];
  invoices: Invoice[];
  notes: Note[];
  projectRequests: ProjectRequest[];
  contactLeads: ContactLead[];
  notifications: Notification[];

  submitProjectRequest: (input: {
    packageId: string;
    prospectName: string;
    prospectEmail: string;
    prospectPhone?: string;
    companyName?: string;
    message?: string;
  }) => void;

  submitContactLead: (input: {
    name: string;
    email: string;
    companyName?: string;
    message: string;
  }) => void;

  approveRequest: (requestId: string) => void;
  rejectRequest: (requestId: string) => void;

  updateProjectStatus: (projectId: string, status: ProjectStatus) => void;

  createInvoice: (input: {
    projectId: string;
    kind: InvoiceKind;
    label: string;
    amountCents: number;
    dueDate?: string;
    sendImmediately: boolean;
  }) => void;
  sendInvoice: (invoiceId: string) => void;
  markInvoicePaid: (invoiceId: string) => void;
  voidInvoice: (invoiceId: string) => boolean;

  resendInvite: (clientId: string) => void;

  addNote: (projectId: string, body: string) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  clients: initialClients,
  projects: initialProjects,
  invoices: initialInvoices,
  notes: initialNotes,
  projectRequests: initialProjectRequests,
  contactLeads: initialContactLeads,
  notifications: initialNotifications,

  submitProjectRequest: (input) => {
    const request: ProjectRequest = {
      id: nextId("req"),
      packageId: input.packageId,
      prospectName: input.prospectName,
      prospectEmail: input.prospectEmail,
      prospectPhone: input.prospectPhone,
      companyName: input.companyName,
      message: input.message,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ projectRequests: [request, ...state.projectRequests] }));
  },

  submitContactLead: (input) => {
    const lead: ContactLead = {
      id: nextId("lead"),
      name: input.name,
      email: input.email,
      companyName: input.companyName,
      message: input.message,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ contactLeads: [lead, ...state.contactLeads] }));
  },

  approveRequest: (requestId) => {
    const request = get().projectRequests.find((r) => r.id === requestId);
    if (!request || request.status !== "PENDING") return;
    const now = new Date().toISOString();

    const client: Client = {
      id: nextId("client"),
      userId: nextId("user-client"),
      companyName: request.companyName ?? request.prospectName,
      contactName: request.prospectName,
      email: request.prospectEmail,
      phone: request.prospectPhone,
      createdAt: now,
    };
    const pkg = packages.find((p) => p.id === request.packageId);
    const project: Project = {
      id: nextId("proj"),
      clientId: client.id,
      packageId: request.packageId,
      // Stays PENDING until the deposit invoice is confirmed paid — that
      // transition to Discovery is the one payment-gated step (AGENTS.md sec. 4).
      name: `${client.companyName} — ${pkg?.name ?? "Project"}`,
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      projectRequests: state.projectRequests.map((r) =>
        r.id === requestId ? { ...r, status: "APPROVED", reviewedAt: now } : r
      ),
      clients: [client, ...state.clients],
      projects: [project, ...state.projects],
      notifications: [
        {
          id: nextId("notif"),
          userId: currentStaffUser.id,
          type: "REQUEST_APPROVED",
          title: "Request approved",
          body: `${request.prospectName}'s request was approved — app invitation sent.`,
          read: true,
          createdAt: now,
        },
        ...state.notifications,
      ],
    }));
  },

  rejectRequest: (requestId) => {
    const now = new Date().toISOString();
    set((state) => ({
      projectRequests: state.projectRequests.map((r) =>
        r.id === requestId && r.status === "PENDING"
          ? { ...r, status: "REJECTED", reviewedAt: now }
          : r
      ),
    }));
  },

  updateProjectStatus: (projectId, status) => {
    const project = get().projects.find((p) => p.id === projectId);
    if (!project || project.status === status) return;
    const now = new Date().toISOString();
    const note: Note = {
      id: nextId("note"),
      projectId,
      authorId: null,
      authorName: "System",
      authorRole: "SYSTEM",
      body: `Status changed from ${PROJECT_STATUS_LABEL[project.status]} to ${PROJECT_STATUS_LABEL[status]}.`,
      createdAt: now,
    };
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, status, updatedAt: now } : p
      ),
      notes: [...state.notes, note],
      notifications: [
        {
          id: nextId("notif"),
          userId: currentStaffUser.id,
          type: "PROJECT_STAGE_CHANGED",
          title: "Project stage changed",
          body: `${project.name} is now ${PROJECT_STATUS_LABEL[status]}.`,
          read: true,
          createdAt: now,
        },
        ...state.notifications,
      ],
    }));
  },

  createInvoice: (input) => {
    const now = new Date().toISOString();
    const invoice: Invoice = {
      id: nextId("inv"),
      projectId: input.projectId,
      kind: input.kind,
      label: input.label,
      amountCents: input.amountCents,
      status: input.sendImmediately ? "SENT" : "DRAFT",
      dueDate: input.dueDate,
      createdAt: now,
    };
    set((state) => ({
      invoices: [invoice, ...state.invoices],
      notifications: input.sendImmediately
        ? [
            {
              id: nextId("notif"),
              userId: currentStaffUser.id,
              type: input.kind === "EXTRA" ? "EXTRA_CHARGE_CREATED" : "INVOICE_ISSUED",
              title: "Invoice sent",
              body: `${input.label} sent for ${input.projectId}.`,
              read: true,
              createdAt: now,
            },
            ...state.notifications,
          ]
        : state.notifications,
    }));
  },

  sendInvoice: (invoiceId) => {
    set((state) => ({
      invoices: state.invoices.map((i) =>
        i.id === invoiceId && i.status === "DRAFT" ? { ...i, status: "SENT" } : i
      ),
    }));
  },

  // Stand-in for the real, webhook-driven confirmation (AGENTS.md: a project only
  // advances on a confirmed Stripe webhook, never a client-side click). Marking an
  // invoice paid here simulates that webhook firing, since Stripe isn't wired up yet.
  markInvoicePaid: (invoiceId) => {
    const invoice = get().invoices.find((i) => i.id === invoiceId);
    if (!invoice) return;
    const now = new Date().toISOString();

    set((state) => ({
      invoices: state.invoices.map((i) =>
        i.id === invoiceId ? { ...i, status: "PAID", paidAt: now } : i
      ),
    }));

    if (invoice.kind === "DEPOSIT") {
      const project = get().projects.find((p) => p.id === invoice.projectId);
      if (project && project.status === "PENDING") {
        get().updateProjectStatus(project.id, "DISCOVERY");
      }
    }
  },

  voidInvoice: (invoiceId) => {
    const invoice = get().invoices.find((i) => i.id === invoiceId);
    if (!invoice || invoice.status === "PAID") return false;
    set((state) => ({
      invoices: state.invoices.map((i) => (i.id === invoiceId ? { ...i, status: "VOIDED" } : i)),
    }));
    return true;
  },

  resendInvite: () => {
    // No state to mutate — this is a fire-and-forget email resend in the real app.
  },

  addNote: (projectId, body) => {
    const note: Note = {
      id: nextId("note"),
      projectId,
      authorId: currentStaffUser.id,
      authorName: currentStaffUser.name,
      authorRole: "STAFF",
      body,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ notes: [...state.notes, note] }));
  },

  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  },

  markAllNotificationsRead: () => {
    set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, read: true })) }));
  },
}));
