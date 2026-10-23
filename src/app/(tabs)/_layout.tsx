import React from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { Tabs } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
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

  const webBlurStyle: ViewStyle =
    Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        } as unknown as ViewStyle)
      : {};

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

      {/* Botón flotante Liquid Glass (FAB) con física de resorte estilo iOS */}
      <View style={styles.fabContainer}>
        <SpringPressable
          onPress={() => openTransactionModal('expense')}
          scaleDown={0.9}
          style={styles.fabButton}
        >
          <LinearGradient
            colors={['#34D399', '#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.fabSpecular} />
          <Plus color="#FFFFFF" size={28} strokeWidth={2.8} />
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
    left: 18,
    right: 18,
    bottom: Platform.OS === 'ios' ? 24 : 14,
    height: 68,
    borderRadius: 34,
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
    right: 24,
    bottom: Platform.OS === 'ios' ? 104 : 94,
  },
  fabButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.38)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  fabSpecular: {
    position: 'absolute',
    top: 2,
    left: 12,
    right: 12,
    height: 2,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
});
