import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        
        const inAuthGroup = segments[0] === '(auth)';
        const inOnboardingGroup = segments[0] === 'onboarding';

        if (!token && !inAuthGroup && !inOnboardingGroup) {
          router.replace('/onboarding'); 
        } 
        // ---> KITA MATIKAN DULU LOGIKA INI BIAR BEBAS NGETES <---
        // else if (token && (inAuthGroup || inOnboardingGroup)) {
        //   router.replace('/(tabs)');
        // }
      } catch (e) {
        console.error("Auth check error:", e);
      } finally {
        setIsReady(true);
      }
    };

    checkAuth();
  }, [segments]);

  if (!isReady) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding/index" />
      <Stack.Screen name="(auth)/login" />
      <Stack.Screen name="(auth)/register" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}