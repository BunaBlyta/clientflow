import { create } from "zustand";
import {
  clients as initialClients,
  invoices as initialInvoices,
  notes as initialNotes,
  notifications as initialNotifications,
  packages as initialPackages,
  projectRequests as initialProjectRequests,
  projects as initialProjects,
} from "@/lib/mock-data";
import type {
  Client,
  Invoice,
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

  applyProjectUpdate: (project: Project) => void;

  applyInvoiceUpdate: (invoice: Invoice) => void;

  resendInvite: (clientId: string) => void;

  updatePackage: (packageId: string, patch: Partial<Omit<Package, "id" | "slug">>) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  clients: initialClients,
  projects: initialProjects,
  invoices: initialInvoices,
  notes: initialNotes,
  projectRequests: initialProjectRequests,
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

  applyProjectUpdate: (project) => {
    set((state) => ({
      projects: state.projects.map((currentProject) =>
        currentProject.id === project.id ? project : currentProject,
      ),
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

  updatePackage: (packageId, patch) => {
    set((state) => ({
      packages: state.packages.map((p) => (p.id === packageId ? { ...p, ...patch } : p)),
    }));
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
