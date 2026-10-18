import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, View } from 'react-native';
import {
  ageLabel,
  postTitle,
  RESOLUTION_LABEL,
  SEX_LABEL,
  SIZE_LABEL,
  SPECIES_LABEL,
  timeAgo,
  type PostResponse,
  type Resolution,
} from '@huellitas/shared';
import { ActionSheet } from '@/components/action-sheet';
import { Gallery } from '@/components/gallery';
import { Button, FormError, Text } from '@/components/ui';
import { errorMessage } from '@/features/auth/errors';
import { useContact, useDeletePost, usePost, useResolvePost } from '@/features/posts/hooks';
import { postPlace, TypeBadge } from '@/features/posts/post-card';
import { confirmAction } from '@/lib/dialogs';
import { useSession } from '@/stores/session';
import { colors } from '@/theme';

const DATE_PREFIX = { PERDIDA: 'Se perdió', ENCONTRADA: 'La encontraron', ADOPCION: 'Publicada' };

const RESOLVE_OPTIONS: Record<PostResponse['type'], { label: string; resolution: Resolution }[]> = {
  PERDIDA: [{ label: '¡Volvió a casa!', resolution: 'REENCONTRADA' }],
  ENCONTRADA: [{ label: 'Apareció su familia', resolution: 'REENCONTRADA' }],
  ADOPCION: [{ label: 'Fue adoptada', resolution: 'ADOPTADA' }],
};

function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[45%] flex-1 gap-0.5 rounded-2xl bg-white p-3">
      <Text className="text-xs text-ink-muted">{label}</Text>
      <Text variant="semibold" className="text-base text-ink">
        {value}
      </Text>
    </View>
  );
}

const yesNo = (v: boolean | null) => (v == null ? null : v ? 'Sí' : 'No');

