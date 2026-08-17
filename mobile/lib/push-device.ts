import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  registerPushDeviceRequest,
  unregisterPushDeviceRequest,
} from './api';

const projectId =
  Constants.easConfig?.projectId ??
  Constants.expoConfig?.extra?.eas?.projectId;
const appVersion = Constants.expoConfig?.version;

let registeredToken: string | null = null;

export function getRegisteredPushToken() {
  return registeredToken;
}

export async function registerPushDevice(authToken: string, token?: string) {
  if (Platform.OS !== 'ios' || !projectId) return null;

  const permission = await Notifications.getPermissionsAsync();
  if (permission.status === Notifications.PermissionStatus.DENIED) return null;

  const granted = permission.status === Notifications.PermissionStatus.GRANTED
    ? permission
    : await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      });
  if (granted.status !== Notifications.PermissionStatus.GRANTED) return null;

  const nextToken = token ?? (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  if (registeredToken === nextToken) return nextToken;

  if (registeredToken) {
    await unregisterPushDeviceRequest(registeredToken, authToken).catch(() => {});
  }
  await registerPushDeviceRequest(nextToken, 'IOS', authToken, appVersion);
  registeredToken = nextToken;
  return nextToken;
}

export async function unregisterPushTokenForSession(authToken: string) {
  if (!registeredToken) return;
  const token = registeredToken;
  registeredToken = null;
  await unregisterPushDeviceRequest(token, authToken).catch(() => {});
}
