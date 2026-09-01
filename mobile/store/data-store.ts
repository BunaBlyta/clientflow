import { create } from 'zustand';
import {
  archiveNotificationRequest,
  invoiceRequest,
  invoicesRequest,
  createNoteRequest,
  markNotificationReadRequest,
  NOTIFICATION_PAGE_SIZE,
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

export type NotePostResult =
  | { ok: true; note: Note }
  | { ok: false; status: number; message: string };

interface DataState {
  projects: Project[];
  invoices: Invoice[];
  notes: Note[];
  notifications: Notification[];
  notificationPage: number;
  notificationsHasMore: boolean;
  notificationsNextCursor?: string | null;
  notificationsLoading: boolean;
  notificationsLoadingMore: boolean;
  notificationsTotal: number | null;
  notificationsUnreadCount: number | null;
  notificationsUnreadCountFromServer: boolean;
  notificationsHydrated: boolean;

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
  refreshNotifications: (token: string, options?: { reset?: boolean }) => Promise<boolean>;
  loadMoreNotifications: (token: string) => Promise<boolean>;
  mergeNotification: (notification: Notification) => boolean;
  mergeNote: (note: Note) => void;
  postNote: (projectId: string, body: string, token: string) => Promise<NotePostResult>;
  markNotificationRead: (id: string, token: string) => Promise<boolean>;
  markAllNotificationsRead: (token: string) => Promise<boolean>;
  archiveNotification: (id: string, archived: boolean, token: string) => Promise<boolean>;
  unreadNotificationCount: () => number;
  resetData: () => void;
}

const developmentFixtures = __DEV__;
let sessionGeneration = 0;
const projectsRequestIds = new Map<string, number>();
const invoicesRequestIds = new Map<string, number>();
const notesRequestIds = new Map<string, number>();
const locallyCreatedNoteIds = new Set<string>();
let notificationsRequestId = 0;
const realtimeNotificationIds = new Set<string>();

function nextRequestId(requests: Map<string, number>, key: string) {
  const requestId = (requests.get(key) ?? 0) + 1;
  requests.set(key, requestId);
  return requestId;
}

function sortNotifications(notifications: Notification[]) {
  return [...notifications].sort((a, b) => {
    if (a.createdAt === b.createdAt) return a.id < b.id ? 1 : -1;
    return a.createdAt < b.createdAt ? 1 : -1;
  });
}

function mergeNotificationList(current: Notification[], incoming: Notification[]) {
  const byId = new Map(current.map((notification) => [notification.id, notification]));
  for (const notification of incoming) {
    const existing = byId.get(notification.id);
    byId.set(notification.id, {
      ...existing,
      ...notification,
      ...(existing && notification.archived === undefined
        ? { archived: existing.archived }
        : {}),
    });
  }
  return sortNotifications([...byId.values()]);
}

function countUnread(notifications: Notification[]) {
  return notifications.reduce((count, notification) => count + (notification.read ? 0 : 1), 0);
}

export const useDataStore = create<DataState>((set, get) => ({
  // Fixtures are useful for the existing Expo web demo, but are never the
  // initial state of a production build. A reset always clears them too so a
  // second account cannot inherit the first account's records.
  projects: developmentFixtures ? MOCK_PROJECTS : [],
  invoices: developmentFixtures ? MOCK_INVOICES : [],
  notes: developmentFixtures ? MOCK_NOTES : [],
  notifications: developmentFixtures ? MOCK_NOTIFICATIONS : [],
  notificationPage: 1,
  notificationsHasMore: false,
  notificationsNextCursor: undefined,
  notificationsLoading: false,
  notificationsLoadingMore: false,
  notificationsTotal: null,
  notificationsUnreadCount: null,
  notificationsUnreadCountFromServer: false,
  notificationsHydrated: false,

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
      const visibleNotes =
        developmentFixtures && notes.length === 0
          ? MOCK_NOTES.filter((note) => !projectId || note.projectId === projectId)
          : notes;
      if (generation === sessionGeneration && requestId === notesRequestIds.get(requestKey)) {
        const visibleNoteIds = new Set(visibleNotes.map((note) => note.id));
        for (const noteId of visibleNoteIds) locallyCreatedNoteIds.delete(noteId);
        set((state) => ({
          notes: projectId
            ? [
                ...state.notes.filter(
                  (note) =>
                    note.projectId !== projectId ||
                    (locallyCreatedNoteIds.has(note.id) && !visibleNoteIds.has(note.id)),
                ),
                ...visibleNotes,
              ]
            : [
                ...visibleNotes,
                ...state.notes.filter(
                  (note) => locallyCreatedNoteIds.has(note.id) && !visibleNoteIds.has(note.id),
                ),
              ],
        }));
      }
      return true;
    } catch {
      // Keep the fixtures visible when the local API is unavailable.
      if (developmentFixtures) {
        const fallbackNotes = MOCK_NOTES.filter((note) => !projectId || note.projectId === projectId);
        if (fallbackNotes.length > 0) {
          set((state) => ({
            notes: projectId
              ? [
                  ...state.notes.filter((note) => note.projectId !== projectId),
                  ...fallbackNotes,
                ]
              : fallbackNotes,
          }));
        }
      }
      return false;
    }
  },
  refreshNotifications: async (token, options = {}) => {
    const generation = sessionGeneration;
    const requestId = ++notificationsRequestId;
    const reset = options.reset === true;
    set({ notificationsLoading: true, notificationsLoadingMore: false });
    try {
      const page = await notificationsRequest(token, {
        page: 1,
        limit: NOTIFICATION_PAGE_SIZE,
        archived: 'all',
      });
      if (generation === sessionGeneration && requestId === notificationsRequestId) {
        set((state) => {
          // The first successful API response replaces development fixtures.
          // A focus refresh can explicitly reset to the bounded first page;
          // realtime items received while it was loading are retained.
          const preserveLoadedPages = state.notificationsHydrated && !reset;
          const base = preserveLoadedPages
            ? state.notifications
            : state.notifications.filter((notification) => realtimeNotificationIds.has(notification.id));
          const notifications = mergeNotificationList(base, page.notifications);
          const total = page.total ?? (preserveLoadedPages ? state.notificationsTotal : null);
          const unreadCountFromServer = page.unreadCount !== undefined
            ? true
            : preserveLoadedPages && state.notificationsUnreadCountFromServer;
          return {
            notifications,
            notificationPage: preserveLoadedPages
              ? Math.max(state.notificationPage, page.page)
              : page.page,
            // Always trust the freshest page-1 response rather than OR-ing
            // with the previous value — a stale `true` from before must not
            // stick around once the server confirms there's nothing left.
            notificationsHasMore: total !== null
              ? notifications.length < total
              : page.hasMore && page.notifications.length >= page.limit,
            notificationsNextCursor: preserveLoadedPages
              ? state.notificationsNextCursor
              : page.nextCursor,
            notificationsTotal: total,
            notificationsUnreadCount: page.unreadCount
              ?? (unreadCountFromServer
                ? state.notificationsUnreadCount
                : countUnread(notifications)),
            notificationsUnreadCountFromServer: unreadCountFromServer,
            notificationsHydrated: true,
          };
        });
      }
      return true;
    } catch {
      // Keep the fixtures visible when the local API is unavailable.
      return false;
    } finally {
      if (generation === sessionGeneration && requestId === notificationsRequestId) {
        set({ notificationsLoading: false });
      }
    }
  },
  loadMoreNotifications: async (token) => {
    const state = get();
    if (state.notificationsLoading || state.notificationsLoadingMore || !state.notificationsHasMore) {
      return true;
    }

    const generation = sessionGeneration;
    const requestId = ++notificationsRequestId;
    const pageNumber = state.notificationPage + 1;
    set({ notificationsLoadingMore: true });
    try {
      const page = await notificationsRequest(token, {
        page: pageNumber,
        limit: NOTIFICATION_PAGE_SIZE,
        cursor: state.notificationsNextCursor,
        archived: 'all',
      });
      if (generation === sessionGeneration && requestId === notificationsRequestId) {
        set((current) => {
          const notifications = mergeNotificationList(current.notifications, page.notifications);
          const total = page.total ?? current.notificationsTotal;
          const unreadCountFromServer = page.unreadCount !== undefined || current.notificationsUnreadCountFromServer;
          return {
            notifications,
            notificationPage: Math.max(current.notificationPage, page.page),
            notificationsHasMore: total !== null
              ? notifications.length < total
              : page.hasMore && page.notifications.length >= page.limit,
            notificationsNextCursor: page.nextCursor,
            notificationsTotal: total,
            notificationsUnreadCount: page.unreadCount
              ?? (unreadCountFromServer
                ? current.notificationsUnreadCount
                : countUnread(notifications)),
            notificationsUnreadCountFromServer: unreadCountFromServer,
            notificationsHydrated: true,
          };
        });
      }
      return true;
    } catch {
      return false;
    } finally {
      if (generation === sessionGeneration && requestId === notificationsRequestId) {
        set({ notificationsLoadingMore: false });
      }
    }
  },
  mergeNotification: (notification) => {
    realtimeNotificationIds.add(notification.id);
    const exists = get().notifications.some((item) => item.id === notification.id);
    set((state) => {
      const existing = state.notifications.find((item) => item.id === notification.id);
      const notifications = mergeNotificationList(state.notifications, [notification]);
      let unreadCount = state.notificationsUnreadCount;
      if (unreadCount !== null && !existing && !notification.read) unreadCount += 1;
      else if (unreadCount !== null && existing && existing.read && !notification.read) unreadCount += 1;
      else if (unreadCount !== null && existing && !existing.read && notification.read) unreadCount = Math.max(0, unreadCount - 1);
      return { notifications, notificationsUnreadCount: unreadCount };
    });
    return !exists;
  },
  mergeNote: (note) => {
    locallyCreatedNoteIds.add(note.id);
    set((state) => ({
      notes: state.notes.some((item) => item.id === note.id)
        ? state.notes.map((item) => (item.id === note.id ? note : item))
        : [...state.notes, note],
    }));
  },
  postNote: async (projectId, body, token) => {
    try {
      const note = await createNoteRequest(projectId, body, token);
      return { ok: true, note };
    } catch (error) {
      return {
        ok: false,
        status: typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number'
          ? error.status
          : 0,
        message: error instanceof Error ? error.message : '',
      };
    }
  },
  markNotificationRead: async (id, token) => {
    const generation = sessionGeneration;
    try {
      const notification = await markNotificationReadRequest(id, token);
      if (generation === sessionGeneration) {
        set((state) => {
          const current = state.notifications.find((item) => item.id === notification.id);
          const notifications = mergeNotificationList(state.notifications, [notification]);
          const becameRead = current && !current.read && notification.read;
          const unreadCount = state.notificationsUnreadCount === null
            ? null
            : becameRead
              ? Math.max(0, state.notificationsUnreadCount - 1)
              : state.notificationsUnreadCount;
          return {
            notifications,
            notificationsUnreadCount: unreadCount ?? countUnread(notifications),
          };
        });
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
      const results = await Promise.allSettled(
        unreadIds.map((id) => markNotificationReadRequest(id, token)),
      );
      const notifications = results
        .filter((result): result is PromiseFulfilledResult<Notification> => result.status === 'fulfilled')
        .map((result) => result.value);
      if (generation === sessionGeneration) {
        set((state) => {
          const merged = mergeNotificationList(state.notifications, notifications);
          const newlyRead = notifications.filter((notification) => {
            const previous = state.notifications.find((item) => item.id === notification.id);
            return previous && !previous.read && notification.read;
          }).length;
          return {
            notifications: merged,
            notificationsUnreadCount: state.notificationsUnreadCount === null
              ? countUnread(merged)
              : Math.max(0, state.notificationsUnreadCount - newlyRead),
          };
        });
      }
      return results.every((result) => result.status === 'fulfilled');
    } catch {
      return false;
    }
  },
  archiveNotification: async (id, archived, token) => {
    const generation = sessionGeneration;
    try {
      const current = get().notifications.find((item) => item.id === id);
      // Archiving implies read: a notification the client is putting away is
      // one they're done with, so it should also stop counting as unread.
      // Unarchiving leaves read state untouched either way.
      const alsoMarkRead = archived && current ? !current.read : false;
      const [result] = await Promise.all([
        archiveNotificationRequest(id, archived, token),
        alsoMarkRead ? markNotificationReadRequest(id, token) : Promise.resolve(null),
      ]);
      if (generation === sessionGeneration) {
        set((state) => {
          const existing = state.notifications.find((item) => item.id === id);
          if (!existing && !result.notification) return state;
          const serverNotification = result.notification;
          const next = serverNotification
            ? {
                ...(existing ?? serverNotification),
                ...serverNotification,
                read: archived ? true : (existing ? existing.read : serverNotification.read),
                archived: result.archived ?? serverNotification.archived ?? archived,
              }
            : { ...existing!, archived, read: archived ? true : existing!.read };
          const notifications = mergeNotificationList(
            state.notifications.filter((item) => item.id !== id),
            [next],
          );
          const becameRead = Boolean(archived && existing && !existing.read);
          const unreadCount = state.notificationsUnreadCount === null
            ? null
            : becameRead
              ? Math.max(0, state.notificationsUnreadCount - 1)
              : state.notificationsUnreadCount;
          return {
            notifications,
            notificationsUnreadCount: unreadCount ?? countUnread(notifications),
          };
        });
      }
      return true;
    } catch {
      return false;
    }
  },
  unreadNotificationCount: () =>
    get().notificationsUnreadCount ?? countUnread(get().notifications),
  resetData: () => {
    sessionGeneration += 1;
    projectsRequestIds.clear();
    invoicesRequestIds.clear();
    notesRequestIds.clear();
    locallyCreatedNoteIds.clear();
    notificationsRequestId += 1;
    realtimeNotificationIds.clear();
    set({
      projects: [],
      invoices: [],
      notes: [],
      notifications: [],
      notificationPage: 1,
      notificationsHasMore: false,
      notificationsNextCursor: undefined,
      notificationsLoading: false,
      notificationsLoadingMore: false,
      notificationsTotal: null,
      notificationsUnreadCount: null,
      notificationsUnreadCountFromServer: false,
      notificationsHydrated: false,
    });
  },
}));
