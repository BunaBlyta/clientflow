import { create } from 'zustand';
import {
  invoiceRequest,
  invoicesRequest,
  createNoteRequest,
  markNotificationReadRequest,
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
  refreshInvoice: (invoiceId: string, token: string, reconcilePayment?: boolean) => Promise<boolean>;
  refreshNotes: (token: string, projectId?: string) => Promise<boolean>;
  refreshNotifications: (token: string) => Promise<boolean>;
  postNote: (projectId: string, body: string, token: string) => Promise<boolean>;
  markNotificationRead: (id: string, token: string) => Promise<boolean>;
  markAllNotificationsRead: (token: string) => Promise<boolean>;
  unreadNotificationCount: () => number;
  resetData: () => void;
}

const developmentFixtures = __DEV__;
let sessionGeneration = 0;
const projectsRequestIds = new Map<string, number>();
const invoicesRequestIds = new Map<string, number>();
const notesRequestIds = new Map<string, number>();
let notificationsRequestId = 0;

function nextRequestId(requests: Map<string, number>, key: string) {
  const requestId = (requests.get(key) ?? 0) + 1;
  requests.set(key, requestId);
  return requestId;
}

export const useDataStore = create<DataState>((set, get) => ({
  // Fixtures are useful for the existing Expo web demo, but are never the
  // initial state of a production build. A reset always clears them too so a
  // second account cannot inherit the first account's records.
  projects: developmentFixtures ? MOCK_PROJECTS : [],
  invoices: developmentFixtures ? MOCK_INVOICES : [],
  notes: developmentFixtures ? MOCK_NOTES : [],
  notifications: developmentFixtures ? MOCK_NOTIFICATIONS : [],

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
    const generation = sessionGeneration;
    const requestKey = '__all__';
    const requestId = nextRequestId(projectsRequestIds, requestKey);
    try {
      const projects = await projectsRequest(token);
      if (generation === sessionGeneration && requestId === projectsRequestIds.get(requestKey)) {
        set({ projects });
      }
    } catch {
      // The API remains authoritative. Existing development fixtures are kept
      // only for the local web demo, never created in production.
    }
  },
  refreshProject: async (projectId, token) => {
    const generation = sessionGeneration;
    const requestKey = projectId;
    const requestId = nextRequestId(projectsRequestIds, requestKey);
    try {
      const project = await projectRequest(projectId, token);
      if (generation === sessionGeneration && requestId === projectsRequestIds.get(requestKey)) {
        set((state) => ({
          projects: state.projects.some((item) => item.id === project.id)
            ? state.projects.map((item) => (item.id === project.id ? project : item))
            : [...state.projects, project],
        }));
      }
    } catch {
    }
  },
  refreshInvoices: async (token, projectId) => {
    const generation = sessionGeneration;
    const requestKey = projectId ? `project:${projectId}` : '__all__';
    const requestId = nextRequestId(invoicesRequestIds, requestKey);
    try {
      const invoices = await invoicesRequest(token, projectId);
      if (generation === sessionGeneration && requestId === invoicesRequestIds.get(requestKey)) {
        set((state) => ({
          invoices: projectId
            ? [...state.invoices.filter((invoice) => invoice.projectId !== projectId), ...invoices]
            : invoices,
        }));
      }
      return true;
    } catch {
      // Keep the fixtures visible when the local API is unavailable.
      return false;
    }
  },
  refreshInvoice: async (invoiceId, token, reconcilePayment = false) => {
    const generation = sessionGeneration;
    const requestKey = `invoice:${invoiceId}`;
    const requestId = nextRequestId(invoicesRequestIds, requestKey);
    try {
      const invoice = await invoiceRequest(invoiceId, token, { reconcilePayment });
      if (generation === sessionGeneration && requestId === invoicesRequestIds.get(requestKey)) {
        set((state) => ({
          invoices: state.invoices.some((item) => item.id === invoice.id)
            ? state.invoices.map((item) => (item.id === invoice.id ? invoice : item))
            : [...state.invoices, invoice],
        }));
      }
      return true;
    } catch {
      // Keep the fixture visible when the local API is unavailable.
      return false;
    }
  },
  refreshNotes: async (token, projectId) => {
    const generation = sessionGeneration;
    const requestKey = projectId ? `project:${projectId}` : '__all__';
    const requestId = nextRequestId(notesRequestIds, requestKey);
    try {
      const notes = await notesRequest(token, projectId);
      if (generation === sessionGeneration && requestId === notesRequestIds.get(requestKey)) {
        set((state) => ({
          notes: projectId
            ? [
                ...state.notes.filter((note) => note.projectId !== projectId),
                ...notes,
              ]
            : notes,
        }));
      }
      return true;
    } catch {
      // Keep the fixtures visible when the local API is unavailable.
      return false;
    }
  },
  refreshNotifications: async (token) => {
    const generation = sessionGeneration;
    const requestId = ++notificationsRequestId;
    try {
      const notifications = await notificationsRequest(token);
      if (generation === sessionGeneration && requestId === notificationsRequestId) {
        set({ notifications });
      }
      return true;
    } catch {
      // Keep the fixtures visible when the local API is unavailable.
      return false;
    }
  },
  postNote: async (projectId, body, token) => {
    const generation = sessionGeneration;
    try {
      const note = await createNoteRequest(projectId, body, token);
      if (generation === sessionGeneration) {
        set((state) => ({
          notes: state.notes.some((item) => item.id === note.id)
            ? state.notes.map((item) => (item.id === note.id ? note : item))
            : [...state.notes, note],
        }));
      }
      return true;
    } catch {
      return false;
    }
  },
  markNotificationRead: async (id, token) => {
    const generation = sessionGeneration;
    try {
      const notification = await markNotificationReadRequest(id, token);
      if (generation === sessionGeneration) {
        set((state) => ({
          notifications: state.notifications.map((item) =>
            item.id === notification.id ? notification : item,
          ),
        }));
      }
      return true;
    } catch {
      return false;
    }
  },
  markAllNotificationsRead: async (token) => {
    const generation = sessionGeneration;
    const unreadIds = get()
      .notifications.filter((notification) => !notification.read)
      .map((notification) => notification.id);

    try {
      const notifications = await Promise.all(
        unreadIds.map((id) => markNotificationReadRequest(id, token)),
      );
      if (generation === sessionGeneration) {
        set((state) => ({
          notifications: state.notifications.map((item) =>
            notifications.find((notification) => notification.id === item.id) ?? item,
          ),
        }));
      }
      return true;
    } catch {
      return false;
    }
  },
  unreadNotificationCount: () =>
    get().notifications.filter((n) => !n.read).length,
  resetData: () => {
    sessionGeneration += 1;
    projectsRequestIds.clear();
    invoicesRequestIds.clear();
    notesRequestIds.clear();
    notificationsRequestId += 1;
    set({ projects: [], invoices: [], notes: [], notifications: [] });
  },
}));
