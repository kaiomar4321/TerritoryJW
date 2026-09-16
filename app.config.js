module.exports = {
  expo: {
    name: 'JW Territorios',
    scheme: 'myexpoapp',
    slug: 'jw-territorios',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    experiments: {
      tsconfigPaths: true,
    },
    plugins: [
      '@react-native-firebase/app',
      '@react-native-firebase/auth',
      '@react-native-firebase/crashlytics',
      [
        'expo-build-properties',
        {
          ios: {
            useFrameworks: 'static',
            deploymentTarget: '15.1',
            buildReactNativeFromSource: true,
          },
        },
      ],
      'expo-router',
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission: 'Allow $(PRODUCT_NAME) to use your location.',
        },
      ],
    ],
    ios: {
      bundleIdentifier: 'com.miapp.territorios',
      googleServicesFile: './GoogleService-Info.plist',
      supportsTablet: true,
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY_IOS,
      },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: 'com.miapp.territorios',
      googleServicesFile: './google-services.json',
      permissions: ['ACCESS_COARSE_LOCATION', 'ACCESS_FINE_LOCATION'],
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY_ANDROID,
        },
      },
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
    },
    extra: {
      router: {},
      eas: {
        projectId: 'eb3b33b7-0eb8-4ece-a11b-1eb50a218cb9',
      },
    },
  },
};
