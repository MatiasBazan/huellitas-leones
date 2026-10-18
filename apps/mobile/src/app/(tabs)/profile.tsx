import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { postTitle, timeAgo } from '@huellitas/shared';
import { Button, Text } from '@/components/ui';
import { useLogout } from '@/features/auth/hooks';
import { useMyPosts } from '@/features/posts/hooks';
import { TypeBadge } from '@/features/posts/post-card';
import { EditableAvatar } from '@/features/profile/avatar';
import { useSession } from '@/stores/session';

function formatWhatsapp(e164: string): string {
  const national = e164.replace(/^\+549/, '');
  return `${national.slice(0, 3)} ${national.slice(3)}`;
}

export default function ProfileScreen() {
  const user = useSession((s) => s.user);
  const logout = useLogout();
  const posts = useMyPosts();
  if (!user) return null;

  const rows: [string, string][] = [
    ['Email', user.email],
    ['Barrio', user.neighborhood ? `${user.neighborhood.name}, ${user.city.name}` : user.city.name],
    ['WhatsApp', user.whatsapp ? formatWhatsapp(user.whatsapp) : 'Sin cargar'],
  ];

  return (
    <ScrollView className="flex-1 bg-brand-50" contentContainerClassName="gap-6 px-5 py-6">
      <View className="flex-row items-center gap-4">
        <EditableAvatar />
        <View className="flex-1">
          <Text variant="heading" className="text-3xl leading-9 text-ink">
            {user.name}
          </Text>
          <Pressable onPress={() => router.push('/profile-edit')} accessibilityRole="button">
            <Text variant="semibold" className="text-brand-600">
              Editar perfil
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="gap-3 rounded-2xl bg-white p-4">
        {rows.map(([label, value]) => (
          <View key={label} className="flex-row justify-between gap-4">
            <Text className="text-ink-muted">{label}</Text>
            <Text variant="semibold" className="shrink text-right text-ink">
              {value}
            </Text>
          </View>
        ))}
      </View>

      <View className="gap-3">
        <Text variant="headingBold" className="text-xl text-ink">
          Mis publicaciones
        </Text>
        {posts.data && !posts.data.length ? (
          <Text className="text-ink-muted">Todavía no publicaste nada.</Text>
        ) : null}
        {posts.data?.map((post) => (
          <Pressable
            key={post.id}
            onPress={() =>
              router.push({ pathname: '/post/[shortId]', params: { shortId: post.shortId } })
            }
            className="flex-row items-center gap-3 rounded-2xl bg-white p-4 active:opacity-80"
          >
            <View className="flex-1 gap-1.5">
              <TypeBadge post={post} />
              <Text variant="semibold" className="text-base text-ink">
                {postTitle(post)}
              </Text>
              <Text className="text-xs text-ink-muted">{timeAgo(post.publishedAt)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B4A36" />
          </Pressable>
        ))}
      </View>

      <Button
        title="Cerrar sesión"
        variant="secondary"
        loading={logout.isPending}
        onPress={() => logout.mutate()}
      />
    </ScrollView>
  );
}
