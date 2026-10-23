import React from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Tabs } from 'expo-router';
import {
  LayoutDashboard,
  PieChart,
  Plus,
  ReceiptText,
} from 'lucide-react-native';
import { useFinanceStore } from '@/store/useFinanceStore';

export default function TabsLayout() {
  const openTransactionModal = useFinanceStore((s) => s.openTransactionModal);

  return (
    <View className="flex-1 bg-slate-950">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#10B981',
          tabBarInactiveTintColor: '#64748B',
          tabBarStyle: {
            backgroundColor: '#090D16',
            borderTopColor: '#1E293B',
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 88 : 68,
            paddingTop: 8,
            paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
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

      {/* Botón flotante rápido (FAB) estilo iOS para registrar transacción */}
      <Pressable
        onPress={() => openTransactionModal('expense')}
        className="absolute right-5 bottom-24 w-14 h-14 rounded-full bg-emerald-500 items-center justify-center shadow-lg active:scale-95"
        style={{
          shadowColor: '#10B981',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.4,
          shadowRadius: 10,
          elevation: 8,
        }}
      >
        <Plus color="#FFFFFF" size={28} strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}
