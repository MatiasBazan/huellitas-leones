/** @type {import('tailwindcss').Config} */
// Marca "Melena". Los valores que se usan desde JS están en src/theme.ts: mantenerlos sincronizados.
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  // La app es solo clara (userInterfaceStyle: 'light'); con 'media' NativeWind falla en web
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF8EE', // crema: fondo
          100: '#FBEBD8',
          200: '#F3E3CF',
          500: '#E8590C', // naranja león: logo y gráficos
          600: '#B8400C', // botones y texto de marca (AA con blanco)
          700: '#8A2F08',
        },
        melena: '#F2A516',
        ink: {
          DEFAULT: '#2B1A12',
          muted: '#6B4A36',
        },
        line: '#EBD9C3',
        lost: '#B42318',
        found: '#1D5FD1',
        adoption: '#12795A',
      },
      // En React Native cada peso es una familia distinta (las carga el layout raíz)
      fontFamily: {
        body: ['NunitoSans_400Regular'],
        'body-semibold': ['NunitoSans_600SemiBold'],
        'body-bold': ['NunitoSans_700Bold'],
        heading: ['Baloo2_800ExtraBold'],
        'heading-bold': ['Baloo2_700Bold'],
      },
    },
  },
  plugins: [],
};
