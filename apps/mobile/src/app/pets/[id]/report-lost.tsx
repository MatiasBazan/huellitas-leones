import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import type { ReportLostInput } from '@huellitas/shared';
import { Screen, Text } from '@/components/ui';
import { usePet } from '@/features/pets/hooks';
import { useReportLost } from '@/features/posts/hooks';
import { PostForm } from '@/features/posts/post-form';
import { colors } from '@/theme';

export default function ReportLostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pet = usePet(id);
  const report = useReportLost(id);

  if (!pet.data) {
    return (
      <Screen>
        <ActivityIndicator color={colors.brandStrong} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: `Se perdió ${pet.data.name}` }} />
      <View className="mb-5 rounded-2xl bg-white p-4">
        <Text className="text-sm text-ink">
          Usamos las fotos y los datos del perfil de {pet.data.name}. Solo contanos dónde y cuándo.
        </Text>
      </View>
      <PostForm
        type="PERDIDA"
        submitLabel="Publicar búsqueda"
        submitting={report.isPending}
        error={report.error}
        onSubmit={(body) =>
          report.mutate(body as ReportLostInput, {
            onSuccess: (post) =>
              router.replace({ pathname: '/post/[shortId]', params: { shortId: post.shortId } }),
          })
        }
      />
    </Screen>
  );
}
