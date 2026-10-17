import { Text, View } from 'react-native';
import { Button } from '@/components/ui';
import { useLogout } from '@/features/auth/hooks';
import { useSession } from '@/stores/session';

export default function ProfileScreen() {
  const user = useSession((s) => s.user);
  const logout = useLogout();
  if (!user) return null;

  const rows: [string, string][] = [
    ['Email', user.email],
    ['Ciudad', user.city.name],
    ['Barrio', user.neighborhood?.name ?? '—'],
    ['WhatsApp', user.whatsapp ?? 'Sin cargar'],
  ];

  return (
    <View className="flex-1 gap-6 bg-brand-50 px-6 py-8">
      <Text className="text-3xl font-bold text-ink">{user.name}</Text>
      <View className="gap-3 rounded-2xl bg-white p-4">
        {rows.map(([label, value]) => (
          <View key={label} className="flex-row justify-between gap-4">
            <Text className="text-ink-muted">{label}</Text>
            <Text className="shrink text-right font-medium text-ink">{value}</Text>
          </View>
        ))}
      </View>
      <Button
        title="Cerrar sesión"
        variant="secondary"
        loading={logout.isPending}
        onPress={() => logout.mutate()}
      />
    </View>
  );
}
