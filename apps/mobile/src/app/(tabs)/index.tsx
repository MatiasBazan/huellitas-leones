import { Text, View } from 'react-native';
import { useSession } from '@/stores/session';

// Placeholder: el feed llega en la Etapa 3
export default function FeedScreen() {
  const user = useSession((s) => s.user);
  return (
    <View className="flex-1 items-center justify-center gap-2 bg-brand-50 px-6">
      <Text className="text-2xl font-bold text-ink">Hola, {user?.name} 🐾</Text>
      <Text className="text-center text-ink-muted">
        Acá vas a ver las mascotas perdidas, encontradas y en adopción de {user?.city.name}.
      </Text>
    </View>
  );
}
