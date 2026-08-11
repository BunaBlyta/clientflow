import { create } from "zustand";
import {
  clients as initialClients,
  contactLeads as initialContactLeads,
  currentStaffUser,
  invoices as initialInvoices,
  notes as initialNotes,
  notifications as initialNotifications,
  packages as initialPackages,
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
  Package,
  Project,
  ProjectRequest,
} from "@/lib/types";

/**
 * Screens that have not been connected to the API still read their fixtures from
 * this store. Live project and invoice controls apply the records returned by the
 * server here when they also appear inside a remaining mock-backed screen; they do
 * not invent successful state transitions locally.
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
  packages: Package[];

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

  applyProjectUpdate: (project: Project) => void;

  createInvoice: (input: {
    projectId: string;
    kind: InvoiceKind;
    label: string;
    amountCents: number;
    dueDate?: string;
    sendImmediately: boolean;
  }) => void;
  applyInvoiceUpdate: (invoice: Invoice) => void;

  resendInvite: (clientId: string) => void;
  inviteStaff: (email: string) => void;

  updatePackage: (packageId: string, patch: Partial<Omit<Package, "id" | "slug">>) => void;

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
  packages: initialPackages,

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
    const pkg = get().packages.find((p) => p.id === request.packageId);
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

  applyProjectUpdate: (project) => {
    set((state) => ({
      projects: state.projects.map((currentProject) =>
        currentProject.id === project.id ? project : currentProject,
      ),
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

  applyInvoiceUpdate: (invoice) => {
    set((state) => ({
      invoices: state.invoices.map((currentInvoice) =>
        currentInvoice.id === invoice.id ? invoice : currentInvoice,
      ),
    }));
  },

  resendInvite: () => {
    // No state to mutate — this is a fire-and-forget email resend in the real app.
  },

  inviteStaff: () => {
    // No state to mutate — this is a fire-and-forget email invite in the real app.
  },

  updatePackage: (packageId, patch) => {
    set((state) => ({
      packages: state.packages.map((p) => (p.id === packageId ? { ...p, ...patch } : p)),
    }));
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
