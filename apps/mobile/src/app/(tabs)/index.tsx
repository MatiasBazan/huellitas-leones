import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PostType, Species } from '@huellitas/shared';
import { LogoSymbol } from '@/components/logo';
import { FormError, Text } from '@/components/ui';
import { errorMessage } from '@/features/auth/errors';
import { useNeighborhoods } from '@/features/posts/form-fields';
import { useFeed } from '@/features/posts/hooks';
import { PostCard } from '@/features/posts/post-card';
import { useSession } from '@/stores/session';
import { colors } from '@/theme';

const TYPES: { value: PostType | undefined; label: string }[] = [
  { value: undefined, label: 'Todas' },
  { value: 'PERDIDA', label: 'Perdidas' },
  { value: 'ENCONTRADA', label: 'Encontradas' },
  { value: 'ADOPCION', label: 'En adopción' },
];

const SPECIES: { value: Species | undefined; label: string }[] = [
  { value: undefined, label: 'Todas las especies' },
  { value: 'PERRO', label: 'Perros' },
  { value: 'GATO', label: 'Gatos' },
  { value: 'OTRO', label: 'Otras' },
];

function FilterRow<T>({
  items,
  value,
  onChange,
}: {
  items: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 px-4"
    >
      {items.map((it) => {
        const selected = it.value === value;
        return (
          <Pressable
            key={it.label}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(it.value)}
            className={`h-10 justify-center rounded-full px-4 ${selected ? 'bg-ink' : 'border border-line bg-white'}`}
          >
            <Text
              variant={selected ? 'semibold' : 'body'}
              className={selected ? 'text-white' : 'text-ink'}
            >
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const city = useSession((s) => s.user?.city);
  const [type, setType] = useState<PostType | undefined>();
  const [species, setSpecies] = useState<Species | undefined>();
  const [neighborhoodId, setNeighborhoodId] = useState<string | undefined>();
  const neighborhoods = useNeighborhoods();
  const feed = useFeed({ city: city?.slug, type, species, neighborhoodId });
  const posts = feed.data?.pages.flatMap((p) => p.items) ?? [];

  const header = (
    <View className="gap-3 pb-4" style={{ paddingTop: insets.top + 12 }}>
      <View className="flex-row items-center gap-2 px-4">
        <LogoSymbol size={36} />
        <View>
          <Text variant="heading" className="text-2xl leading-7 text-ink">
            Huellita Leones
          </Text>
          <Text className="text-xs text-ink-muted">Lo que pasa en {city?.name}</Text>
        </View>
      </View>
      <FilterRow items={TYPES} value={type} onChange={setType} />
      <FilterRow items={SPECIES} value={species} onChange={setSpecies} />
      {(neighborhoods.data?.length ?? 0) > 1 ? (
        <FilterRow
          items={[
            { value: undefined, label: 'Todos los barrios' },
            ...(neighborhoods.data ?? []).map((n) => ({
              value: n.id as string | undefined,
              label: n.name,
            })),
          ]}
          value={neighborhoodId}
          onChange={setNeighborhoodId}
        />
      ) : null}
      {feed.error ? (
        <View className="px-4">
          <FormError message={errorMessage(feed.error)} />
        </View>
      ) : null}
    </View>
  );

  return (
    <FlatList
      className="flex-1 bg-brand-50"
      data={posts}
      keyExtractor={(p) => p.id}
      renderItem={({ item }) => (
        <View className="px-4 pb-4">
          <PostCard post={item} />
        </View>
      )}
      ListHeaderComponent={header}
      ListEmptyComponent={
        feed.isPending ? (
          <ActivityIndicator color={colors.brandStrong} className="mt-10" />
        ) : (
          <View className="items-center gap-3 px-8 pt-10">
            <LogoSymbol size={80} />
            <Text variant="headingBold" className="text-center text-xl text-ink">
              No hay publicaciones{' '}
              {type || species || neighborhoodId ? 'con esos filtros' : 'todavía'}
            </Text>
            <Text className="text-center text-ink-muted">
              Cuando alguien publique una mascota perdida, encontrada o en adopción la vas a ver
              acá.
            </Text>
          </View>
        )
      }
      ListFooterComponent={
        feed.isFetchingNextPage ? (
          <ActivityIndicator color={colors.brandStrong} className="my-6" />
        ) : undefined
      }
      onEndReached={() => {
        if (feed.hasNextPage && !feed.isFetchingNextPage) void feed.fetchNextPage();
      }}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl
          refreshing={feed.isRefetching && !feed.isFetchingNextPage}
          onRefresh={() => void feed.refetch()}
          tintColor={colors.brandStrong}
        />
      }
    />
  );
}
