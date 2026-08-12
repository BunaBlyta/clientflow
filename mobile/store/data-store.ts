import { create } from 'zustand';
import {
  invoiceRequest,
  invoicesRequest,
  notesRequest,
  notificationsRequest,
  projectRequest,
  projectsRequest,
} from '../lib/api';
import {
  MOCK_INVOICES,
  MOCK_NOTES,
  MOCK_NOTIFICATIONS,
  MOCK_PROJECTS,
} from '../lib/mock-data';
import type { Invoice, Note, Notification, Project } from '../lib/types';

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
  refreshProjects: (token: string) => Promise<void>;
  refreshProject: (projectId: string, token: string) => Promise<void>;
  refreshInvoices: (token: string, projectId?: string) => Promise<boolean>;
  refreshInvoice: (invoiceId: string, token: string) => Promise<boolean>;
  refreshNotes: (token: string, projectId?: string) => Promise<boolean>;
  refreshNotifications: (token: string) => Promise<boolean>;
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
  refreshProjects: async (token) => {
    try {
      const projects = await projectsRequest(token);
      set({ projects });
    } catch {
      // Keep the fixtures visible when the local API is unavailable.
    }
  },
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
  refreshInvoices: async (token, projectId) => {
    try {
      const invoices = await invoicesRequest(token, projectId);
      set((state) => ({
        invoices: projectId
          ? [...state.invoices.filter((invoice) => invoice.projectId !== projectId), ...invoices]
          : invoices,
      }));
      return true;
    } catch {
      // Keep the fixtures visible when the local API is unavailable.
      return false;
    }
  },
  refreshInvoice: async (invoiceId, token) => {
    try {
      const invoice = await invoiceRequest(invoiceId, token);
      set((state) => ({
        invoices: state.invoices.some((item) => item.id === invoice.id)
          ? state.invoices.map((item) => (item.id === invoice.id ? invoice : item))
          : [...state.invoices, invoice],
      }));
      return true;
    } catch {
      // Keep the fixture visible when the local API is unavailable.
      return false;
    }
  },
  refreshNotes: async (token, projectId) => {
    try {
      const notes = await notesRequest(token, projectId);
      set((state) => ({
        notes: projectId
          ? [
              ...state.notes.filter((note) => note.projectId !== projectId),
              ...notes,
            ]
          : notes,
      }));
      return true;
    } catch {
      // Keep the fixtures visible when the local API is unavailable.
      return false;
    }
  },
  refreshNotifications: async (token) => {
    try {
      const notifications = await notificationsRequest(token);
      set({ notifications });
      return true;
    } catch {
      // Keep the fixtures visible when the local API is unavailable.
      return false;
    }
  },
  unreadNotificationCount: () =>
    get().notifications.filter((n) => !n.read).length,
}));
