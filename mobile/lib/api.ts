import type { Language } from './i18n';
import type { Client, Invoice, Note, Notification, Project } from './types';

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const baseUrl = configuredBaseUrl || 'http://localhost:3000';
const REQUEST_TIMEOUT_MS = 12_000;
export const NOTIFICATION_PAGE_SIZE = 20;
export const MAX_NOTE_BODY_LENGTH = 10_000;

const notificationTypes: Notification['type'][] = [
  'REQUEST_SUBMITTED',
  'REQUEST_APPROVED',
  'REQUEST_REJECTED',
  'INVOICE_ISSUED',
  'PAYMENT_SUCCEEDED',
  'PAYMENT_FAILED',
  'PROJECT_STAGE_CHANGED',
  'NEW_NOTE',
  'EXTRA_CHARGE_CREATED',
];

export interface NotificationPage {
  notifications: Notification[];
  page: number;
  limit: number;
  hasMore: boolean;
  nextCursor?: string | null;
  total?: number;
  unreadCount?: number;
}

export interface NotificationRequestOptions {
  page?: number;
  limit?: number;
  cursor?: string | null;
  /** The API contract uses active, archived, or all archive views. */
  archived?: 'active' | 'archived' | 'all';
  /** Compatibility with an intermediate API shape used during rollout. */
  includeArchived?: boolean;
}

export interface NotificationMutationResponse {
  notification: Notification | null;
  archived?: boolean;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function unwrapNotification(value: unknown): Record<string, unknown> | null {
  let candidate = value;
  for (let depth = 0; depth < 3; depth += 1) {
    const record = asRecord(candidate);
    if (!record) return null;
    if (asRecord(record.notification)) {
      candidate = record.notification;
      continue;
    }
    if (asRecord(record.data) && !('id' in record)) {
      candidate = record.data;
      continue;
    }
    return record;
  }
  return asRecord(candidate);
}

function nullableId(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function archivedValue(record: Record<string, unknown>): boolean | undefined {
  if (typeof record.archived === 'boolean') return record.archived;
  if (typeof record.isArchived === 'boolean') return record.isArchived;
  if ('archivedAt' in record) return record.archivedAt !== null;
  return undefined;
}

/**
 * Normalize old and new API payloads at the network boundary. The old API
 * returned `body`/`read`; the archive-aware API may also expose `message`,
 * `readAt`, `isArchived`, or `archivedAt`.
 */
export function normalizeNotificationPayload(value: unknown): Notification | null {
  const record = unwrapNotification(value);
  if (!record) return null;

  const type = record.type;
  const title = record.title;
  const body = record.body ?? record.message;
  const read =
    typeof record.read === 'boolean'
      ? record.read
      : typeof record.isRead === 'boolean'
        ? record.isRead
        : record.readAt !== undefined
          ? record.readAt !== null
          : undefined;

  if (
    typeof record.id !== 'string' ||
    record.id.length === 0 ||
    !notificationTypes.includes(type as Notification['type']) ||
    typeof title !== 'string' ||
    typeof body !== 'string' ||
    typeof read !== 'boolean' ||
    typeof record.createdAt !== 'string'
  ) {
    return null;
  }

  const notification: Notification = {
    id: record.id,
    type: type as Notification['type'],
    title,
    body,
    read,
    createdAt: record.createdAt,
  };
  const archived = archivedValue(record);
  if (archived !== undefined) notification.archived = archived;

  const projectId = nullableId(record.projectId);
  const invoiceId = nullableId(record.invoiceId);
  const requestId = nullableId(record.requestId);
  if (projectId) notification.projectId = projectId;
  if (invoiceId) notification.invoiceId = invoiceId;
  if (requestId) notification.requestId = requestId;
  return notification;
}

function positiveInteger(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const parsed = Number(value);
    if (Number.isSafeInteger(parsed) && parsed > 0) return parsed;
  }
  return undefined;
}

function nonNegativeInteger(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) return value;
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const parsed = Number(value);
    if (Number.isSafeInteger(parsed) && parsed >= 0) return parsed;
  }
  return undefined;
}

function notificationItems(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;
  const record = asRecord(value);
  if (!record) return null;
  for (const key of ['notifications', 'items', 'results', 'data']) {
    const candidate = record[key];
    if (Array.isArray(candidate)) return candidate;
    const nested = asRecord(candidate);
    if (nested) {
      const nestedItems = notificationItems(nested);
      if (nestedItems) return nestedItems;
    }
  }
  return null;
}

