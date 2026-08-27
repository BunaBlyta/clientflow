import { useRouter } from 'expo-router';
import { FolderKanban } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { ProjectCard } from '../../../components/ProjectCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ProjectCardSkeleton } from '../../../components/ui/Skeleton';
import { Screen } from '../../../components/ui/Screen';
import { fontFamily, fontSize, spacing, textShadow, useTheme } from '../../../lib/theme';
import { useI18n } from '../../../lib/i18n';
import { useAuthStore } from '../../../store/auth-store';
import { useDataStore } from '../../../store/data-store';
import { useShallow } from 'zustand/react/shallow';
import { useEffect, useState } from 'react';

export default function ProjectsListScreen() {
  const router = useRouter();
  const { color } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(color);
  const token = useAuthStore((s) => s.token);
  const projects = useDataStore(useShallow((s) => s.projects));
  const refreshProjects = useDataStore((s) => s.refreshProjects);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let active = true;
    void refreshProjects(token).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [refreshProjects, token]);

  return (
    <Screen>
      <View style={styles.topbar}>
        <Text style={styles.title}>{t('tabs.projects')}</Text>
      </View>

      <View style={styles.list}>
        {loading && projects.length === 0 ? (
          <View>
            {Array.from({ length: 3 }).map((_, index) => (
              <ProjectCardSkeleton key={index} />
            ))}
          </View>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title={t('projects.emptyTitle')}
            subtitle={t('projects.emptySubtitle')}
          />
        ) : (
          <View>
            {projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                onPress={() => router.push(`/projects/${project.id}`)}
              />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

function createStyles(color: ReturnType<typeof useTheme>['color']) {
  return StyleSheet.create({
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  title: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.headingLg,
    color: color.textPrimary,
    ...textShadow,
  },
  list: {
    marginTop: 0,
  },
  listGroup: {
    gap: spacing.md,
  },
  });
}
