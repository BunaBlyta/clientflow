import { useNavigation } from 'expo-router';
import { useRef } from 'react';

const NAVIGATION_COOLDOWN_MS = 800;

export type ProjectTabSource = 'home' | 'invoices' | 'notifications';

type ProjectTabTarget =
  | {
      screen: '[id]/index';
      params: { id: string; source: ProjectTabSource };
    }
  | {
      screen: '[id]/notes';
      params: { id: string; source: ProjectTabSource };
    }
  | {
      screen: '[id]/invoices/[invoiceId]/index';
      params: { id: string; invoiceId: string; source: ProjectTabSource };
    };

type TabsNavigation = {
  navigate: (tab: 'projects', target: ProjectTabTarget) => void;
};

export function useProjectTabNavigation() {
  const navigation = useNavigation() as unknown as TabsNavigation;
  // Shared across all three actions below: a tap on any of them should
  // block a rapid repeat tap on any of them, not just the same one, since
  // they all land the user on a newly-pushed screen.
  const lastNavigatedAt = useRef(0);

  function guard(navigate: () => void) {
    const now = Date.now();
    if (now - lastNavigatedAt.current < NAVIGATION_COOLDOWN_MS) return;
    lastNavigatedAt.current = now;
    navigate();
  }

  return {
    openProject(id: string, source: ProjectTabSource) {
      guard(() => navigation.navigate('projects', {
        screen: '[id]/index',
        params: { id, source },
      }));
    },
    openNotes(id: string, source: ProjectTabSource) {
      guard(() => navigation.navigate('projects', {
        screen: '[id]/notes',
        params: { id, source },
      }));
    },
    openInvoice(id: string, invoiceId: string, source: ProjectTabSource) {
      guard(() => navigation.navigate('projects', {
        screen: '[id]/invoices/[invoiceId]/index',
        params: { id, invoiceId, source },
      }));
    },
  };
}
