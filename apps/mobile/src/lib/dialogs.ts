import { Alert, Platform } from 'react-native';

/** Confirmación sí/no. En la previsualización web Alert no hace nada, así que usa window.confirm. */
export function confirmAction(opts: {
  title: string;
  message?: string;
  confirmLabel: string;
  destructive?: boolean;
}): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm([opts.title, opts.message].filter(Boolean).join('\n\n')));
  }
  return new Promise((resolve) => {
    Alert.alert(opts.title, opts.message, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
      {
        text: opts.confirmLabel,
        style: opts.destructive ? 'destructive' : 'default',
        onPress: () => resolve(true),
      },
    ]);
  });
}
