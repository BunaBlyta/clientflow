import { Building2, LogOut, Mail, User as UserIcon } from 'lucide-react-native';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { color, fontFamily, fontSize, radius, spacing } from '../../lib/theme';
import { useAuthStore } from '../../store/auth-store';

export default function AccountScreen() {
  const client = useAuthStore((s) => s.client);
  const logout = useAuthStore((s) => s.logout);

  function handleLogout() {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  }

  return (
    <Screen>
      <Text style={styles.heading}>Account</Text>

      <View style={styles.avatarWrap}>
        <Text style={styles.avatarInitial}>
          {client?.name?.charAt(0).toUpperCase() ?? '?'}
        </Text>
      </View>
      <Text style={styles.name}>{client?.name}</Text>
      <Text style={styles.company}>{client?.companyName}</Text>

      <View style={styles.infoBlock}>
        <InfoRow icon={Mail} label="Email" value={client?.email ?? ''} />
        <InfoRow icon={Building2} label="Company" value={client?.companyName ?? ''} />
        <InfoRow icon={UserIcon} label="Contact" value={client?.name ?? ''} />
      </View>

      <Pressable
        onPress={handleLogout}
        style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.7 }]}
      >
        <LogOut size={16} color={color.danger} />
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>

      <Text style={styles.footer}>Clientflow · v1.0.0</Text>
    </Screen>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Icon size={16} color={color.textMuted} />
      <View style={styles.infoTextCol}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.headingLg,
    color: color.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: color.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarInitial: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.heading,
    color: color.accentPressed,
  },
  name: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sectionTitle,
    color: color.textPrimary,
  },
  company: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.caption,
    color: color.textMuted,
    marginTop: 2,
    marginBottom: spacing.xl,
  },
  infoBlock: {
    borderTopWidth: 1,
    borderTopColor: color.border,
    marginBottom: spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  infoTextCol: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.textMuted,
  },
  infoValue: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.caption,
    color: color.textPrimary,
    marginTop: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.dangerBorder,
    backgroundColor: color.dangerBg,
  },
  logoutText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.body,
    color: color.danger,
  },
  footer: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.meta,
    color: color.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});
