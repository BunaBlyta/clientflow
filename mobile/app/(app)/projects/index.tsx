import { useRouter } from 'expo-router';
import { FolderKanban } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { ProjectCard } from '../../../components/ProjectCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Screen } from '../../../components/ui/Screen';
import { color, fontFamily, fontSize, spacing } from '../../../lib/theme';
import { useAuthStore } from '../../../store/auth-store';
import { useDataStore } from '../../../store/data-store';
import { useShallow } from 'zustand/react/shallow';

export default function ProjectsListScreen() {
  const router = useRouter();
  const client = useAuthStore((s) => s.client);
  const projects = useDataStore(
    useShallow((s) => (client ? s.projectsForClient(client.id) : []))
  );

  return (
    <Screen>
      <Text style={styles.greeting}>
        {client ? `Hi, ${client.name.split(' ')[0]}` : 'Your projects'}
      </Text>
      {client?.companyName && (
        <Text style={styles.company}>{client.companyName}</Text>
      )}

      <View style={styles.list}>
        {projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            subtitle="Once a request is approved, your projects will show up here."
          />
        ) : (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onPress={() => router.push(`/projects/${project.id}`)}
            />
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.headingLg,
    color: color.textPrimary,
    marginTop: spacing.sm,
  },
  company: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.body,
    color: color.textMuted,
    marginTop: 2,
    marginBottom: spacing.xl,
  },
  list: {
    marginTop: spacing.md,
  },
});
