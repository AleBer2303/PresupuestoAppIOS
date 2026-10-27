import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
  AnimatedProgressBar,
  LiquidGlassCard,
  LiquidScreenCanvas,
  SpringPressable,
  useLiquidTheme,
} from '@/components/LiquidGlass';
import {
  formatCurrencyFromCents,
  parseInputToCents,
} from '@/utils/formatters';

export default function BudgetsScreen() {
  const budgetStatuses = useFinanceStore((s) => s.budgetStatuses);
  const balanceSummary = useFinanceStore((s) => s.balanceSummary);
  const currency = useFinanceStore((s) => s.currency);
  const upsertBudgetLimit = useFinanceStore((s) => s.upsertBudgetLimit);

  const { tokens } = useLiquidTheme();
  const insets = useSafeAreaInsets();
  const dynamicScrollBottom = Math.max(insets.bottom, 16) + 130;

  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [limitInput, setLimitInput] = useState<string>('');

  const startEditing = (categoryId: number, currentLimitInCents: number) => {
    setEditingCategoryId(categoryId);
    setLimitInput(
      currentLimitInCents > 0 ? String(Math.round(currentLimitInCents / 100)) : ''
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
    <LiquidScreenCanvas>
      <SafeAreaView style={styles.flexOne} edges={['top']}>
        <MonthSelectorHeader
          title="Presupuesto Mensual"
          subtitle="Control por categoría y alertas de consumo (80% / 100%)"
        />

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: dynamicScrollBottom },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Resumen de Presupuesto Global */}
          <LiquidGlassCard variant="hero" delay={20} style={styles.mb18}>
            <View style={styles.summaryTopRow}>
              <View>
                <Text style={[styles.uppercaseLabel, { color: tokens.textSecondary }]}>
                  Total Asignado
                </Text>
                <Text style={[styles.summaryPrimaryVal, { color: tokens.textPrimary }]}>
                  {formatCurrencyFromCents(balanceSummary.totalBudgetLimit, currency)}
                </Text>
              </View>

              <View style={styles.alignEnd}>
                <Text style={[styles.uppercaseLabel, { color: tokens.textSecondary }]}>
                  Total Ejecutado
                </Text>
                <Text style={[styles.summarySecondaryVal, { color: tokens.rose }]}>
                  {formatCurrencyFromCents(balanceSummary.totalExpense, currency)}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.legendRow,
                { borderTopColor: tokens.divider },
              ]}
            >
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                <Text style={[styles.legendText, { color: tokens.textSecondary }]}>
                  &lt; 80% Óptimo
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
                <Text style={[styles.legendText, { color: tokens.textSecondary }]}>
                  &ge; 80% Alerta
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: '#F43F5E' }]} />
                <Text style={[styles.legendText, { color: tokens.textSecondary }]}>
                  &ge; 100% Excedido
                </Text>
              </View>
            </View>
          </LiquidGlassCard>

          {/* Lista de Categorías con Barra de Progreso Liquid Glass */}
          {budgetStatuses.map((item, index) => {
            const isEditing = editingCategoryId === item.category.id;

            const customBorderColor =
              item.alertLevel === 'danger'
                ? 'rgba(244, 63, 94, 0.55)'
                : item.alertLevel === 'warning'
                  ? 'rgba(245, 158, 11, 0.55)'
                  : undefined;

            const barFillColors: [string, string] =
              item.alertLevel === 'danger'
                ? ['#FB7185', '#E11D48']
                : item.alertLevel === 'warning'
                  ? ['#FBBF24', '#D97706']
                  : ['#34D399', '#10B981'];

            return (
              <LiquidGlassCard
                key={item.category.id}
                delay={50 + index * 35}
                borderColor={customBorderColor}
                style={styles.mb14}
              >
                <View style={styles.catHeaderRow}>
                  <View style={styles.catLeft}>
                    <View
                      style={[
                        styles.catIconBox,
                        { backgroundColor: `${item.category.color}24` },
                      ]}
                    >
                      <CategoryIcon
                        name={item.category.icon}
                        color={item.category.color}
                        size={22}
                      />
                    </View>
                    <View style={styles.flexOne}>
                      <Text
                        style={[styles.catName, { color: tokens.textPrimary }]}
                        numberOfLines={1}
                      >
                        {item.category.name}
                      </Text>
                      <Text
                        style={[styles.catAmounts, { color: tokens.textSecondary }]}
                        numberOfLines={1}
                      >
                        {item.limitAmount > 0
                          ? `${formatCurrencyFromCents(item.spentAmount, currency)} de ${formatCurrencyFromCents(item.limitAmount, currency)}`
                          : `Gastado: ${formatCurrencyFromCents(item.spentAmount, currency)} · Sin límite`}
                      </Text>
                    </View>
                  </View>

                  <SpringPressable
                    onPress={() =>
                      isEditing
                        ? cancelEditing()
                        : startEditing(item.category.id, item.limitAmount)
                    }
                    scaleDown={0.88}
                    style={[
                      styles.editIconBtn,
                      {
                        backgroundColor: tokens.glassInsetBg,
                        borderColor: tokens.glassBorder,
                      },
                    ]}
                  >
                    {isEditing ? (
                      <X size={16} color={tokens.textSecondary} />
                    ) : (
                      <Pencil size={16} color={tokens.emerald} />
                    )}
                  </SpringPressable>
                </View>

                {/* Editor rápido de límite mensual */}
                {isEditing ? (
                  <View
                    style={[
                      styles.editorBox,
                      {
                        backgroundColor: tokens.glassInsetBg,
                        borderColor: tokens.glassBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.editorCurrency, { color: tokens.emerald }]}>
                      {currency.symbol}
                    </Text>
                    <TextInput
                      value={limitInput}
                      onChangeText={setLimitInput}
                      placeholder="0"
                      placeholderTextColor={tokens.textMuted}
                      keyboardType="decimal-pad"
                      style={[styles.editorInput, { color: tokens.textPrimary }]}
                      autoFocus
                    />
                    <SpringPressable
                      onPress={() => void saveLimit(item.category.id)}
                      scaleDown={0.92}
                      style={[
                        styles.saveLimitBtn,
                        { backgroundColor: tokens.emerald },
                      ]}
                    >
                      <Check size={15} color="#FFFFFF" />
                      <Text style={styles.saveLimitBtnText}>Guardar</Text>
                    </SpringPressable>
                  </View>
                ) : null}

                {/* Barra de Progreso Animada */}
                <View style={styles.barWrapper}>
                  <AnimatedProgressBar
                    percentage={item.limitAmount > 0 ? item.percentage : 0}
                    fillColors={barFillColors}
                    height={10}
                    delay={90 + index * 30}
                  />
                </View>

                {/* Estado / Alerta Visual 80% y 100% */}
                <View style={styles.statusRow}>
                  {item.limitAmount === 0 ? (
                    <Text style={[styles.noLimitHint, { color: tokens.textMuted }]}>
                      Toca el lápiz para asignar tope mensual
                    </Text>
                  ) : item.alertLevel === 'danger' ? (
                    <View style={styles.dangerBadge}>
                      <AlertCircle size={14} color={tokens.rose} />
                      <Text style={[styles.badgeText, { color: tokens.rose }]}>
                        ¡Tope superado! ({item.percentage.toFixed(0)}%)
                      </Text>
                    </View>
                  ) : item.alertLevel === 'warning' ? (
                    <View style={styles.warningBadge}>
                      <AlertTriangle size={14} color={tokens.amber} />
                      <Text style={[styles.badgeText, { color: tokens.amber }]}>
                        Alerta &gt;80% ({item.percentage.toFixed(0)}%)
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.normalBadge}>
                      <CheckCircle2 size={14} color={tokens.emerald} />
                      <Text style={[styles.badgeText, { color: tokens.emerald }]}>
                        Óptimo ({item.percentage.toFixed(0)}%)
                      </Text>
                    </View>
                  )}

                  {item.limitAmount > 0 ? (
                    <Text
                      style={[
                        styles.remainingText,
                        {
                          color:
                            item.remainingAmount >= 0
                              ? tokens.textSecondary
                              : tokens.rose,
                        },
                      ]}
                    >
                      {item.remainingAmount >= 0
                        ? `Restan ${formatCurrencyFromCents(item.remainingAmount, currency)}`
                        : `Exceso ${formatCurrencyFromCents(Math.abs(item.remainingAmount), currency)}`}
                    </Text>
                  ) : null}
                </View>
              </LiquidGlassCard>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </LiquidScreenCanvas>
  );
}

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  alignEnd: {
    alignItems: 'flex-end',
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 140,
  },
  mb18: {
    marginBottom: 18,
  },
  mb14: {
    marginBottom: 14,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  uppercaseLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  summaryPrimaryVal: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 2,
  },
  summarySecondaryVal: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  catHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  catLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  catIconBox: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: {
    fontSize: 15,
    fontWeight: '800',
  },
  catAmounts: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  editIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  editorCurrency: {
    fontSize: 15,
    fontWeight: '800',
  },
  editorInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    paddingVertical: 4,
  },
  saveLimitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  saveLimitBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  barWrapper: {
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  noLimitHint: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  dangerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(244, 63, 94, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  normalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  remainingText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
