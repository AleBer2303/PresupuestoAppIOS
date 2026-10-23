import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight, Coins, Moon, Sun } from 'lucide-react-native';
import { useFinanceStore } from '@/store/useFinanceStore';
import { CURRENCIES, formatMonthLabel } from '@/utils/formatters';
import { SpringPressable, useLiquidTheme } from './LiquidGlass';

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

  const { tokens, isDark, toggleThemeMode } = useLiquidTheme();

  const cycleCurrency = () => {
    const idx = CURRENCIES.findIndex((c) => c.code === currency.code);
    const nextIdx = (idx + 1) % CURRENCIES.length;
    setCurrency(CURRENCIES[nextIdx]);
  };

  return (
    <View
      style={[
        styles.headerWrapper,
        { borderBottomColor: tokens.divider },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          <Text style={[styles.titleText, { color: tokens.textPrimary }]}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitleText, { color: tokens.textSecondary }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={styles.controlsRow}>
          {/* Botón Liquid Glass Dark / Light Mode */}
          <SpringPressable
            onPress={toggleThemeMode}
            scaleDown={0.9}
            style={[
              styles.themeToggleBtn,
              {
                backgroundColor: tokens.glassPillBg,
                borderColor: tokens.glassBorder,
              },
            ]}
          >
            {isDark ? (
              <Sun size={16} color="#FBBF24" />
            ) : (
              <Moon size={16} color="#4F46E5" />
            )}
          </SpringPressable>

          {/* Selector de Divisa */}
          <SpringPressable
            onPress={cycleCurrency}
            scaleDown={0.93}
            style={[
              styles.currencyPill,
              {
                backgroundColor: tokens.glassPillBg,
                borderColor: tokens.glassBorder,
              },
            ]}
          >
            <Coins size={14} color={tokens.emerald} />
            <Text style={[styles.currencyText, { color: tokens.emerald }]}>
              {currency.code} ({currency.symbol})
            </Text>
          </SpringPressable>
        </View>
      </View>

      {/* Cápsula Liquid Glass de Navegación Mensual */}
      <View
        style={[
          styles.monthCapsule,
          {
            backgroundColor: tokens.glassPillBg,
            borderColor: tokens.glassBorder,
          },
        ]}
      >
        <SpringPressable
          onPress={() => void goToPreviousMonth()}
          scaleDown={0.88}
          hitSlop={8}
          style={[
            styles.arrowBtn,
            {
              backgroundColor: tokens.glassInsetBg,
              borderColor: tokens.glassBorder,
            },
          ]}
        >
          <ChevronLeft size={18} color={tokens.textPrimary} />
        </SpringPressable>

        <View style={styles.monthLabelCenter}>
          <Text style={[styles.periodLabel, { color: tokens.textMuted }]}>
            Periodo Activo
          </Text>
          <Text style={[styles.monthText, { color: tokens.textPrimary }]}>
            {formatMonthLabel(selectedMonth)}
          </Text>
        </View>

        <SpringPressable
          onPress={() => void goToNextMonth()}
          scaleDown={0.88}
          hitSlop={8}
          style={[
            styles.arrowBtn,
            {
              backgroundColor: tokens.glassInsetBg,
              borderColor: tokens.glassBorder,
            },
          ]}
        >
          <ChevronRight size={18} color={tokens.textPrimary} />
        </SpringPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleBlock: {
    flex: 1,
    paddingRight: 10,
  },
  titleText: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
  },
  currencyText: {
    fontSize: 12,
    fontWeight: '700',
  },
  monthCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabelCenter: {
    alignItems: 'center',
  },
  periodLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 1,
  },
});
