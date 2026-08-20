import { useRouter } from 'expo-router';
import { FolderKanban } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { ProjectCard } from '../../../components/ProjectCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Screen } from '../../../components/ui/Screen';
import { fontFamily, fontSize, spacing, useTheme } from '../../../lib/theme';
import { useI18n } from '../../../lib/i18n';
import { useAuthStore } from '../../../store/auth-store';
import { useDataStore } from '../../../store/data-store';
import { useShallow } from 'zustand/react/shallow';
import { useEffect } from 'react';

export default function ProjectsListScreen() {
  const router = useRouter();
  const { color } = useTheme();
  const { t } = useI18n();
  const styles = createStyles(color);
  const client = useAuthStore((s) => s.client);
  const token = useAuthStore((s) => s.token);
  const projects = useDataStore(useShallow((s) => s.projects));
  const refreshProjects = useDataStore((s) => s.refreshProjects);

  useEffect(() => {
    if (token) void refreshProjects(token);
  }, [refreshProjects, token]);

  return (
    <Screen>
      <Text style={styles.greeting}>
        {client ? `${t('projects.hi')}, ${client.name.split(' ')[0]}` : t('projects.greeting')}
      </Text>
      <Text style={styles.company}>{client?.companyName ?? t('projects.greeting')}</Text>

      <View style={styles.list}>
        {projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title={t('projects.emptyTitle')}
            subtitle={t('projects.emptySubtitle')}
          />
        ) : (
          <View style={styles.listGroup}>
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
  greeting: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.headingLg,
    color: color.textPrimary,
  },
  company: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    color: color.textMuted,
    marginTop: 2,
    marginBottom: spacing.xl,
  },
  list: {
    marginTop: spacing.sm,
  },
  listGroup: {
    backgroundColor: color.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  });
}