function pageMetadata(value: unknown): Record<string, unknown> {
  const record = asRecord(value);
  if (!record) return {};
  const pagination = asRecord(record.pagination) ?? asRecord(record.meta);
  return { ...record, ...(pagination ?? {}) };
}

/**
 * Accept both the pre-pagination array and the paginated object while the API
 * rollout is in flight. Missing pagination metadata intentionally means there
 * is no next page, preventing an old full-array endpoint from being fetched
 * repeatedly when the user reaches the bottom.
 */
export function normalizeNotificationPage(
  value: unknown,
  fallbackPage = 1,
  fallbackLimit = NOTIFICATION_PAGE_SIZE,
): NotificationPage {
  const rawItems = notificationItems(value) ?? [];
  const notifications = rawItems
    .map((item) => normalizeNotificationPayload(item))
    .filter((item): item is Notification => item !== null);
  const metadata = pageMetadata(value);
  const page = positiveInteger(metadata.page) ?? fallbackPage;
  const limit = positiveInteger(metadata.limit ?? metadata.pageSize ?? metadata.perPage) ?? fallbackLimit;
  const total = nonNegativeInteger(metadata.total ?? metadata.totalCount);
  const unreadCount = nonNegativeInteger(metadata.unreadCount ?? metadata.unreadTotal ?? metadata.unread);
  const nextCursor =
    typeof metadata.nextCursor === 'string'
      ? metadata.nextCursor
      : metadata.nextCursor === null
        ? null
        : undefined;

  let hasMore = false;
  if (typeof metadata.hasMore === 'boolean') hasMore = metadata.hasMore;
  else if (typeof metadata.hasNextPage === 'boolean') hasMore = metadata.hasNextPage;
  else if (typeof metadata.hasNext === 'boolean') hasMore = metadata.hasNext;
  else if (nextCursor !== undefined) hasMore = nextCursor !== null;
  else {
    const totalPages = positiveInteger(metadata.totalPages ?? metadata.pages);
    const nextPage = positiveInteger(metadata.nextPage);
    if (totalPages !== undefined) hasMore = page < totalPages;
    else if (nextPage !== undefined) hasMore = nextPage > page;
  }

  return {
    notifications,
    page,
    limit,
    hasMore,
    ...(nextCursor !== undefined ? { nextCursor } : {}),
    ...(total !== undefined ? { total } : {}),
    ...(unreadCount !== undefined ? { unreadCount } : {}),
  };
}

function notificationMutation(value: unknown, requestedArchived: boolean): NotificationMutationResponse {
  const notification = normalizeNotificationPayload(value);
  const record = asRecord(value);
  const archived =
    notification?.archived ??
    archivedValue(record ?? {}) ??
    requestedArchived;
  return { notification, archived };
}

