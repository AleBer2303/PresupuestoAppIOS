import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarClock, Plus, Trash2 } from 'lucide-react-native';
import {
  useFinanceStore,
  type TransactionWithCategory,
} from '@/store/useFinanceStore';
import { MonthSelectorHeader } from '@/components/MonthSelectorHeader';
import { CategoryIcon } from '@/components/CategoryIcon';
import {
  formatCurrencyFromCents,
  formatDateGroupHeader,
} from '@/utils/formatters';

type FilterType = 'all' | 'expense' | 'income';

interface DateGroup {
  dateKey: string;
  items: TransactionWithCategory[];
  dayNetCents: number;
}

export default function HistoryScreen() {
  const transactions = useFinanceStore((s) => s.transactions);
  const currency = useFinanceStore((s) => s.currency);
  const deleteTransaction = useFinanceStore((s) => s.deleteTransaction);
  const openTransactionModal = useFinanceStore((s) => s.openTransactionModal);

  const [filterType, setFilterType] = useState<FilterType>('all');

  const groupedTransactions = useMemo<DateGroup[]>(() => {
    const filtered = transactions.filter((tx) =>
      filterType === 'all' ? true : tx.type === filterType
    );

    const groupsMap = new Map<string, TransactionWithCategory[]>();
    for (const tx of filtered) {
      const dateKey = tx.date.slice(0, 10);
      const list = groupsMap.get(dateKey) ?? [];
      list.push(tx);
      groupsMap.set(dateKey, list);
    }

    return Array.from(groupsMap.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dateKey, items]) => {
        const dayNetCents = items.reduce(
          (acc, item) =>
            item.type === 'income' ? acc + item.amount : acc - item.amount,
          0
        );
        return { dateKey, items, dayNetCents };
      });
  }, [transactions, filterType]);

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={['top']}>
      <MonthSelectorHeader
        title="Historial de Movimientos"
        subtitle="Agrupado por fecha con filtro mensual"
      />

      {/* Filtros por tipo */}
      <View className="px-5 pt-3 pb-2 flex-row gap-2">
        {(
          [
            { key: 'all', label: 'Todos' },
            { key: 'expense', label: 'Gastos' },
            { key: 'income', label: 'Ingresos' },
          ] as const
        ).map((tab) => {
          const isActive = filterType === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setFilterType(tab.key)}
              className={`px-4 py-2 rounded-full border ${
                isActive
                  ? 'bg-emerald-500/20 border-emerald-500'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  isActive ? 'text-emerald-400' : 'text-slate-400'
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 10, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {groupedTransactions.length === 0 ? (
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-8 items-center mt-6">
            <View className="w-14 h-14 rounded-2xl bg-slate-800 items-center justify-center mb-3">
              <CalendarClock size={28} color="#64748B" />
            </View>
            <Text className="text-base font-bold text-white mb-1">
              No hay transacciones registradas
            </Text>
            <Text className="text-xs text-slate-400 text-center mb-5">
              No se encontraron movimientos para el filtro y mes seleccionados.
            </Text>
            <Pressable
              onPress={() => openTransactionModal('expense')}
              className="flex-row items-center gap-2 bg-emerald-500 px-4 py-2.5 rounded-xl active:opacity-80"
            >
              <Plus size={16} color="#FFFFFF" />
              <Text className="text-xs font-bold text-white">
                Registrar movimiento
              </Text>
            </Pressable>
          </View>
        ) : (
          groupedTransactions.map((group) => (
            <View key={group.dateKey} className="mb-5">
              {/* Encabezado de Fecha */}
              <View className="flex-row items-center justify-between px-1 mb-2">
                <Text className="text-xs uppercase tracking-wider font-bold text-slate-400">
                  {formatDateGroupHeader(group.dateKey)}
                </Text>
                <Text
                  className={`text-xs font-bold ${
                    group.dayNetCents >= 0 ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  {group.dayNetCents >= 0 ? '+' : ''}
                  {formatCurrencyFromCents(group.dayNetCents, currency)}
                </Text>
              </View>

              {/* Lista del día */}
              <View className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                {group.items.map((tx, idx) => (
                  <View
                    key={tx.id}
                    className={`flex-row items-center justify-between px-4 py-3.5 ${
                      idx < group.items.length - 1
                        ? 'border-b border-slate-800/80'
                        : ''
                    }`}
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      <View
                        style={{ backgroundColor: `${tx.category.color}22` }}
                        className="w-10 h-10 rounded-2xl items-center justify-center"
                      >
                        <CategoryIcon
                          name={tx.category.icon}
                          color={tx.category.color}
                          size={20}
                        />
                      </View>
                      <View className="flex-1 pr-2">
                        <Text
                          className="text-sm font-bold text-white"
                          numberOfLines={1}
                        >
                          {tx.category.name}
                        </Text>
                        <Text
                          className="text-xs text-slate-400 mt-0.5"
                          numberOfLines={1}
                        >
                          {tx.note || 'Sin nota adicional'}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center gap-3">
                      <Text
                        className={`text-sm font-extrabold ${
                          tx.type === 'income'
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {formatCurrencyFromCents(tx.amount, currency)}
                      </Text>

                      <Pressable
                        onPress={() => void deleteTransaction(tx.id)}
                        className="p-2 rounded-xl bg-slate-800/80 active:bg-rose-500/20"
                        hitSlop={6}
                      >
                        <Trash2 size={15} color="#94A3B8" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
