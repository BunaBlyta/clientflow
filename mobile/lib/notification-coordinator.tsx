import * as Notifications from 'expo-notifications';
import { useRootNavigationState, useRouter } from 'expo-router';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/auth-store';
import { useDataStore } from '../store/data-store';
import { registerPushDevice } from './push-device';
import type { Notification as AppNotification } from './types';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

const notificationTypes: AppNotification['type'][] = [
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

const safeId = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= 128 && /^[A-Za-z0-9_-]+$/.test(value);

export interface PushNotificationData {
  notificationId: string;
  type: AppNotification['type'];
  projectId?: string;
  invoiceId?: string;
  requestId?: string;
}

export function parsePushNotificationData(value: unknown): PushNotificationData | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  if (!safeId(data.notificationId) || !notificationTypes.includes(data.type as AppNotification['type'])) {
    return null;
  }
  const parsed: PushNotificationData = {
    notificationId: data.notificationId,
    type: data.type as AppNotification['type'],
  };
  if (data.projectId !== undefined) {
    if (!safeId(data.projectId)) return null;
    parsed.projectId = data.projectId;
  }
  if (data.invoiceId !== undefined) {
    if (!safeId(data.invoiceId)) return null;
    parsed.invoiceId = data.invoiceId;
  }
  if (data.requestId !== undefined) {
    if (!safeId(data.requestId)) return null;
    parsed.requestId = data.requestId;
  }
  return parsed;
}

export function notificationTarget(data: PushNotificationData): string | null {
  const projectId = data.projectId ? encodeURIComponent(data.projectId) : null;
  const invoiceId = data.invoiceId ? encodeURIComponent(data.invoiceId) : null;
  if (data.type === 'NEW_NOTE' && projectId) return `/projects/${projectId}/notes`;
  if (projectId && invoiceId) return `/projects/${projectId}/invoices/${invoiceId}`;
  if (projectId) return `/projects/${projectId}`;
  return null;
}
function dataFromNotification(notification: Notifications.Notification) {
  return parsePushNotificationData(notification.request.content.data);
}

function dataFromResponse(response: Notifications.NotificationResponse) {
  return dataFromNotification(response.notification);
}

export function NotificationCoordinator() {
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const refreshNotifications = useDataStore((state) => state.refreshNotifications);
  const refreshProjects = useDataStore((state) => state.refreshProjects);
  const refreshInvoices = useDataStore((state) => state.refreshInvoices);
  const refreshNotes = useDataStore((state) => state.refreshNotes);
  const refreshProject = useDataStore((state) => state.refreshProject);
  const refreshInvoice = useDataStore((state) => state.refreshInvoice);
  const markNotificationRead = useDataStore((state) => state.markNotificationRead);
  const processedResponses = useRef(new Set<string>());

  useEffect(() => {
    if (Platform.OS === 'web' || !isAuthenticated || !token) return;
    void registerPushDevice(token).catch(() => {
      // Push is an optional transport. Durable in-app notifications remain
      // available when permission, credentials, or the network are unavailable.
    });
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (Platform.OS === 'web' || !isAuthenticated || !token) return;
    const authToken = token;
    let active = true;
    let wasBackgrounded = false;

    async function reconcile(data: PushNotificationData | null) {
      if (!active) return;
      const jobs: Promise<unknown>[] = [refreshNotifications(authToken)];
      if (data?.projectId) jobs.push(refreshProject(data.projectId, authToken));
      if (data?.invoiceId) {
        jobs.push(
          refreshInvoice(
            data.invoiceId,
            authToken,
            data.type === 'PAYMENT_SUCCEEDED' || data.type === 'PAYMENT_FAILED',
          ),
        );
      }
      if (data?.type === 'NEW_NOTE' && data.projectId) {
        jobs.push(refreshNotes(authToken, data.projectId));
      }
      await Promise.allSettled(jobs);
    }

    async function handleResponse(response: Notifications.NotificationResponse) {
      const data = dataFromResponse(response);
      if (!data) return;
      const responseKey = `${response.notification.request.identifier}:${data.notificationId}`;
      if (processedResponses.current.has(responseKey)) return;
      processedResponses.current.add(responseKey);
      await reconcile(data);
      if (!active || !navigationState?.key) return;
      if (!useDataStore.getState().notifications.find((item) => item.id === data.notificationId)?.read) {
        await markNotificationRead(data.notificationId, authToken);
      }
      const target = notificationTarget(data);
      if (target) router.push(target);
    }

    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      void reconcile(dataFromNotification(notification));
    });
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      void handleResponse(response);
    });
    const tokenSubscription = Notifications.addPushTokenListener(({ data }) => {
      void registerPushDevice(authToken, data).catch(() => {});
    });

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response && active) void handleResponse(response);
    });

    const appStateSubscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState !== 'active') {
        wasBackgrounded = true;
        return;
      }
      if (!wasBackgrounded) return;
      wasBackgrounded = false;
      void Promise.allSettled([
        refreshNotifications(authToken),
        refreshProjects(authToken),
        refreshInvoices(authToken),
        refreshNotes(authToken),
        registerPushDevice(authToken),
      ]);
    });

    return () => {
      active = false;
      receivedSubscription.remove();
      responseSubscription.remove();
      tokenSubscription.remove();
      appStateSubscription.remove();
    };
  }, [
    isAuthenticated,
    markNotificationRead,
    navigationState?.key,
    refreshInvoice,
    refreshInvoices,
    refreshNotes,
    refreshNotifications,
    refreshProject,
    refreshProjects,
    router,
    token,
  ]);

  return null;
}