async function request<T>(path: string, init: RequestInit = {}, token?: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('The server took too long to respond. Check your connection and try again.', 408);
    }
    throw new ApiError('Unable to reach Clientflow. Check your connection and try again.', 0);
  } finally {
    clearTimeout(timeout);
  }

  const body = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;
  if (!response.ok) {
    throw new ApiError(body?.error || 'Something went wrong.', response.status);
  }

  return body as T;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export function loginRequest(email: string, password: string) {
  return request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function verificationSendRequest(email: string) {
  return request<{ sent: boolean; registered: true }>('/api/auth/verification/send', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function verificationCheckRequest(email: string, code: string) {
  return request<{ verified: true; user: AuthUser }>('/api/auth/verification/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export function setPasswordRequest(email: string, code: string, password: string) {
  return request<LoginResponse>('/api/auth/set-password', {
    method: 'POST',
    body: JSON.stringify({ email, code, password }),
  });
}

export function projectRequest(projectId: string, token: string) {
  return request<Project>(`/api/projects/${encodeURIComponent(projectId)}`, {}, token);
}

export function projectsRequest(token: string) {
  return request<Project[]>('/api/projects', {}, token);
}

export function invoicesRequest(token: string, projectId?: string) {
  const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
  return request<Invoice[]>(`/api/invoices${query}`, {}, token);
}

export function invoiceRequest(
  invoiceId: string,
  token: string,
  options?: { reconcilePayment?: boolean },
) {
  const query = options?.reconcilePayment ? '?reconcilePayment=true' : '';
  return request<Invoice>(
    `/api/invoices/${encodeURIComponent(invoiceId)}${query}`,
    {},
    token,
  );
}

export function notesRequest(token: string, projectId?: string) {
  const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
  return request<Note[]>(`/api/notes${query}`, {}, token);
}

export function createNoteRequest(projectId: string, body: string, token: string) {
  return request<Note>('/api/notes', {
    method: 'POST',
    body: JSON.stringify({ projectId, body }),
  }, token);
}

export function notificationsRequest(
  token: string,
  options: NotificationRequestOptions = {},
) {
  const params = new URLSearchParams();
  params.set('page', String(options.page ?? 1));
  params.set('limit', String(options.limit ?? NOTIFICATION_PAGE_SIZE));
  // Archived records must remain addressable so the app can offer unarchive.
  // The documented API calls this filter `archived`; the compatibility branch
  // keeps the client tolerant of the intermediate boolean contract.
  if (options.archived !== undefined) {
    params.set('archived', options.archived);
  } else if (options.includeArchived !== undefined) {
    params.set('archived', options.includeArchived ? 'all' : 'active');
  }
  if (options.cursor) params.set('cursor', options.cursor);
  return request<unknown>(`/api/notifications?${params.toString()}`, {}, token).then((payload) =>
    normalizeNotificationPage(payload, options.page ?? 1, options.limit ?? NOTIFICATION_PAGE_SIZE),
  );
}

export function realtimeTokenRequest(token: string) {
  return request<unknown>('/api/realtime/token', {}, token);
}

export type PushDevicePlatform = 'IOS';

export function registerPushDeviceRequest(
  pushToken: string,
  platform: PushDevicePlatform,
  token: string,
  appVersion?: string,
) {
  return request<{ id: string; token: string }>('/api/notifications/devices', {
    method: 'POST',
    body: JSON.stringify({ token: pushToken, platform, ...(appVersion ? { appVersion } : {}) }),
  }, token);
}

export function unregisterPushDeviceRequest(pushToken: string, token: string) {
  return request<{ deleted: boolean }>('/api/notifications/devices', {
    method: 'DELETE',
    body: JSON.stringify({ token: pushToken }),
  }, token);
}

export function markNotificationReadRequest(notificationId: string, token: string) {
  return request<unknown>(
    `/api/notifications/${encodeURIComponent(notificationId)}`,
    { method: 'PATCH' },
    token,
  ).then((payload) => {
    const notification = normalizeNotificationPayload(payload);
    if (!notification) throw new ApiError('The server returned an invalid notification.', 502);
    return notification;
  });
}

export function archiveNotificationRequest(
  notificationId: string,
  archived: boolean,
  token: string,
) {
  return request<unknown>(
    `/api/notifications/${encodeURIComponent(notificationId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ archived }),
    },
    token,
  ).then((payload) => notificationMutation(payload, archived));
}

export interface ContentTranslationResponse {
  translatedText: string;
}

function translatedTextFromPayload(value: unknown): string | null {
  if (typeof value === 'string') return value.trim() || null;
  const record = asRecord(value);
  if (!record) return null;
  for (const key of ['translatedText', 'translation', 'translated', 'text']) {
    if (typeof record[key] === 'string' && record[key].trim()) return record[key].trim();
  }
  for (const key of ['data', 'result']) {
    const nested = translatedTextFromPayload(record[key]);
    if (nested) return nested;
  }
  return null;
}

export function translateContentRequest(
  text: string,
  targetLanguage: Language,
  token: string,
) {
  async function requestTranslation() {
    const payload = await request<unknown>('/api/translate', {
      method: 'POST',
      body: JSON.stringify({
        text,
        targetLanguage,
        sourceLanguage: 'auto',
      }),
    }, token);
    const translatedText = translatedTextFromPayload(payload);
    if (!translatedText) {
      throw new ApiError('The translation service returned no text.', 502);
    }
    return { translatedText } satisfies ContentTranslationResponse;
  }

  return requestTranslation();
}

export interface CheckoutResponse {
  checkoutSessionId: string;
  checkoutUrl: string;
}

export function checkoutRequest(invoiceId: string, token: string) {
  return request<CheckoutResponse>('/api/stripe/checkout', {
    method: 'POST',
    body: JSON.stringify({ invoiceId, returnTo: 'mobile' }),
  }, token);
}

export function clientFromUser(user: LoginResponse['user']): Client {
  return {
    id: user.id,
    name: user.name,
    companyName: user.name,
    email: user.email,
  };
}
