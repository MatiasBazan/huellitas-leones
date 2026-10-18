import { useQuery } from '@tanstack/react-query';
import { Pressable, ScrollView, Switch, View } from 'react-native';
import { citiesApi } from '@/api/auth';
import { Chips, Text } from '@/components/ui';
import { useSession } from '@/stores/session';
import { colors } from '@/theme';

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** Los últimos 7 días como chips: sin date picker nativo y suficiente para "cuándo pasó" */
export function lastDays(count = 7, today = new Date()) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    d.setHours(12, 0, 0, 0);
    const label = i === 0 ? 'Hoy' : i === 1 ? 'Ayer' : `${WEEKDAYS[d.getDay()]} ${d.getDate()}`;
    return { value: String(i), label, date: d };
  });
}

/** El mediodía del día elegido, sin pasarse de ahora (para "Hoy" a la mañana) */
export function eventDateFor(daysAgo: number): string {
  const day = lastDays(daysAgo + 1)[daysAgo]!.date;
  return new Date(Math.min(day.getTime(), Date.now())).toISOString();
}

export function daysAgoFrom(iso: string, today = new Date()): number {
  const d = new Date(iso);
  const a = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const b = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.min(6, Math.max(0, Math.round((a - b) / 86_400_000)));
}

export function DayPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (daysAgo: number) => void;
}) {
  return (
    <View className="gap-1.5">
      <Text variant="semibold" className="text-sm text-ink">
        {label}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2"
      >
        {lastDays().map((d, i) => {
          const selected = i === value;
          return (
            <Pressable
              key={d.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(i)}
              className={`min-h-11 justify-center rounded-full border px-4 ${selected ? 'border-brand-600 bg-brand-600' : 'border-line bg-white'}`}
            >
              <Text
                variant={selected ? 'semibold' : 'body'}
                className={selected ? 'text-white' : 'text-ink'}
              >
                {d.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function useNeighborhoods() {
  const citySlug = useSession((s) => s.user?.city.slug ?? '');
  return useQuery({
    queryKey: ['neighborhoods', citySlug],
    queryFn: () => citiesApi.neighborhoods(citySlug),
    enabled: !!citySlug,
    staleTime: Infinity,
  });
}

export function NeighborhoodPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const neighborhoods = useNeighborhoods();
  if (!neighborhoods.data?.length) return null;
  return (
    <Chips
      label="Barrio"
      options={neighborhoods.data.map((n) => ({ value: n.id, label: n.name }))}
      value={value}
      onChange={onChange}
      optional
    />
  );
}

export function ShowPhoneSwitch({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const hasWhatsapp = useSession((s) => !!s.user?.whatsapp);
  return (
    <View className="gap-1.5 rounded-2xl bg-white p-4">
      <View className="flex-row items-center justify-between gap-4">
        <Text variant="semibold" className="flex-1 text-base text-ink">
          Que me contacten por WhatsApp
        </Text>
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ true: colors.brandStrong, false: '#D6C6B4' }}
          thumbColor="#fff"
          accessibilityLabel="Que me contacten por WhatsApp"
        />
      </View>
      <Text className="text-sm text-ink-muted">
        {!hasWhatsapp
          ? 'No cargaste tu WhatsApp: agregalo en tu perfil para que puedan escribirte.'
          : value
            ? 'Tu número no se muestra: se abre WhatsApp con un mensaje armado.'
            : 'Nadie va a poder escribirte desde la publicación.'}
      </Text>
    </View>
  );
}
