import { create } from 'zustand';
import { DEMO_PASSWORD, MOCK_CLIENT } from '../lib/mock-data';
import type { Client } from '../lib/types';

// Mocked auth state. No real backend/session persistence yet — this resets
// on app restart, which is fine for a clickable-prototype pass. A real
// integration would swap this for a token stored in expo-secure-store plus
// real API calls, keeping the same shape (isAuthenticated / client / actions).
interface AuthState {
  isAuthenticated: boolean;
  client: Client | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  client: null,
  login: (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();
    const ok =
      normalizedEmail === MOCK_CLIENT.email.toLowerCase() &&
      password === DEMO_PASSWORD;
    if (ok) {
      set({ isAuthenticated: true, client: MOCK_CLIENT });
    }
    return ok;
  },
  logout: () => set({ isAuthenticated: false, client: null }),
}));
