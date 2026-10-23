import '../global.css';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFinanceStore } from '@/store/useFinanceStore';
import { QuickTransactionModal } from '@/components/QuickTransactionModal';
import { useLiquidTheme } from '@/components/LiquidGlass';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const isReady = useFinanceStore((s) => s.isReady);
  const initializeApp = useFinanceStore((s) => s.initializeApp);
  const { tokens, isDark } = useLiquidTheme();

  useEffect(() => {
    void (async () => {
      await initializeApp();
      await SplashScreen.hideAsync();
    })();
  }, [initializeApp]);

  if (!isReady) {
    return (
      <View
        style={{ flex: 1, backgroundColor: tokens.canvasBg }}
        className="items-center justify-center"
      >
        <ActivityIndicator size="large" color={tokens.emerald} />
      </View>
    );
  }

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <QuickTransactionModal />
    </ThemeProvider>
  );
}
