import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Check,
  FileText,
  X,
} from 'lucide-react-native';
import { useFinanceStore } from '@/store/useFinanceStore';
import type { TransactionType } from '@/db/schema';
import { CategoryIcon } from './CategoryIcon';
import { SpringPressable, useLiquidTheme } from './LiquidGlass';
import { parseInputToCents } from '@/utils/formatters';

export function QuickTransactionModal() {
  const isOpen = useFinanceStore((s) => s.isTransactionModalOpen);
  const presetType = useFinanceStore((s) => s.presetTransactionType);
  const closeTransactionModal = useFinanceStore((s) => s.closeTransactionModal);
  const categories = useFinanceStore((s) => s.categories);
  const selectedMonth = useFinanceStore((s) => s.selectedMonth);
  const currency = useFinanceStore((s) => s.currency);
  const addTransaction = useFinanceStore((s) => s.addTransaction);

  const { tokens } = useLiquidTheme();

  const [type, setType] = useState<TransactionType>('expense');
  const [amountInput, setAmountInput] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [dateInput, setDateInput] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [noteInput, setNoteInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  useEffect(() => {
    if (isOpen) {
      setType(presetType);
      setAmountInput('');
      setNoteInput('');
      setErrorMessage(null);

      const todayStr = new Date().toISOString().slice(0, 10);
      if (todayStr.startsWith(selectedMonth)) {
        setDateInput(todayStr);
      } else {
        setDateInput(`${selectedMonth}-01`);
      }
    }
  }, [isOpen, presetType, selectedMonth]);

  useEffect(() => {
    if (filteredCategories.length > 0) {
      const exists = filteredCategories.some((c) => c.id === selectedCategoryId);
      if (!exists) {
        setSelectedCategoryId(filteredCategories[0].id);
      }
    } else {
      setSelectedCategoryId(null);
    }
  }, [filteredCategories, selectedCategoryId]);

  const setQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setDateInput(d.toISOString().slice(0, 10));
  };

  const handleSave = async () => {
    const amountInCents = parseInputToCents(amountInput);
    if (amountInCents <= 0) {
      setErrorMessage('Ingresa un monto mayor a 0.');
      return;
    }
    if (!selectedCategoryId) {
      setErrorMessage('Selecciona una categoría.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
      setErrorMessage('La fecha debe tener formato YYYY-MM-DD.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const isoTimestamp = `${dateInput.trim()}T12:00:00.000Z`;
      await addTransaction({
        amount: amountInCents,
        type,
        categoryId: selectedCategoryId,
        date: isoTimestamp,
        note: noteInput.trim() || undefined,
      });
      closeTransactionModal();
    } catch {
      setErrorMessage('No se pudo guardar la transacción.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const webBlurStyle: ViewStyle =
    Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(28px) saturate(190%)',
          WebkitBackdropFilter: 'blur(28px) saturate(190%)',
        } as unknown as ViewStyle)
      : {};

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent
      onRequestClose={closeTransactionModal}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[
          styles.backdrop,
          { backgroundColor: tokens.modalBackdrop },
        ]}
      >
        <Pressable style={styles.flexOne} onPress={closeTransactionModal} />

        <View
          style={[
            styles.sheetContainer,
            {
              borderColor: tokens.glassBorder,
              shadowColor: tokens.glassShadowColor,
            },
            webBlurStyle,
          ]}
        >
          <LinearGradient
            colors={tokens.modalSheetGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Brillo especular superior tipo iOS Sheet */}
          <View
            style={[
              styles.specularTop,
              { backgroundColor: tokens.glassSpecularTop },
            ]}
          />

          {/* Grabber Handle */}
          <View
            style={[
              styles.grabber,
              { backgroundColor: tokens.textMuted },
            ]}
          />

          <View style={styles.headerRow}>
            <Text style={[styles.sheetTitle, { color: tokens.textPrimary }]}>
              Nuevo Movimiento
            </Text>
            <SpringPressable
              onPress={closeTransactionModal}
              scaleDown={0.88}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: tokens.glassInsetBg,
                  borderColor: tokens.glassBorder,
                },
              ]}
            >
              <X size={18} color={tokens.textSecondary} />
            </SpringPressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Selector Segmentado Liquid Glass: Gasto vs Ingreso */}
            <View
              style={[
                styles.segmentedControl,
                {
                  backgroundColor: tokens.glassInsetBg,
                  borderColor: tokens.glassBorder,
                },
              ]}
            >
              <SpringPressable
                onPress={() => setType('expense')}
                scaleDown={0.96}
                style={[
                  styles.segmentOption,
                  type === 'expense' && {
                    backgroundColor: tokens.rose,
                  },
                ]}
              >
                <ArrowUpRight
                  size={16}
                  color={type === 'expense' ? '#FFFFFF' : tokens.textSecondary}
                />
                <Text
                  style={[
                    styles.segmentText,
                    {
                      color:
                        type === 'expense' ? '#FFFFFF' : tokens.textSecondary,
                    },
                  ]}
                >
                  Gasto
                </Text>
              </SpringPressable>

              <SpringPressable
                onPress={() => setType('income')}
                scaleDown={0.96}
                style={[
                  styles.segmentOption,
                  type === 'income' && {
                    backgroundColor: tokens.emerald,
                  },
                ]}
              >
                <ArrowDownLeft
                  size={16}
                  color={type === 'income' ? '#FFFFFF' : tokens.textSecondary}
                />
                <Text
                  style={[
                    styles.segmentText,
                    {
                      color:
                        type === 'income' ? '#FFFFFF' : tokens.textSecondary,
                    },
                  ]}
                >
                  Ingreso
                </Text>
              </SpringPressable>
            </View>

            {/* Input Hero de Monto */}
            <View
              style={[
                styles.amountBox,
                {
                  backgroundColor: tokens.glassInsetBg,
                  borderColor: tokens.glassBorder,
                },
              ]}
            >
              <Text style={[styles.fieldLabel, { color: tokens.textSecondary }]}>
                Monto ({currency.code})
              </Text>
              <View style={styles.amountInputRow}>
                <Text
                  style={[
                    styles.currencySymbol,
                    {
                      color:
                        type === 'income' ? tokens.emerald : tokens.rose,
                    },
                  ]}
                >
                  {currency.symbol}
                </Text>
                <TextInput
                  value={amountInput}
                  onChangeText={setAmountInput}
                  placeholder="0"
                  placeholderTextColor={tokens.textMuted}
                  keyboardType="decimal-pad"
                  style={[styles.amountInput, { color: tokens.textPrimary }]}
                  autoFocus
                />
              </View>
            </View>

            {/* Selector de Categoría */}
            <Text
              style={[
                styles.sectionLabel,
                { color: tokens.textSecondary },
              ]}
            >
              Categoría
            </Text>
            <View style={styles.categoryWrap}>
              {filteredCategories.map((cat) => {
                const isSelected = cat.id === selectedCategoryId;
                return (
                  <SpringPressable
                    key={cat.id}
                    onPress={() => setSelectedCategoryId(cat.id)}
                    scaleDown={0.94}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isSelected
                          ? `${cat.color}22`
                          : tokens.glassInsetBg,
                        borderColor: isSelected
                          ? cat.color
                          : tokens.glassBorder,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.catMiniIcon,
                        { backgroundColor: `${cat.color}28` },
                      ]}
                    >
                      <CategoryIcon name={cat.icon} color={cat.color} size={15} />
                    </View>
                    <Text
                      style={[
                        styles.categoryChipText,
                        {
                          color: isSelected
                            ? tokens.textPrimary
                            : tokens.textSecondary,
                        },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </SpringPressable>
                );
              })}
            </View>

            {/* Fecha */}
            <View style={styles.dateHeaderRow}>
              <Text style={[styles.sectionLabel, { color: tokens.textSecondary }]}>
                Fecha (YYYY-MM-DD)
              </Text>
              <View style={styles.quickDateRow}>
                <SpringPressable
                  onPress={() => setQuickDate(0)}
                  scaleDown={0.92}
                  style={[
                    styles.quickDateChip,
                    {
                      backgroundColor: tokens.glassInsetBg,
                      borderColor: tokens.glassBorder,
                    },
                  ]}
                >
                  <Text style={[styles.quickDateText, { color: tokens.emerald }]}>
                    Hoy
                  </Text>
                </SpringPressable>
                <SpringPressable
                  onPress={() => setQuickDate(-1)}
                  scaleDown={0.92}
                  style={[
                    styles.quickDateChip,
                    {
                      backgroundColor: tokens.glassInsetBg,
                      borderColor: tokens.glassBorder,
                    },
                  ]}
                >
                  <Text
                    style={[styles.quickDateText, { color: tokens.textSecondary }]}
                  >
                    Ayer
                  </Text>
                </SpringPressable>
              </View>
            </View>

            <View
              style={[
                styles.inputBox,
                {
                  backgroundColor: tokens.glassInsetBg,
                  borderColor: tokens.glassBorder,
                },
              ]}
            >
              <Calendar size={18} color={tokens.textMuted} />
              <TextInput
                value={dateInput}
                onChangeText={setDateInput}
                placeholder="2026-10-23"
                placeholderTextColor={tokens.textMuted}
                style={[styles.textInput, { color: tokens.textPrimary }]}
              />
            </View>

            {/* Nota opcional */}
            <Text style={[styles.sectionLabel, { color: tokens.textSecondary }]}>
              Nota (Opcional)
            </Text>
            <View
              style={[
                styles.inputBox,
                styles.mb18,
                {
                  backgroundColor: tokens.glassInsetBg,
                  borderColor: tokens.glassBorder,
                },
              ]}
            >
              <FileText size={18} color={tokens.textMuted} />
              <TextInput
                value={noteInput}
                onChangeText={setNoteInput}
                placeholder="Ej. Supermercado, imprevisto, pago mensual..."
                placeholderTextColor={tokens.textMuted}
                style={[styles.textInput, { color: tokens.textPrimary }]}
              />
            </View>

            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Text style={[styles.errorText, { color: tokens.rose }]}>
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {/* Botón Guardar Liquid Glass */}
            <SpringPressable
              onPress={() => void handleSave()}
              disabled={isSubmitting}
              scaleDown={0.96}
              style={styles.submitBtn}
            >
              <LinearGradient
                colors={
                  type === 'income'
                    ? ['#34D399', '#10B981', '#059669']
                    : ['#818CF8', '#6366F1', '#4F46E5']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <Check size={18} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>
                {isSubmitting
                  ? 'Guardando...'
                  : type === 'income'
                    ? 'Guardar Ingreso'
                    : 'Guardar Gasto'}
              </Text>
            </SpringPressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  mb18: {
    marginBottom: 18,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 38 : 26,
    maxHeight: '90%',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
  specularTop: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1.5,
    borderRadius: 1,
  },
  grabber: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 14,
    opacity: 0.45,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedControl: {
    flexDirection: 'row',
    padding: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 18,
    gap: 6,
  },
  segmentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 15,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '800',
  },
  amountBox: {
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbol: {
    fontSize: 30,
    fontWeight: '900',
    marginRight: 4,
  },
  amountInput: {
    fontSize: 36,
    fontWeight: '900',
    minWidth: 120,
    textAlign: 'center',
    paddingVertical: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 9,
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 16,
    borderWidth: 1,
  },
  catMiniIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickDateRow: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 8,
  },
  quickDateChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  quickDateText: {
    fontSize: 11,
    fontWeight: '800',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },
  errorBanner: {
    backgroundColor: 'rgba(244, 63, 94, 0.14)',
    borderColor: 'rgba(244, 63, 94, 0.35)',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
