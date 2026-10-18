import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/components/ui';

type Option = {
  href: Href;
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
  bg: string;
};

const OPTIONS: Option[] = [
  {
    href: '/publish/lost',
    icon: 'search',
    title: 'Se perdió mi mascota',
    description: 'Elegís cuál de tus mascotas y avisamos a los vecinos.',
    bg: 'bg-lost',
  },
  {
    href: '/publish/found',
    icon: 'heart',
    title: 'Encontré una mascota',
    description: 'Publicala para que su familia la encuentre.',
    bg: 'bg-found',
  },
  {
    href: '/publish/adoption',
    icon: 'home',
    title: 'Doy en adopción',
    description: 'Buscale un hogar responsable. Siempre gratis.',
    bg: 'bg-adoption',
  },
];

export default function PublishScreen() {
  return (
    <ScrollView className="flex-1 bg-brand-50" contentContainerClassName="gap-4 p-4">
      <Text className="text-base text-ink-muted">¿Qué querés publicar?</Text>
      {OPTIONS.map((o) => (
        <Link key={o.title} href={o.href} asChild>
          <Pressable className="flex-row items-center gap-4 rounded-3xl bg-white p-4 active:opacity-80">
            <View className={`size-14 items-center justify-center rounded-2xl ${o.bg}`}>
              <Ionicons name={o.icon} size={26} color="#fff" />
            </View>
            <View className="flex-1 gap-0.5">
              <Text variant="headingBold" className="text-lg text-ink">
                {o.title}
              </Text>
              <Text className="text-sm text-ink-muted">{o.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B4A36" />
          </Pressable>
        </Link>
      ))}
    </ScrollView>
  );
}
