import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'clientflow.session.token';
const CLIENT_KEY = 'clientflow.session.client';

function getStorage(): Storage | null {
  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
    return null;
  }
  return globalThis.localStorage;
}

export async function readSession() {
  if (Platform.OS !== 'web') {
    const [token, clientJson] = await Promise.all([
      SecureStore.getItemAsync(TOKEN_KEY),
      SecureStore.getItemAsync(CLIENT_KEY),
    ]);
    if (!token || !clientJson) return null;

    try {
      return { token, client: JSON.parse(clientJson) };
    } catch {
      await clearSession();
      return null;
    }
  }

  const storage = getStorage();
  if (!storage) return null;

  const token = storage.getItem(TOKEN_KEY);
  const clientJson = storage.getItem(CLIENT_KEY);
  if (!token || !clientJson) return null;

  try {
    return { token, client: JSON.parse(clientJson) };
  } catch {
    void clearSession();
    return null;
  }
}

export async function writeSession(token: string, client: unknown) {
  if (Platform.OS !== 'web') {
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, token),
      SecureStore.setItemAsync(CLIENT_KEY, JSON.stringify(client)),
    ]);
    return;
  }

  getStorage()?.setItem(TOKEN_KEY, token);
  getStorage()?.setItem(CLIENT_KEY, JSON.stringify(client));
}

export async function clearSession() {
  if (Platform.OS !== 'web') {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(CLIENT_KEY),
    ]);
    return;
  }

  getStorage()?.removeItem(TOKEN_KEY);
  getStorage()?.removeItem(CLIENT_KEY);
}
