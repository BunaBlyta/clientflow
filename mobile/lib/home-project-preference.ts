import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Which of the client's projects shows on the Home screen. Per-device only
// (SecureStore/localStorage, same mechanism as the language and theme
// preferences in lib/i18n.ts and lib/theme.ts) — no backend field, so it
// doesn't follow the client across devices or a reinstall.
const HOME_PROJECT_KEY = 'clientflow.preferences.homeProjectId';

function getWebStorage(): Storage | null {
  if (Platform.OS !== 'web' || typeof globalThis === 'undefined' || !('localStorage' in globalThis)) return null;
  return globalThis.localStorage;
}

export async function readHomeProjectId(): Promise<string | null> {
  const value = Platform.OS === 'web'
    ? getWebStorage()?.getItem(HOME_PROJECT_KEY)
    : await SecureStore.getItemAsync(HOME_PROJECT_KEY);
  return value ?? null;
}

export async function writeHomeProjectId(id: string) {
  if (Platform.OS === 'web') {
    getWebStorage()?.setItem(HOME_PROJECT_KEY, id);
    return;
  }
  await SecureStore.setItemAsync(HOME_PROJECT_KEY, id);
}