export default function PostDetailScreen() {
  const { shortId } = useLocalSearchParams<{ shortId: string }>();
  const userId = useSession((s) => s.user?.id);
  const post = usePost(shortId);
  const contact = useContact();
  const resolve = useResolvePost(post.data?.id ?? '');
  const remove = useDeletePost();
  const [resolving, setResolving] = useState(false);

  if (!post.data) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-50 p-6">
        {post.error ? (
          <FormError message={errorMessage(post.error)} />
        ) : (
          <ActivityIndicator color={colors.brandStrong} />
        )}
      </View>
    );
  }

  const p = post.data;
  const title = postTitle(p);
  const mine = p.author.id === userId;
  const active = p.status === 'ACTIVA';
  const age = p.pet?.approxBirthDate
    ? ageLabel(p.pet.approxBirthDate)
    : p.adoption?.approxAgeMonths != null
      ? p.adoption.approxAgeMonths >= 12
        ? `${Math.floor(p.adoption.approxAgeMonths / 12)} año(s)`
        : `${p.adoption.approxAgeMonths} meses`
      : null;

  async function openWhatsapp() {
    const { whatsappUrl } = await contact.mutateAsync(p.id);
    await Linking.openURL(whatsappUrl);
  }

  async function confirmDelete() {
    const ok = await confirmAction({
      title: '¿Eliminar la publicación?',
      message: 'Deja de verse en el feed y el link compartido deja de andar.',
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (ok) remove.mutate(p.id, { onSuccess: () => router.back() });
  }

  const actionError = contact.error ?? resolve.error ?? remove.error;

  return (
    <ScrollView className="flex-1 bg-brand-50" contentContainerClassName="pb-10">
      <Stack.Screen options={{ title }} />
      <ActionSheet
        visible={resolving}
        title="Marcar como resuelta"
        message="Sale del feed, pero el link compartido sigue mostrando que se resolvió."
        options={[
          ...RESOLVE_OPTIONS[p.type],
          { label: 'Otro motivo', resolution: 'OTRO' as const },
        ].map((o) => ({
          label: o.label,
          onPress: () => resolve.mutate({ resolution: o.resolution }),
        }))}
        onClose={() => setResolving(false)}
      />
      <Gallery photos={p.photos} label={title} />
      <View className="gap-5 px-5 pt-5">
        {p.status === 'RESUELTA' ? (
          <View className="flex-row items-center gap-3 rounded-2xl bg-adoption p-4">
            <Ionicons name="checkmark-circle" size={28} color="#fff" />
            <Text variant="bold" className="flex-1 text-base text-white">
              {RESOLUTION_LABEL[p.resolution ?? 'OTRO']}
              {p.resolvedAt ? ` · ${timeAgo(p.resolvedAt)}` : ''}
            </Text>
          </View>
        ) : null}

        <View className="gap-2">
          <TypeBadge post={{ ...p, status: p.status === 'RESUELTA' ? 'ACTIVA' : p.status }} />
          <Text variant="heading" className="text-4xl leading-[44px] text-ink">
            {title}
          </Text>
          <Text className="text-sm text-ink-muted">
            Publicado por {mine ? 'vos' : p.author.name} · {timeAgo(p.publishedAt)}
          </Text>
        </View>

        <View className="gap-2 rounded-2xl bg-white p-4">
          <View className="flex-row items-center gap-2">
            <Ionicons name="location" size={18} color={colors.brandStrong} />
            <Text variant="semibold" className="flex-1 text-base text-ink">
              {postPlace(p)}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Ionicons name="calendar" size={18} color={colors.brandStrong} />
            <Text className="flex-1 text-base text-ink">
              {DATE_PREFIX[p.type]} el {longDate(p.eventDate)}
            </Text>
          </View>
        </View>

        <Text className="text-base leading-6 text-ink">{p.description}</Text>

        <View className="flex-row flex-wrap gap-2">
          <Fact label="Especie" value={SPECIES_LABEL[p.species]} />
          {p.sex !== 'DESCONOCIDO' ? <Fact label="Sexo" value={SEX_LABEL[p.sex]} /> : null}
          {p.pet?.breed ? <Fact label="Raza" value={p.pet.breed} /> : null}
          {p.color ? <Fact label="Color" value={p.color} /> : null}
          {p.size ? <Fact label="Tamaño" value={SIZE_LABEL[p.size]} /> : null}
          {age ? <Fact label="Edad" value={age} /> : null}
          {p.adoption && yesNo(p.adoption.neutered) ? (
            <Fact label="Castrada" value={yesNo(p.adoption.neutered)!} />
          ) : null}
          {p.adoption && yesNo(p.adoption.vaccinated) ? (
            <Fact label="Vacunada" value={yesNo(p.adoption.vaccinated)!} />
          ) : null}
          {p.adoption && yesNo(p.adoption.dewormed) ? (
            <Fact label="Desparasitada" value={yesNo(p.adoption.dewormed)!} />
          ) : null}
        </View>

        {p.pet?.distinctiveMarks ? (
          <View className="gap-1">
            <Text variant="headingBold" className="text-lg text-ink">
              Señas particulares
            </Text>
            <Text className="text-base leading-6 text-ink">{p.pet.distinctiveMarks}</Text>
          </View>
        ) : null}

        {p.adoption?.requirements ? (
          <View className="gap-1">
            <Text variant="headingBold" className="text-lg text-ink">
              Requisitos
            </Text>
            <Text className="text-base leading-6 text-ink">{p.adoption.requirements}</Text>
          </View>
        ) : null}

        <FormError message={actionError ? errorMessage(actionError) : null} />

        {!mine && active ? (
          p.canContact ? (
            <Button
              title="Contactar por WhatsApp"
              loading={contact.isPending}
              onPress={() => void openWhatsapp()}
            />
          ) : (
            <Text className="rounded-2xl bg-white p-4 text-center text-ink-muted">
              Quien publicó no dejó un WhatsApp.
            </Text>
          )
        ) : null}

        {mine ? (
          <View className="gap-3">
            {active ? (
              <>
                <Button
                  title="Marcar como resuelta"
                  loading={resolve.isPending}
                  onPress={() => setResolving(true)}
                />
                <Button
                  title="Editar"
                  variant="secondary"
                  onPress={() =>
                    router.push({
                      pathname: '/post/[shortId]/edit',
                      params: { shortId: p.shortId },
                    })
                  }
                />
              </>
            ) : null}
            <Button
              title="Eliminar"
              variant="ghost"
              loading={remove.isPending}
              onPress={() => void confirmDelete()}
            />
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
