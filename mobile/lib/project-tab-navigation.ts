import { useNavigation } from 'expo-router';

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

  return {
    openProject(id: string, source: ProjectTabSource) {
      navigation.navigate('projects', {
        screen: '[id]/index',
        params: { id, source },
      });
    },
    openNotes(id: string, source: ProjectTabSource) {
      navigation.navigate('projects', {
        screen: '[id]/notes',
        params: { id, source },
      });
    },
    openInvoice(id: string, invoiceId: string, source: ProjectTabSource) {
      navigation.navigate('projects', {
        screen: '[id]/invoices/[invoiceId]/index',
        params: { id, invoiceId, source },
      });
    },
  };
}
