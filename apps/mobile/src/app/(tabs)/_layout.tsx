import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { colors, fonts } from '@/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IconName) {
  return function TabIcon({ color, size }: { color: unknown; size: number }) {
    return (
      <Ionicons name={name} color={typeof color === 'string' ? color : undefined} size={size} />
    );
  };
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.brandStrong,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarLabelStyle: { fontFamily: fonts.bodySemibold },
        headerTitleStyle: { fontFamily: fonts.headingBold, color: colors.ink },
        headerStyle: { backgroundColor: colors.crema },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Inicio', headerShown: false, tabBarIcon: tabIcon('home') }}
      />
      <Tabs.Screen
        name="publish"
        options={{ title: 'Publicar', tabBarIcon: tabIcon('add-circle') }}
      />
      <Tabs.Screen name="pets" options={{ title: 'Mis mascotas', tabBarIcon: tabIcon('paw') }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: tabIcon('person') }} />
    </Tabs>
  );
}
