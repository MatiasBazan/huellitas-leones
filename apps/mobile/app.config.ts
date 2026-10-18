import type { ConfigContext, ExpoConfig } from 'expo/config';

// iOS: URL scheme del client ID de iOS de Google ("com.googleusercontent.apps.XXXX")
const googleIosUrlScheme = process.env.GOOGLE_IOS_URL_SCHEME;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Huellita Leones',
  slug: 'huellita-leones',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'huellitaleones',
  userInterfaceStyle: 'light',
  ios: {
    bundleIdentifier: 'com.mabdev.huellitaleones',
  },
  android: {
    package: 'com.mabdev.huellitaleones',
    adaptiveIcon: {
      backgroundColor: '#E8590C',
      foregroundImage: './assets/images/android-icon-foreground.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'single',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#FFF8EE',
        image: './assets/images/splash-icon.png',
        imageWidth: 160,
      },
    ],
    'expo-secure-store',
    googleIosUrlScheme
      ? ['@react-native-google-signin/google-signin', { iosUrlScheme: googleIosUrlScheme }]
      : '@react-native-google-signin/google-signin',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
