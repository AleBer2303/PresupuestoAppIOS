import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
  Sparkles,
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
import { formatCurrencyFromCents } from '@/utils/formatters';

export default function DashboardScreen() {
  const balanceSummary = useFinanceStore((s) => s.balanceSummary);
  const transactions = useFinanceStore((s) => s.transactions);
  const budgetStatuses = useFinanceStore((s) => s.budgetStatuses);
  const currency = useFinanceStore((s) => s.currency);
  const openTransactionModal = useFinanceStore((s) => s.openTransactionModal);
  const restoreExcelData = useFinanceStore((s) => s.restoreExcelData);

  const { tokens } = useLiquidTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  // Dimensiones dinámicas calibradas para iPhone 16 Pro Max (440pt) y Web
  const screenContentWidth = Math.min(windowWidth - 40, 520);
  const chartInnerWidth = screenContentWidth - 36;
  const chartYAxisWidth = 44;
  const chartPlotAreaWidth = chartInnerWidth - chartYAxisWidth;
  const barWidth = Math.max(48, Math.min(62, Math.floor(chartPlotAreaWidth * 0.17)));
  const barSpacing = Math.max(34, Math.min(52, Math.floor(chartPlotAreaWidth * 0.14)));
  const totalBarsWidth = 3 * barWidth + 2 * barSpacing;
  const chartInitialSpacing = Math.max(
    14,
    Math.floor((chartPlotAreaWidth - totalBarsWidth) / 2)
  );
  const dynamicScrollBottom = Math.max(insets.bottom, 16) + 130;

  const isOver100 = balanceSummary.budgetUsedPercentage >= 100;
  const isOver80 =
    balanceSummary.budgetUsedPercentage >= 80 &&
    balanceSummary.budgetUsedPercentage < 100;

  const progressGradient: [string, string] = isOver100
    ? ['#FB7185', '#E11D48']
    : isOver80
      ? ['#FBBF24', '#D97706']
      : ['#34D399', '#10B981'];

  const chartData = useMemo(() => {
    const incomeUnits = Math.round(balanceSummary.totalIncome / 100);
    const expenseUnits = Math.round(balanceSummary.totalExpense / 100);
    const budgetUnits = Math.round(balanceSummary.totalBudgetLimit / 100);

    return [
      {
        value: incomeUnits,
        label: 'Ingresos',
        frontColor: '#10B981',
        gradientColor: '#34D399',
        showGradient: true,
      },
      {
        value: expenseUnits,
        label: 'Gastos',
        frontColor: '#F43F5E',
        gradientColor: '#FB7185',
        showGradient: true,
      },
      {
        value: budgetUnits,
        label: 'Tope Mes',
        frontColor: '#6366F1',
        gradientColor: '#818CF8',
        showGradient: true,
      },
    ];
  }, [balanceSummary]);

  const alertBudgets = useMemo(
    () => budgetStatuses.filter((b) => b.alertLevel !== 'normal'),
    [budgetStatuses]
  );

  const recentTransactions = useMemo(
    () => transactions.slice(0, 6),
    [transactions]
  );

  return (
    <LiquidScreenCanvas>
      <SafeAreaView style={styles.flexOne} edges={['top']}>
        <MonthSelectorHeader
          title="Mi Presupuesto"
          subtitle="Liquid Glass · Control financiero offline-first"
        />

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: dynamicScrollBottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Tarjeta Hero Liquid Glass de Balance Mensual */}
          <LiquidGlassCard variant="hero" delay={20} style={styles.mb16}>
            <View style={styles.heroHeaderRow}>
              <Text style={[styles.uppercaseLabel, { color: tokens.textSecondary }]}>
                Balance Disponible del Mes
              </Text>
              <View
                style={[
                  styles.sparkleBadge,
                  {
                    backgroundColor: tokens.glassInsetBg,
                    borderColor: tokens.glassBorder,
                  },
                ]}
              >
                <Sparkles size={13} color={tokens.emerald} />
                <Text style={[styles.sparkleText, { color: tokens.emerald }]}>
                  Tiempo real
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.heroBalanceAmount,
                {
                  color:
                    balanceSummary.netBalance >= 0
                      ? tokens.textPrimary
                      : tokens.rose,
                },
              ]}
            >
              {formatCurrencyFromCents(balanceSummary.netBalance, currency)}
            </Text>

            <View style={styles.metricsRow}>
              {/* Ingresos */}
              <View
                style={[
                  styles.metricSubCard,
                  {
                    backgroundColor: tokens.glassInsetBg,
                    borderColor: tokens.glassBorder,
                  },
                ]}
              >
                <View style={styles.metricTitleRow}>
                  <View style={styles.incomeIconCircle}>
                    <ArrowDownLeft size={14} color="#10B981" />
                  </View>
                  <Text style={[styles.metricLabel, { color: tokens.textSecondary }]}>
                    Ingresos
                  </Text>
                </View>
                <Text style={[styles.metricValue, { color: tokens.emerald }]}>
                  {formatCurrencyFromCents(balanceSummary.totalIncome, currency)}
                </Text>
              </View>

              {/* Gastos */}
              <View
                style={[
                  styles.metricSubCard,
                  {
                    backgroundColor: tokens.glassInsetBg,
                    borderColor: tokens.glassBorder,
                  },
                ]}
              >
                <View style={styles.metricTitleRow}>
                  <View style={styles.expenseIconCircle}>
                    <ArrowUpRight size={14} color="#F43F5E" />
                  </View>
                  <Text style={[styles.metricLabel, { color: tokens.textSecondary }]}>
                    Gastos
                  </Text>
                </View>
                <Text style={[styles.metricValue, { color: tokens.rose }]}>
                  {formatCurrencyFromCents(balanceSummary.totalExpense, currency)}
                </Text>
              </View>
            </View>
          </LiquidGlassCard>

          {/* Barra de Progreso del Presupuesto General */}
          <LiquidGlassCard delay={70} style={styles.mb16}>
            <View style={styles.budgetHeaderRow}>
              <View style={styles.flexOne}>
                <Text style={[styles.cardTitle, { color: tokens.textPrimary }]}>
                  Ejecución del Presupuesto Mensual
                </Text>
                <Text style={[styles.cardSubtitle, { color: tokens.textSecondary }]}>
                  {formatCurrencyFromCents(balanceSummary.totalExpense, currency)} de{' '}
                  {formatCurrencyFromCents(balanceSummary.totalBudgetLimit, currency)}
                </Text>
              </View>

              <View
                style={[
                  styles.percentagePill,
                  {
                    backgroundColor: isOver100
                      ? 'rgba(244, 63, 94, 0.16)'
                      : isOver80
                        ? 'rgba(245, 158, 11, 0.16)'
                        : 'rgba(16, 185, 129, 0.16)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.percentagePillText,
                    {
                      color: isOver100
                        ? tokens.rose
                        : isOver80
                          ? tokens.amber
                          : tokens.emerald,
                    },
                  ]}
                >
                  {balanceSummary.budgetUsedPercentage.toFixed(0)}%
                </Text>
              </View>
            </View>

            <View style={styles.my10}>
              <AnimatedProgressBar
                percentage={balanceSummary.budgetUsedPercentage}
                fillColors={progressGradient}
                height={12}
                delay={120}
              />
            </View>

            {alertBudgets.length > 0 ? (
              <View style={styles.alertBanner}>
                <AlertTriangle size={15} color="#F59E0B" />
                <Text style={[styles.alertBannerText, { color: tokens.amber }]}>
                  {alertBudgets.length}{' '}
                  {alertBudgets.length === 1
                    ? 'categoría requiere atención (>= 80% consumido).'
                    : 'categorías requieren atención (>= 80% consumido).'}
                </Text>
              </View>
            ) : null}
          </LiquidGlassCard>

          {/* Accesos Rápidos Liquid Glass con Física Spring */}
          <Text
            style={[
              styles.sectionLabel,
              { color: tokens.textSecondary },
            ]}
          >
            Accesos Rápidos
          </Text>
          <View style={styles.quickActionsGrid}>
            <SpringPressable
              onPress={() => openTransactionModal('expense')}
              style={[
                styles.quickActionTile,
                {
                  backgroundColor: tokens.glassPillBg,
                  borderColor: 'rgba(244, 63, 94, 0.32)',
                },
              ]}
            >
              <PlusCircle size={20} color={tokens.rose} />
              <Text style={[styles.quickActionLabel, { color: tokens.rose }]}>
                + Gasto
              </Text>
            </SpringPressable>

            <SpringPressable
              onPress={() => openTransactionModal('income')}
              style={[
                styles.quickActionTile,
                {
                  backgroundColor: tokens.glassPillBg,
                  borderColor: 'rgba(16, 185, 129, 0.32)',
                },
              ]}
            >
              <PlusCircle size={20} color={tokens.emerald} />
              <Text style={[styles.quickActionLabel, { color: tokens.emerald }]}>
                + Ingreso
              </Text>
            </SpringPressable>

            <SpringPressable
              onPress={() => router.push('/(tabs)/budgets')}
              style={[
                styles.quickActionTile,
                {
                  backgroundColor: tokens.glassPillBg,
                  borderColor: 'rgba(99, 102, 241, 0.32)',
                },
              ]}
            >
              <PieChart size={20} color={tokens.indigo} />
              <Text style={[styles.quickActionLabel, { color: tokens.indigo }]}>
                Límites
              </Text>
            </SpringPressable>

            <SpringPressable
              onPress={() => void restoreExcelData()}
              style={[
                styles.quickActionTile,
                {
                  backgroundColor: tokens.glassPillBg,
                  borderColor: tokens.glassBorder,
                },
              ]}
            >
              <FileSpreadsheet size={20} color="#06B6D4" />
              <Text style={[styles.quickActionLabel, { color: '#06B6D4' }]}>
                Base Excel
              </Text>
            </SpringPressable>
          </View>

          {/* Gráfico Comparativo en Tarjeta Liquid Glass */}
          <LiquidGlassCard delay={130} style={styles.mb20}>
            <Text style={[styles.cardTitle, { color: tokens.textPrimary }]}>
              Resumen Gráfico del Mes
            </Text>
            <Text
              style={[
                styles.cardSubtitle,
                styles.mb16,
                { color: tokens.textSecondary },
              ]}
            >
              Comparativa de Ingresos, Gastos y Tope Presupuestado
            </Text>
            <View style={styles.chartContainer}>
              <BarChart
                data={chartData}
                width={chartPlotAreaWidth}
                barWidth={barWidth}
                spacing={barSpacing}
                initialSpacing={chartInitialSpacing}
                roundedTop
                roundedBottom
                noOfSections={4}
                yAxisThickness={0}
                xAxisThickness={1}
                xAxisColor={tokens.divider}
                yAxisTextStyle={{ color: tokens.chartAxisTextColor, fontSize: 10 }}
                xAxisLabelTextStyle={{
                  color: tokens.chartAxisTextColor,
                  fontSize: 11,
                  fontWeight: '700',
                }}
                hideRules={false}
                rulesColor={tokens.chartRulesColor}
                height={145}
                isAnimated
              />
            </View>
          </LiquidGlassCard>

          {/* Últimos Movimientos */}
          <View style={styles.recentHeaderRow}>
            <Text style={[styles.sectionLabel, { color: tokens.textSecondary }]}>
              Movimientos Recientes
            </Text>
            <SpringPressable
              onPress={() => router.push('/(tabs)/history')}
              scaleDown={0.94}
              style={styles.seeAllBtn}
            >
              <Text style={[styles.seeAllText, { color: tokens.emerald }]}>
                Ver todo
              </Text>
              <ChevronRight size={14} color={tokens.emerald} />
            </SpringPressable>
          </View>

          {recentTransactions.length === 0 ? (
            <LiquidGlassCard delay={180}>
              <View style={styles.emptyBox}>
                <Text style={[styles.emptyTitle, { color: tokens.textPrimary }]}>
                  Sin movimientos este mes
                </Text>
                <Text style={[styles.emptySubtitle, { color: tokens.textSecondary }]}>
                  Toca el botón flotante + para registrar tu primer ingreso o gasto.
                </Text>
              </View>
            </LiquidGlassCard>
          ) : (
            <LiquidGlassCard
              delay={180}
              contentStyle={styles.zeroPadding}
            >
              {recentTransactions.map((tx, idx) => (
                <View
                  key={tx.id}
                  style={[
                    styles.txRow,
                    idx < recentTransactions.length - 1 && {
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
                        style={[styles.txCategoryName, { color: tokens.textPrimary }]}
                        numberOfLines={1}
                      >
                        {tx.category.name}
                      </Text>
                      <Text
                        style={[styles.txNote, { color: tokens.textSecondary }]}
                        numberOfLines={1}
                      >
                        {tx.note || tx.date.slice(0, 10)}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.txAmount,
                      {
                        color:
                          tx.type === 'income' ? tokens.emerald : tokens.rose,
                      },
                    ]}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {formatCurrencyFromCents(tx.amount, currency)}
                  </Text>
                </View>
              ))}
            </LiquidGlassCard>
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
  scrollArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 140,
  },
  mb16: {
    marginBottom: 16,
  },
  mb20: {
    marginBottom: 20,
  },
  my10: {
    marginVertical: 10,
  },
  zeroPadding: {
    padding: 0,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  uppercaseLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  sparkleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  sparkleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  heroBalanceAmount: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricSubCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 13,
  },
  metricTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 5,
  },
  incomeIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  budgetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  percentagePill: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
  },
  percentagePillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  alertBannerText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 18,
  },
  quickActionTile: {
    flex: 1,
    minHeight: 76,
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 6,
  },
  chartContainer: {
    alignItems: 'center',
    paddingTop: 4,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingBottom: 8,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
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
  txAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
});
