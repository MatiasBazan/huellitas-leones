import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native';
import { LogoSymbol } from '@/components/logo';
import { Button, FormError, Text } from '@/components/ui';
import { errorMessage } from '@/features/auth/errors';
import { useMyPets } from '@/features/pets/hooks';
import { PetCard } from '@/features/pets/pet-card';
import { colors } from '@/theme';

export default function MyPetsScreen() {
  const pets = useMyPets();

  if (pets.isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-50">
        <ActivityIndicator color={colors.brandStrong} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-brand-50">
      <FlatList
        data={pets.data ?? []}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PetCard pet={item} />}
        contentContainerClassName="grow gap-3 px-4 pb-28 pt-4"
        refreshControl={
          <RefreshControl
            refreshing={pets.isRefetching}
            onRefresh={() => void pets.refetch()}
            tintColor={colors.brandStrong}
          />
        }
        ListHeaderComponent={
          pets.error ? <FormError message={errorMessage(pets.error)} /> : undefined
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center gap-4 px-6">
            <LogoSymbol size={96} />
            <Text variant="heading" className="text-center text-2xl text-ink">
              Todavía no cargaste mascotas
            </Text>
            <Text className="text-center text-ink-muted">
              Cargalas ahora con fotos y señas. Si alguna se pierde, publicás la búsqueda con un
              toque.
            </Text>
            <View className="w-full">
              <Button title="Cargar mi mascota" onPress={() => router.push('/pets/new')} />
            </View>
          </View>
        }
      />
      {pets.data?.length ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Agregar mascota"
          onPress={() => router.push('/pets/new')}
          className="absolute bottom-6 right-5 h-14 flex-row items-center gap-2 rounded-full bg-brand-600 px-5 shadow-lg active:opacity-80"
        >
          <Ionicons name="add" size={22} color="#fff" />
          <Text variant="bold" className="text-base text-white">
            Agregar
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
