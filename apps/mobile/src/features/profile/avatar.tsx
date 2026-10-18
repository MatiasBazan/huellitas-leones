import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { uploadPhoto } from '@/api/media';
import { Text } from '@/components/ui';
import { useUpdateMe } from '@/features/auth/hooks';
import { mediaUrl } from '@/lib/config';
import { compressPhoto, pickPhotos } from '@/lib/images';
import { useSession } from '@/stores/session';

export function Avatar({
  url,
  name,
  size = 88,
}: {
  url: string | null;
  name: string;
  size?: number;
}) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="items-center justify-center overflow-hidden bg-melena"
    >
      {url ? (
        <Image
          source={{ uri: mediaUrl(url) }}
          style={{ width: size, height: size }}
          contentFit="cover"
        />
      ) : (
        <Text variant="heading" style={{ fontSize: size * 0.4 }} className="text-ink">
          {name.slice(0, 1).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

/** Tocar para cambiar la foto: elegir → comprimir → subir → asignar */
export function EditableAvatar() {
  const user = useSession((s) => s.user);
  const updateMe = useUpdateMe();
  const change = useMutation({
    mutationFn: async () => {
      const [photo] = await pickPhotos('library', 1);
      if (!photo) return;
      const media = await uploadPhoto(await compressPhoto(photo));
      await updateMe.mutateAsync({ avatarMediaId: media.id });
    },
  });
  if (!user) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Cambiar foto de perfil"
      onPress={() => change.mutate()}
      disabled={change.isPending}
      className="self-start"
    >
      <Avatar url={user.avatarUrl} name={user.name} />
      <View className="absolute bottom-0 right-0 size-8 items-center justify-center rounded-full border-2 border-brand-50 bg-brand-600">
        {change.isPending ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="camera" size={16} color="#fff" />
        )}
      </View>
      {change.error ? (
        <Text className="pt-1 text-xs text-lost">No se pudo cambiar la foto</Text>
      ) : null}
    </Pressable>
  );
}
