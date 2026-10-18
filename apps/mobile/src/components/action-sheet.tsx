import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './ui';

export type SheetOption = { label: string; onPress: () => void; destructive?: boolean };

type Props = {
  visible: boolean;
  title?: string;
  message?: string;
  options: SheetOption[];
  onClose: () => void;
};

/** Menú de opciones desde abajo. Anda igual en Android, iOS y en la previsualización web. */
export function ActionSheet({ visible, title, message, options, onClose }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable accessibilityLabel="Cerrar" className="flex-1 bg-black/40" onPress={onClose} />
      <View
        className="gap-2 rounded-t-3xl bg-brand-50 px-4 pt-5"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        {title ? (
          <Text variant="headingBold" className="px-2 text-xl text-ink">
            {title}
          </Text>
        ) : null}
        {message ? <Text className="px-2 pb-1 text-ink-muted">{message}</Text> : null}
        {options.map((o) => (
          <Pressable
            key={o.label}
            accessibilityRole="button"
            onPress={() => {
              onClose();
              o.onPress();
            }}
            className="min-h-12 justify-center rounded-2xl bg-white px-4 active:opacity-70"
          >
            <Text
              variant="semibold"
              className={`text-base ${o.destructive ? 'text-lost' : 'text-ink'}`}
            >
              {o.label}
            </Text>
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          className="min-h-12 items-center justify-center rounded-2xl active:opacity-70"
        >
          <Text variant="bold" className="text-base text-ink-muted">
            Cancelar
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}
