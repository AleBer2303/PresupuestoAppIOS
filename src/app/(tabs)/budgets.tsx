import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  Pencil,
  X,
} from 'lucide-react-native';
import { useFinanceStore } from '@/store/useFinanceStore';
import { MonthSelectorHeader } from '@/components/MonthSelectorHeader';
import { CategoryIcon } from '@/components/CategoryIcon';
import {
  formatCurrencyFromCents,
  parseInputToCents,
} from '@/utils/formatters';

export default function BudgetsScreen() {
  const budgetStatuses = useFinanceStore((s) => s.budgetStatuses);
  const balanceSummary = useFinanceStore((s) => s.balanceSummary);
  const currency = useFinanceStore((s) => s.currency);
  const upsertBudgetLimit = useFinanceStore((s) => s.upsertBudgetLimit);

  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [limitInput, setLimitInput] = useState<string>('');

  const startEditing = (categoryId: number, currentLimitInCents: number) => {
    setEditingCategoryId(categoryId);
    setLimitInput(
      currentLimitInCents > 0 ? (currentLimitInCents / 100).toFixed(2) : ''
    );
  };

  const cancelEditing = () => {
    setEditingCategoryId(null);
    setLimitInput('');
  };

  const saveLimit = async (categoryId: number) => {
    const cents = parseInputToCents(limitInput);
    await upsertBudgetLimit(categoryId, cents);
    setEditingCategoryId(null);
    setLimitInput('');
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={['top']}>
      <MonthSelectorHeader
        title="Presupuesto Mensual"
        subtitle="Control por categoría y alertas de consumo (80% / 100%)"
      />

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Resumen de Presupuesto Global */}
        <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-5">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Total Asignado
              </Text>
              <Text className="text-2xl font-extrabold text-white mt-0.5">
                {formatCurrencyFromCents(balanceSummary.totalBudgetLimit, currency)}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Total Gastado
              </Text>
              <Text className="text-xl font-bold text-rose-400 mt-0.5">
                {formatCurrencyFromCents(balanceSummary.totalExpense, currency)}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-4 pt-3 border-t border-slate-800/80">
            <View className="flex-row items-center gap-1.5">
              <View className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <Text className="text-xs text-slate-400">&lt; 80% Óptimo</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <View className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <Text className="text-xs text-slate-400">&ge; 80% Alerta</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <View className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <Text className="text-xs text-slate-400">&ge; 100% Excedido</Text>
            </View>
          </View>
        </View>

        {/* Lista de Categorías con Barra de Progreso */}
        {budgetStatuses.map((item) => {
          const isEditing = editingCategoryId === item.category.id;
          const clampedBarWidth = Math.min(item.percentage, 100);

          const cardBorderClass =
            item.alertLevel === 'danger'
              ? 'border-rose-500/60'
              : item.alertLevel === 'warning'
                ? 'border-amber-500/60'
                : 'border-slate-800';

          const barColorClass =
            item.alertLevel === 'danger'
              ? 'bg-rose-500'
              : item.alertLevel === 'warning'
                ? 'bg-amber-500'
                : 'bg-emerald-500';

          return (
            <View
              key={item.category.id}
              className={`bg-slate-900 border ${cardBorderClass} rounded-3xl p-4 mb-3.5`}
            >
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-3">
                  <View
                    style={{ backgroundColor: `${item.category.color}22` }}
                    className="w-11 h-11 rounded-2xl items-center justify-center"
                  >
                    <CategoryIcon
                      name={item.category.icon}
                      color={item.category.color}
                      size={22}
                    />
                  </View>
                  <View>
                    <Text className="text-base font-bold text-white">
                      {item.category.name}
                    </Text>
                    <Text className="text-xs text-slate-400 mt-0.5">
                      {item.limitAmount > 0
                        ? `${formatCurrencyFromCents(item.spentAmount, currency)} de ${formatCurrencyFromCents(item.limitAmount, currency)}`
                        : `Gastado: ${formatCurrencyFromCents(item.spentAmount, currency)} · Sin límite`}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() =>
                    isEditing
                      ? cancelEditing()
                      : startEditing(item.category.id, item.limitAmount)
                  }
                  className="p-2.5 rounded-xl bg-slate-800 active:opacity-75"
                >
                  {isEditing ? (
                    <X size={16} color="#94A3B8" />
                  ) : (
                    <Pencil size={16} color="#10B981" />
                  )}
                </Pressable>
              </View>

              {/* Editor rápido de límite mensual */}
              {isEditing ? (
                <View className="flex-row items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl p-2.5 mb-3">
                  <Text className="text-sm font-bold text-emerald-400 pl-2">
                    {currency.symbol}
                  </Text>
                  <TextInput
                    value={limitInput}
                    onChangeText={setLimitInput}
                    placeholder="0.00"
                    placeholderTextColor="#475569"
                    keyboardType="decimal-pad"
                    className="flex-1 text-white font-bold text-base py-1"
                    autoFocus
                  />
                  <Pressable
                    onPress={() => void saveLimit(item.category.id)}
                    className="flex-row items-center gap-1 bg-emerald-500 px-3.5 py-2 rounded-xl"
                  >
                    <Check size={15} color="#FFFFFF" />
                    <Text className="text-xs font-bold text-white">Guardar</Text>
                  </Pressable>
                </View>
              ) : null}

              {/* Barra de Progreso */}
              <View className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-2.5">
                <View
                  style={{
                    width: `${item.limitAmount > 0 ? clampedBarWidth : 0}%`,
                  }}
                  className={`h-full rounded-full ${barColorClass}`}
                />
              </View>

              {/* Estado / Alerta Visual 80% y 100% */}
              <View className="flex-row items-center justify-between">
                {item.limitAmount === 0 ? (
                  <Text className="text-xs text-slate-500">
                    Toca el ícono de lápiz para asignar presupuesto mensual
                  </Text>
                ) : item.alertLevel === 'danger' ? (
                  <View className="flex-row items-center gap-1.5 bg-rose-500/15 px-2.5 py-1 rounded-lg">
                    <AlertCircle size={14} color="#FB7185" />
                    <Text className="text-xs font-bold text-rose-400">
                      ¡Presupuesto superado! ({item.percentage.toFixed(0)}%)
                    </Text>
                  </View>
                ) : item.alertLevel === 'warning' ? (
                  <View className="flex-row items-center gap-1.5 bg-amber-500/15 px-2.5 py-1 rounded-lg">
                    <AlertTriangle size={14} color="#FBBF24" />
                    <Text className="text-xs font-bold text-amber-400">
                      Alerta: &gt;80% consumido ({item.percentage.toFixed(0)}%)
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row items-center gap-1.5">
                    <CheckCircle2 size={14} color="#34D399" />
                    <Text className="text-xs font-medium text-emerald-400">
                      Dentro del presupuesto ({item.percentage.toFixed(0)}%)
                    </Text>
                  </View>
                )}

                {item.limitAmount > 0 ? (
                  <Text
                    className={`text-xs font-semibold ${
                      item.remainingAmount >= 0
                        ? 'text-slate-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {item.remainingAmount >= 0
                      ? `Restan ${formatCurrencyFromCents(item.remainingAmount, currency)}`
                      : `Exceso ${formatCurrencyFromCents(Math.abs(item.remainingAmount), currency)}`}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
