import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BarChart } from 'react-native-gifted-charts';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  FileSpreadsheet,
  PieChart,
  PlusCircle,
  Wallet,
} from 'lucide-react-native';
import { useFinanceStore } from '@/store/useFinanceStore';
import { MonthSelectorHeader } from '@/components/MonthSelectorHeader';
import { CategoryIcon } from '@/components/CategoryIcon';
import { formatCurrencyFromCents } from '@/utils/formatters';

export default function DashboardScreen() {
  const balanceSummary = useFinanceStore((s) => s.balanceSummary);
  const transactions = useFinanceStore((s) => s.transactions);
  const budgetStatuses = useFinanceStore((s) => s.budgetStatuses);
  const currency = useFinanceStore((s) => s.currency);
  const openTransactionModal = useFinanceStore((s) => s.openTransactionModal);
  const restoreExcelData = useFinanceStore((s) => s.restoreExcelData);

  const clampedPercentage = Math.min(balanceSummary.budgetUsedPercentage, 100);
  const isOver100 = balanceSummary.budgetUsedPercentage >= 100;
  const isOver80 =
    balanceSummary.budgetUsedPercentage >= 80 &&
    balanceSummary.budgetUsedPercentage < 100;

  const progressColorClass = isOver100
    ? 'bg-rose-500'
    : isOver80
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  const chartData = useMemo(() => {
    const incomeDollars = Math.round(balanceSummary.totalIncome / 100);
    const expenseDollars = Math.round(balanceSummary.totalExpense / 100);
    const budgetDollars = Math.round(balanceSummary.totalBudgetLimit / 100);

    return [
      {
        value: incomeDollars,
        label: 'Ingresos',
        frontColor: '#10B981',
      },
      {
        value: expenseDollars,
        label: 'Gastos',
        frontColor: '#F43F5E',
      },
      {
        value: budgetDollars,
        label: 'Tope Mes',
        frontColor: '#6366F1',
      },
    ];
  }, [balanceSummary]);

  const alertBudgets = useMemo(
    () => budgetStatuses.filter((b) => b.alertLevel !== 'normal'),
    [budgetStatuses]
  );

  const recentTransactions = useMemo(
    () => transactions.slice(0, 5),
    [transactions]
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={['top']}>
      <MonthSelectorHeader
        title="Mi Presupuesto"
        subtitle="Control de finanzas offline-first"
      />

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Tarjeta Principal de Balance Mensual */}
        <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-4">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Balance Disponible del Mes
            </Text>
            <Wallet size={18} color="#10B981" />
          </View>

          <Text
            className={`text-3xl font-extrabold tracking-tight mb-5 ${
              balanceSummary.netBalance >= 0 ? 'text-white' : 'text-rose-400'
            }`}
          >
            {formatCurrencyFromCents(balanceSummary.netBalance, currency)}
          </Text>

          <View className="flex-row gap-3">
            {/* Ingresos */}
            <View className="flex-1 bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3.5">
              <View className="flex-row items-center gap-2 mb-1">
                <View className="w-6 h-6 rounded-full bg-emerald-500/20 items-center justify-center">
                  <ArrowDownLeft size={14} color="#10B981" />
                </View>
                <Text className="text-xs font-medium text-slate-400">Ingresos</Text>
              </View>
              <Text className="text-base font-bold text-emerald-400">
                {formatCurrencyFromCents(balanceSummary.totalIncome, currency)}
              </Text>
            </View>

            {/* Gastos */}
            <View className="flex-1 bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3.5">
              <View className="flex-row items-center gap-2 mb-1">
                <View className="w-6 h-6 rounded-full bg-rose-500/20 items-center justify-center">
                  <ArrowUpRight size={14} color="#F43F5E" />
                </View>
                <Text className="text-xs font-medium text-slate-400">Gastos</Text>
              </View>
              <Text className="text-base font-bold text-rose-400">
                {formatCurrencyFromCents(balanceSummary.totalExpense, currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Barra de Progreso del Presupuesto General */}
        <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <View>
              <Text className="text-sm font-bold text-white">
                Presupuesto General Mensual
              </Text>
              <Text className="text-xs text-slate-400 mt-0.5">
                {formatCurrencyFromCents(balanceSummary.totalExpense, currency)} de{' '}
                {formatCurrencyFromCents(balanceSummary.totalBudgetLimit, currency)}
              </Text>
            </View>

            <View
              className={`px-2.5 py-1 rounded-full ${
                isOver100
                  ? 'bg-rose-500/20'
                  : isOver80
                    ? 'bg-amber-500/20'
                    : 'bg-emerald-500/20'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  isOver100
                    ? 'text-rose-400'
                    : isOver80
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                }`}
              >
                {balanceSummary.budgetUsedPercentage.toFixed(0)}%
              </Text>
            </View>
          </View>

          <View className="w-full h-3 bg-slate-800 rounded-full overflow-hidden my-2">
            <View
              style={{ width: `${clampedPercentage}%` }}
              className={`h-full rounded-full ${progressColorClass}`}
            />
          </View>

          {alertBudgets.length > 0 ? (
            <View className="flex-row items-center gap-2 mt-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
              <AlertTriangle size={15} color="#F59E0B" />
              <Text className="text-xs text-amber-300 flex-1 font-medium">
                {alertBudgets.length}{' '}
                {alertBudgets.length === 1
                  ? 'categoría supera el 80% de su presupuesto.'
                  : 'categorías superan el 80% de su presupuesto.'}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Accesos Rápidos */}
        <Text className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2.5">
          Accesos Rápidos
        </Text>
        <View className="flex-row gap-2.5 mb-5">
          <Pressable
            onPress={() => openTransactionModal('expense')}
            className="flex-1 bg-rose-500/15 border border-rose-500/30 rounded-2xl p-3.5 items-center active:opacity-75"
          >
            <PlusCircle size={20} color="#FB7185" />
            <Text className="text-xs font-bold text-rose-300 mt-1.5">
              + Gasto
            </Text>
          </Pressable>

          <Pressable
            onPress={() => openTransactionModal('income')}
            className="flex-1 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl p-3.5 items-center active:opacity-75"
          >
            <PlusCircle size={20} color="#34D399" />
            <Text className="text-xs font-bold text-emerald-300 mt-1.5">
              + Ingreso
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)/budgets')}
            className="flex-1 bg-indigo-500/15 border border-indigo-500/30 rounded-2xl p-3.5 items-center active:opacity-75"
          >
            <PieChart size={20} color="#818CF8" />
            <Text className="text-xs font-bold text-indigo-300 mt-1.5">
              Límites
            </Text>
          </Pressable>

          <Pressable
            onPress={() => void restoreExcelData()}
            className="flex-1 bg-teal-500/15 border border-teal-500/30 rounded-2xl p-3.5 items-center active:opacity-75"
          >
            <FileSpreadsheet size={20} color="#2DD4BF" />
            <Text className="text-xs font-bold text-teal-300 mt-1.5">
              Base Excel
            </Text>
          </Pressable>
        </View>

        {/* Gráfico Comparativo (react-native-gifted-charts) */}
        <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-5">
          <Text className="text-sm font-bold text-white mb-1">
            Resumen Gráfico del Mes
          </Text>
          <Text className="text-xs text-slate-400 mb-4">
            Comparativa de Ingresos, Gastos y Tope Presupuestado
          </Text>
          <View className="items-center">
            <BarChart
              data={chartData}
              barWidth={42}
              spacing={36}
              roundedTop
              roundedBottom
              noOfSections={4}
              yAxisThickness={0}
              xAxisThickness={1}
              xAxisColor="#1E293B"
              yAxisTextStyle={{ color: '#64748B', fontSize: 10 }}
              xAxisLabelTextStyle={{ color: '#94A3B8', fontSize: 11, fontWeight: '600' }}
              hideRules={false}
              rulesColor="#1E293B"
              height={140}
              isAnimated
            />
          </View>
        </View>

        {/* Últimos Movimientos */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-xs uppercase tracking-wider font-semibold text-slate-400">
            Movimientos Recientes
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/history')}
            className="flex-row items-center gap-1"
          >
            <Text className="text-xs font-semibold text-emerald-400">
              Ver todo
            </Text>
            <ChevronRight size={14} color="#10B981" />
          </Pressable>
        </View>

        {recentTransactions.length === 0 ? (
          <View className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 items-center">
            <Text className="text-sm font-semibold text-slate-300 mb-1">
              Sin movimientos este mes
            </Text>
            <Text className="text-xs text-slate-500 text-center">
              Toca el botón + para registrar tu primer ingreso o gasto.
            </Text>
          </View>
        ) : (
          <View className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
            {recentTransactions.map((tx, idx) => (
              <View
                key={tx.id}
                className={`flex-row items-center justify-between px-4 py-3.5 ${
                  idx < recentTransactions.length - 1
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
                    <Text className="text-sm font-bold text-white" numberOfLines={1}>
                      {tx.category.name}
                    </Text>
                    <Text className="text-xs text-slate-400" numberOfLines={1}>
                      {tx.note || tx.date.slice(0, 10)}
                    </Text>
                  </View>
                </View>

                <Text
                  className={`text-sm font-extrabold ${
                    tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '-'}
                  {formatCurrencyFromCents(tx.amount, currency)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
