import { create } from 'zustand';
import { clientFromUser, loginRequest } from '../lib/api';
import { clearSession, readSession, writeSession } from '../lib/token-storage';
import type { Client } from '../lib/types';

interface AuthState {
  isAuthenticated: boolean;
  client: Client | null;
  token: string | null;
  isRestoring: boolean;
  restoreSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  client: null,
  token: null,
  isRestoring: true,
  restoreSession: async () => {
    const session = await readSession();
    set({
      isAuthenticated: Boolean(session),
      client: session?.client ?? null,
      token: session?.token ?? null,
      isRestoring: false,
    });
  },
  login: async (email, password) => {
    try {
      const response = await loginRequest(email.trim().toLowerCase(), password);
      const client = clientFromUser(response.user);
      await writeSession(response.token, client);
      set({ isAuthenticated: true, client, token: response.token });
      return true;
    } catch {
      return false;
    }
  },
  logout: () => {
    void clearSession();
    set({ isAuthenticated: false, client: null, token: null });
  },
}));
