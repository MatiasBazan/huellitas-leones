import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, View } from 'react-native';
import {
  POST_TYPE_LABEL,
  postTitle,
  RESOLUTION_LABEL,
  SEX_LABEL,
  SPECIES_LABEL,
  timeAgo,
  type PostResponse,
} from '@huellitas/shared';
import { LogoSymbol } from '@/components/logo';
import { Text } from '@/components/ui';
import { mediaUrl } from '@/lib/config';

const TYPE_BG = { PERDIDA: 'bg-lost', ENCONTRADA: 'bg-found', ADOPCION: 'bg-adoption' } as const;

export function TypeBadge({
  post,
}: {
  post: Pick<PostResponse, 'type' | 'status' | 'resolution'>;
}) {
  const resolved = post.status === 'RESUELTA';
  const label = resolved
    ? RESOLUTION_LABEL[post.resolution ?? 'OTRO']
    : post.status === 'OCULTA'
      ? 'Oculta'
      : POST_TYPE_LABEL[post.type];
  return (
    <View
      className={`self-start rounded-full px-3 py-1 ${resolved || post.status === 'OCULTA' ? 'bg-ink' : TYPE_BG[post.type]}`}
    >
      <Text variant="bold" className="text-xs uppercase tracking-wider text-white">
        {label}
      </Text>
    </View>
  );
}

export function postSubtitle(post: PostResponse): string {
  return [
    post.pet ? SPECIES_LABEL[post.species] : null,
    post.pet?.breed,
    post.sex !== 'DESCONOCIDO' ? SEX_LABEL[post.sex] : null,
    post.color,
  ]
    .filter(Boolean)
    .join(' · ');
}

export function postPlace(post: PostResponse): string {
  return [post.neighborhood?.name, post.zoneText].filter(Boolean).join(' · ') || post.city.name;
}

export function PostCard({ post }: { post: PostResponse }) {
  const cover = post.photos[0];
  return (
    <Link href={{ pathname: '/post/[shortId]', params: { shortId: post.shortId } }} asChild>
      <Pressable className="overflow-hidden rounded-3xl bg-white active:opacity-90">
        <View className="aspect-[4/3] items-center justify-center bg-brand-200">
          {cover ? (
            <Image
              source={{ uri: mediaUrl(cover.url) }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              accessibilityLabel={postTitle(post)}
            />
          ) : (
            <LogoSymbol size={80} />
          )}
          <View className="absolute left-3 top-3">
            <TypeBadge post={post} />
          </View>
        </View>
        <View className="gap-1 p-4">
          <Text variant="headingBold" className="text-xl text-ink" numberOfLines={1}>
            {postTitle(post)}
          </Text>
          {postSubtitle(post) ? (
            <Text className="text-sm text-ink-muted" numberOfLines={1}>
              {postSubtitle(post)}
            </Text>
          ) : null}
          <Text variant="semibold" className="text-sm text-ink" numberOfLines={1}>
            {postPlace(post)} · {timeAgo(post.publishedAt)}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}
