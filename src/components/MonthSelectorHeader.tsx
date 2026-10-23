import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight, Coins } from 'lucide-react-native';
import { useFinanceStore } from '@/store/useFinanceStore';
import { CURRENCIES, formatMonthLabel } from '@/utils/formatters';

interface MonthSelectorHeaderProps {
  title: string;
  subtitle?: string;
}

export function MonthSelectorHeader({ title, subtitle }: MonthSelectorHeaderProps) {
  const selectedMonth = useFinanceStore((s) => s.selectedMonth);
  const currency = useFinanceStore((s) => s.currency);
  const goToPreviousMonth = useFinanceStore((s) => s.goToPreviousMonth);
  const goToNextMonth = useFinanceStore((s) => s.goToNextMonth);
  const setCurrency = useFinanceStore((s) => s.setCurrency);

  const cycleCurrency = () => {
    const idx = CURRENCIES.findIndex((c) => c.code === currency.code);
    const nextIdx = (idx + 1) % CURRENCIES.length;
    setCurrency(CURRENCIES[nextIdx]);
  };

  return (
    <View className="px-5 pt-2 pb-4 bg-slate-950 border-b border-slate-800/80">
      <View className="flex-row items-center justify-between mb-3">
        <View>
          <Text className="text-2xl font-bold text-white tracking-tight">{title}</Text>
          {subtitle ? (
            <Text className="text-xs text-slate-400 mt-0.5">{subtitle}</Text>
          ) : null}
        </View>

        <Pressable
          onPress={cycleCurrency}
          className="flex-row items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full active:opacity-75"
        >
          <Coins size={14} color="#10B981" />
          <Text className="text-xs font-semibold text-emerald-400">
            {currency.code} ({currency.symbol})
          </Text>
        </Pressable>
      </View>

      <View className="flex-row items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl px-3 py-2">
        <Pressable
          onPress={() => void goToPreviousMonth()}
          className="p-2 rounded-xl bg-slate-800/80 active:bg-slate-700"
          hitSlop={8}
        >
          <ChevronLeft size={18} color="#F8FAFC" />
        </Pressable>

        <View className="items-center">
          <Text className="text-xs uppercase tracking-wider text-slate-400 font-medium">
            Periodo activo
          </Text>
          <Text className="text-base font-bold text-white">
            {formatMonthLabel(selectedMonth)}
          </Text>
        </View>

        <Pressable
          onPress={() => void goToNextMonth()}
          className="p-2 rounded-xl bg-slate-800/80 active:bg-slate-700"
          hitSlop={8}
        >
          <ChevronRight size={18} color="#F8FAFC" />
        </Pressable>
      </View>
    </View>
  );
}
