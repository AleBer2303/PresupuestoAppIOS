import React from 'react';
import {
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { Tabs } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  LayoutDashboard,
  PieChart,
  Plus,
  ReceiptText,
} from 'lucide-react-native';
import { useFinanceStore } from '@/store/useFinanceStore';
import { SpringPressable, useLiquidTheme } from '@/components/LiquidGlass';

export default function TabsLayout() {
  const openTransactionModal = useFinanceStore((s) => s.openTransactionModal);
  const { tokens } = useLiquidTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  const webBlurStyle: ViewStyle =
    Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        } as unknown as ViewStyle)
      : {};

  // Cálculo dinámico para iPhone 16 Pro Max (insets.bottom = 34pt, width = 440pt) y Web
  const isWideScreen = windowWidth > 540;
  const tabHorizontalMargin = isWideScreen
    ? Math.max(20, Math.floor((windowWidth - 480) / 2))
    : 20;
  const tabBottom = Math.max(insets.bottom, 12) + 6;
  const fabBottom = tabBottom + 66 + 14;

  return (
    <View style={[styles.root, { backgroundColor: tokens.canvasBg }]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: tokens.emerald,
          tabBarInactiveTintColor: tokens.textMuted,
          tabBarStyle: [
            styles.floatingTabBar,
            {
              left: tabHorizontalMargin,
              right: tabHorizontalMargin,
              bottom: tabBottom,
              backgroundColor: tokens.tabBarBg,
              borderColor: tokens.tabBarBorder,
              shadowColor: tokens.glassShadowColor,
              shadowOpacity: tokens.glassShadowOpacity,
            },
            webBlurStyle,
          ],
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            marginTop: 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <LayoutDashboard color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="budgets"
          options={{
            title: 'Presupuesto',
            tabBarIcon: ({ color, size }) => (
              <PieChart color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'Historial',
            tabBarIcon: ({ color, size }) => (
              <ReceiptText color={color} size={size} />
            ),
          }}
        />
      </Tabs>

      {/* Botón flotante Liquid Glass (FAB) en Ultra Alta Resolución Retina y Visible en Web */}
      <View
        pointerEvents="box-none"
        style={[
          styles.fabContainer,
          {
            right: tabHorizontalMargin,
            bottom: fabBottom,
          },
        ]}
      >
        <SpringPressable
          onPress={() => openTransactionModal('expense')}
          scaleDown={0.91}
          style={styles.fabShadowWrapper}
          accessibilityLabel="Agregar movimiento financiero"
          accessibilityRole="button"
        >
          {/* Contenedor interno con máscara circular aislada de la sombra para evitar rasterización borrosa en iOS */}
          <View style={styles.fabInnerCircle}>
            <LinearGradient
              colors={['#34D399', '#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Brillo especular superior líquido */}
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.55)', 'rgba(255, 255, 255, 0.0)']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.7 }}
              style={styles.fabSpecularGradient}
              pointerEvents="none"
            />
            {/* Icono vectorial nítido a escala Retina */}
            <Plus color="#FFFFFF" size={32} strokeWidth={2.8} />
          </View>
        </SpringPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  floatingTabBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 66,
    borderRadius: 33,
    borderTopWidth: 1,
    borderWidth: 1,
    paddingTop: 8,
    paddingBottom: 8,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 12,
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 99999,
    elevation: 999,
    ...(Platform.OS === 'web'
      ? ({
          position: 'fixed',
        } as unknown as ViewStyle)
      : {}),
  },
  fabShadowWrapper: {
    width: 62,
    height: 62,
    borderRadius: 31,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 12,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow:
            '0 8px 24px rgba(16, 185, 129, 0.45), 0 2px 6px rgba(0,0,0,0.12)',
          cursor: 'pointer',
        } as unknown as ViewStyle)
      : {}),
  },
  fabInnerCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.55)',
  },
  fabSpecularGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 28,
  },
});
