// Colores de marca para usar desde JS (props de navegación, ActivityIndicator, placeholders).
// Mantener sincronizado con tailwind.config.js.
export const colors = {
  brand: '#E8590C',
  brandStrong: '#B8400C',
  melena: '#F2A516',
  crema: '#FFF8EE',
  ink: '#2B1A12',
  inkMuted: '#6B4A36',
  placeholder: '#A8907E',
} as const;

export const fonts = {
  heading: 'Baloo2_800ExtraBold',
  headingBold: 'Baloo2_700Bold',
  body: 'NunitoSans_400Regular',
  bodySemibold: 'NunitoSans_600SemiBold',
  bodyBold: 'NunitoSans_700Bold',
} as const;
