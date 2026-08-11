import { create } from 'zustand';
import { projectRequest } from '../lib/api';
import {
  MOCK_INVOICES,
  MOCK_NOTES,
  MOCK_NOTIFICATIONS,
  MOCK_PROJECTS,
} from '../lib/mock-data';
import type { Invoice, Note, Notification, Project } from '../lib/types';

let noteCounter = 1000;
let notifCounter = 1000;

interface DataState {
  projects: Project[];
  invoices: Invoice[];
  notes: Note[];
  notifications: Notification[];

  projectsForClient: (clientId: string) => Project[];
  invoicesForProject: (projectId: string) => Invoice[];
  notesForProject: (projectId: string) => Note[];
  invoiceById: (invoiceId: string) => Invoice | undefined;
  projectById: (projectId: string) => Project | undefined;
  refreshProject: (projectId: string, token: string) => Promise<void>;

  addNote: (projectId: string, body: string, authorName: string) => void;

  /** Client taps Pay — mirrors real flow: this only ever moves an invoice to
   * PAYMENT_PENDING, never straight to PAID. A confirmed webhook is what
   * finalizes it (see resolvePayment), matching the non-negotiable in
   * AGENTS.md #2 even though this whole flow is mocked. */
  beginPayment: (invoiceId: string) => void;
  /** Simulates the Stripe webhook landing and confirming (or declining) the
   * payment. */
  resolvePayment: (invoiceId: string, success: boolean) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  unreadNotificationCount: () => number;
}

export const useDataStore = create<DataState>((set, get) => ({
  projects: MOCK_PROJECTS,
  invoices: MOCK_INVOICES,
  notes: MOCK_NOTES,
  notifications: MOCK_NOTIFICATIONS,

  projectsForClient: (clientId) =>
    get().projects.filter((p) => p.clientId === clientId),
  invoicesForProject: (projectId) =>
    get()
      .invoices.filter((i) => i.projectId === projectId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
  notesForProject: (projectId) =>
    get()
      .notes.filter((n) => n.projectId === projectId)
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)),
  invoiceById: (invoiceId) => get().invoices.find((i) => i.id === invoiceId),
  projectById: (projectId) => get().projects.find((p) => p.id === projectId),
  refreshProject: async (projectId, token) => {
    try {
      const project = await projectRequest(projectId, token);
      set((state) => ({
        projects: state.projects.some((item) => item.id === project.id)
          ? state.projects.map((item) => (item.id === project.id ? project : item))
          : [...state.projects, project],
      }));
    } catch {
      // Keep the fixture visible when the local API is unavailable.
    }
  },

  addNote: (projectId, body, authorName) => {
    const note: Note = {
      id: `note-local-${noteCounter++}`,
      projectId,
      authorId: 'client-1',
      authorName,
      authorRole: 'CLIENT',
      body,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ notes: [...state.notes, note] }));
  },

  beginPayment: (invoiceId) => {
    set((state) => ({
      invoices: state.invoices.map((inv) =>
        inv.id === invoiceId ? { ...inv, status: 'PAYMENT_PENDING' } : inv
      ),
    }));
  },

  resolvePayment: (invoiceId, success) => {
    const invoice = get().invoices.find((i) => i.id === invoiceId);
    if (!invoice) return;
    const now = new Date().toISOString();

    set((state) => ({
      invoices: state.invoices.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              status: success ? 'PAID' : 'FAILED',
              paidAt: success ? now : undefined,
            }
          : inv
      ),
    }));

    const systemNote: Note = {
      id: `note-local-${noteCounter++}`,
      projectId: invoice.projectId,
      authorId: null,
      authorName: 'System',
      authorRole: 'SYSTEM',
      body: success
        ? `Payment received for invoice '${invoice.label}'.`
        : `Payment failed for invoice '${invoice.label}'.`,
      createdAt: now,
    };
    const notification: Notification = {
      id: `notif-local-${notifCounter++}`,
      type: success ? 'PAYMENT_SUCCEEDED' : 'PAYMENT_FAILED',
      title: success ? 'Payment received' : 'Payment failed',
      body: success
        ? `Your payment for '${invoice.label}' was received.`
        : `Your payment for '${invoice.label}' didn't go through. Tap to try again.`,
      read: false,
      createdAt: now,
      projectId: invoice.projectId,
      invoiceId: invoice.id,
    };

    set((state) => ({
      notes: [...state.notes, systemNote],
      notifications: [notification, ...state.notifications],
    }));
  },

  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },
  markAllNotificationsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },
  unreadNotificationCount: () =>
    get().notifications.filter((n) => !n.read).length,
}));
