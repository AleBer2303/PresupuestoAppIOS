import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarClock, Plus, Trash2 } from 'lucide-react-native';
import {
  useFinanceStore,
  type TransactionWithCategory,
} from '@/store/useFinanceStore';
import { MonthSelectorHeader } from '@/components/MonthSelectorHeader';
import { CategoryIcon } from '@/components/CategoryIcon';
import {
  LiquidGlassCard,
  LiquidScreenCanvas,
  SpringPressable,
  useLiquidTheme,
} from '@/components/LiquidGlass';
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

  const { tokens } = useLiquidTheme();
  const insets = useSafeAreaInsets();
  const dynamicScrollBottom = Math.max(insets.bottom, 16) + 130;
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
    <LiquidScreenCanvas>
      <SafeAreaView style={styles.flexOne} edges={['top']}>
        <MonthSelectorHeader
          title="Historial"
          subtitle="Movimientos agrupados por fecha"
        />

        {/* Filtros Liquid Glass por tipo */}
        <View style={styles.filterRow}>
          {(
            [
              { key: 'all', label: 'Todos' },
              { key: 'expense', label: 'Gastos' },
              { key: 'income', label: 'Ingresos' },
            ] as const
          ).map((tab) => {
            const isActive = filterType === tab.key;
            return (
              <SpringPressable
                key={tab.key}
                onPress={() => setFilterType(tab.key)}
                scaleDown={0.93}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isActive
                      ? 'rgba(16, 185, 129, 0.18)'
                      : tokens.glassPillBg,
                    borderColor: isActive ? tokens.emerald : tokens.glassBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isActive ? tokens.emerald : tokens.textSecondary,
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </SpringPressable>
            );
          })}
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: dynamicScrollBottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {groupedTransactions.length === 0 ? (
            <LiquidGlassCard delay={40} style={styles.mt12}>
              <View style={styles.emptyBox}>
                <View
                  style={[
                    styles.emptyIconCircle,
                    {
                      backgroundColor: tokens.glassInsetBg,
                      borderColor: tokens.glassBorder,
                    },
                  ]}
                >
                  <CalendarClock size={28} color={tokens.textMuted} />
                </View>
                <Text style={[styles.emptyTitle, { color: tokens.textPrimary }]}>
                  No hay transacciones registradas
                </Text>
                <Text style={[styles.emptySubtitle, { color: tokens.textSecondary }]}>
                  No se encontraron movimientos para el filtro y mes seleccionados.
                </Text>
                <SpringPressable
                  onPress={() => openTransactionModal('expense')}
                  style={[
                    styles.emptyCtaBtn,
                    { backgroundColor: tokens.emerald },
                  ]}
                >
                  <Plus size={16} color="#FFFFFF" />
                  <Text style={styles.emptyCtaText}>Registrar movimiento</Text>
                </SpringPressable>
              </View>
            </LiquidGlassCard>
          ) : (
            groupedTransactions.map((group, groupIdx) => (
              <View key={group.dateKey} style={styles.groupBlock}>
                {/* Encabezado de Fecha */}
                <View style={styles.dateHeaderRow}>
                  <Text style={[styles.dateHeaderText, { color: tokens.textSecondary }]}>
                    {formatDateGroupHeader(group.dateKey)}
                  </Text>
                  <Text
                    style={[
                      styles.dateNetText,
                      {
                        color:
                          group.dayNetCents >= 0
                            ? tokens.emerald
                            : tokens.textSecondary,
                      },
                    ]}
                  >
                    {group.dayNetCents >= 0 ? '+' : ''}
                    {formatCurrencyFromCents(group.dayNetCents, currency)}
                  </Text>
                </View>

                {/* Lista del día en tarjeta Liquid Glass */}
                <LiquidGlassCard
                  delay={40 + groupIdx * 45}
                  contentStyle={styles.zeroPadding}
                >
                  {group.items.map((tx, idx) => (
                    <View
                      key={tx.id}
                      style={[
                        styles.txRow,
                        idx < group.items.length - 1 && {
                          borderBottomWidth: 1,
                          borderBottomColor: tokens.divider,
                        },
                      ]}
                    >
                      <View style={styles.txLeft}>
                        <View
                          style={[
                            styles.txIconBox,
                            { backgroundColor: `${tx.category.color}24` },
                          ]}
                        >
                          <CategoryIcon
                            name={tx.category.icon}
                            color={tx.category.color}
                            size={20}
                          />
                        </View>
                        <View style={styles.txTextCol}>
                          <Text
                            style={[
                              styles.txCategoryName,
                              { color: tokens.textPrimary },
                            ]}
                            numberOfLines={1}
                          >
                            {tx.category.name}
                          </Text>
                          <Text
                            style={[styles.txNote, { color: tokens.textSecondary }]}
                            numberOfLines={1}
                          >
                            {tx.note || 'Sin nota adicional'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.txRight}>
                        <Text
                          style={[
                            styles.txAmount,
                            {
                              color:
                                tx.type === 'income'
                                  ? tokens.emerald
                                  : tokens.rose,
                            },
                          ]}
                        >
                          {tx.type === 'income' ? '+' : '-'}
                          {formatCurrencyFromCents(tx.amount, currency)}
                        </Text>

                        <SpringPressable
                          onPress={() => void deleteTransaction(tx.id)}
                          scaleDown={0.85}
                          hitSlop={6}
                          style={[
                            styles.deleteBtn,
                            {
                              backgroundColor: tokens.glassInsetBg,
                              borderColor: tokens.glassBorder,
                            },
                          ]}
                        >
                          <Trash2 size={15} color={tokens.textMuted} />
                        </SpringPressable>
                      </View>
                    </View>
                  ))}
                </LiquidGlassCard>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </LiquidScreenCanvas>
  );
}

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  zeroPadding: {
    padding: 0,
  },
  mt12: {
    marginTop: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
  },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingTop: 10,
    paddingBottom: 140,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  emptyIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 16,
  },
  emptyCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 14,
  },
  emptyCtaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  groupBlock: {
    marginBottom: 18,
  },
  dateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  dateHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  dateNetText: {
    fontSize: 12,
    fontWeight: '800',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  txIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txTextCol: {
    flex: 1,
    paddingRight: 8,
  },
  txCategoryName: {
    fontSize: 14,
    fontWeight: '700',
  },
  txNote: {
    fontSize: 12,
    marginTop: 2,
  },
  txRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
