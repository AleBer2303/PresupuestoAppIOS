import '../global.css';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DarkTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFinanceStore } from '@/store/useFinanceStore';
import { QuickTransactionModal } from '@/components/QuickTransactionModal';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const isReady = useFinanceStore((s) => s.isReady);
  const initializeApp = useFinanceStore((s) => s.initializeApp);

  useEffect(() => {
    void (async () => {
      await initializeApp();
      await SplashScreen.hideAsync();
    })();
  }, [initializeApp]);

  if (!isReady) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <QuickTransactionModal />
    </ThemeProvider>
  );
}
