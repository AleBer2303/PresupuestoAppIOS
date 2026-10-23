import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
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
import { parseInputToCents } from '@/utils/formatters';

export function QuickTransactionModal() {
  const isOpen = useFinanceStore((s) => s.isTransactionModalOpen);
  const presetType = useFinanceStore((s) => s.presetTransactionType);
  const closeTransactionModal = useFinanceStore((s) => s.closeTransactionModal);
  const categories = useFinanceStore((s) => s.categories);
  const selectedMonth = useFinanceStore((s) => s.selectedMonth);
  const currency = useFinanceStore((s) => s.currency);
  const addTransaction = useFinanceStore((s) => s.addTransaction);

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

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent
      onRequestClose={closeTransactionModal}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end bg-black/70"
      >
        <Pressable className="flex-1" onPress={closeTransactionModal} />

        <View className="bg-slate-900 rounded-t-3xl border-t border-slate-800 px-5 pt-3 pb-8 max-h-[90%]">
          {/* Barra superior tipo iOS Bottom Sheet */}
          <View className="w-12 h-1.5 bg-slate-700 rounded-full self-center mb-4" />

          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-xl font-bold text-white">
              Nuevo Movimiento
            </Text>
            <Pressable
              onPress={closeTransactionModal}
              className="p-2 rounded-full bg-slate-800 active:opacity-75"
            >
              <X size={18} color="#94A3B8" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Selector de Tipo: Gasto vs Ingreso */}
            <View className="flex-row bg-slate-950 p-1.5 rounded-2xl border border-slate-800 mb-5">
              <Pressable
                onPress={() => setType('expense')}
                className={`flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-xl ${
                  type === 'expense' ? 'bg-rose-500' : 'bg-transparent'
                }`}
              >
                <ArrowUpRight
                  size={16}
                  color={type === 'expense' ? '#FFFFFF' : '#94A3B8'}
                />
                <Text
                  className={`font-bold text-sm ${
                    type === 'expense' ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  Gasto
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setType('income')}
                className={`flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-xl ${
                  type === 'income' ? 'bg-emerald-500' : 'bg-transparent'
                }`}
              >
                <ArrowDownLeft
                  size={16}
                  color={type === 'income' ? '#FFFFFF' : '#94A3B8'}
                />
                <Text
                  className={`font-bold text-sm ${
                    type === 'income' ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  Ingreso
                </Text>
              </Pressable>
            </View>

            {/* Input de Monto */}
            <View className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4 mb-5 items-center">
              <Text className="text-xs uppercase tracking-wider text-slate-400 mb-1">
                Monto ({currency.code})
              </Text>
              <View className="flex-row items-center justify-center">
                <Text
                  className={`text-3xl font-extrabold mr-1 ${
                    type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {currency.symbol}
                </Text>
                <TextInput
                  value={amountInput}
                  onChangeText={setAmountInput}
                  placeholder="0.00"
                  placeholderTextColor="#475569"
                  keyboardType="decimal-pad"
                  className="text-4xl font-extrabold text-white min-w-[120px] text-center py-1"
                  autoFocus
                />
              </View>
            </View>

            {/* Selector de Categoría */}
            <Text className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2.5">
              Categoría
            </Text>
            <View className="flex-row flex-wrap gap-2.5 mb-5">
              {filteredCategories.map((cat) => {
                const isSelected = cat.id === selectedCategoryId;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setSelectedCategoryId(cat.id)}
                    className={`flex-row items-center gap-2 px-3.5 py-2.5 rounded-2xl border ${
                      isSelected
                        ? 'bg-slate-800 border-emerald-500'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <View
                      style={{ backgroundColor: `${cat.color}22` }}
                      className="w-7 h-7 rounded-lg items-center justify-center"
                    >
                      <CategoryIcon name={cat.icon} color={cat.color} size={16} />
                    </View>
                    <Text
                      className={`text-xs font-semibold ${
                        isSelected ? 'text-white' : 'text-slate-300'
                      }`}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Fecha */}
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Fecha (YYYY-MM-DD)
              </Text>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => setQuickDate(0)}
                  className="bg-slate-800 px-2.5 py-1 rounded-lg"
                >
                  <Text className="text-xs text-emerald-400 font-semibold">Hoy</Text>
                </Pressable>
                <Pressable
                  onPress={() => setQuickDate(-1)}
                  className="bg-slate-800 px-2.5 py-1 rounded-lg"
                >
                  <Text className="text-xs text-slate-300 font-semibold">Ayer</Text>
                </Pressable>
              </View>
            </View>
            <View className="flex-row items-center bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-3 mb-4">
              <Calendar size={18} color="#64748B" />
              <TextInput
                value={dateInput}
                onChangeText={setDateInput}
                placeholder="2026-10-23"
                placeholderTextColor="#475569"
                className="flex-1 text-white text-sm font-medium ml-2.5"
              />
            </View>

            {/* Nota opcional */}
            <Text className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
              Nota (Opcional)
            </Text>
            <View className="flex-row items-center bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-3 mb-5">
              <FileText size={18} color="#64748B" />
              <TextInput
                value={noteInput}
                onChangeText={setNoteInput}
                placeholder="Ej. Supermercado semanal, pago de luz..."
                placeholderTextColor="#475569"
                className="flex-1 text-white text-sm ml-2.5"
              />
            </View>

            {errorMessage ? (
              <View className="bg-rose-500/15 border border-rose-500/40 rounded-xl px-3.5 py-2.5 mb-4">
                <Text className="text-rose-400 text-xs font-medium">
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {/* Botón Guardar */}
            <Pressable
              onPress={() => void handleSave()}
              disabled={isSubmitting}
              className={`flex-row items-center justify-center gap-2 py-4 rounded-2xl ${
                type === 'income' ? 'bg-emerald-500' : 'bg-indigo-600'
              } active:opacity-85`}
            >
              <Check size={18} color="#FFFFFF" />
              <Text className="text-white font-bold text-base">
                {isSubmitting
                  ? 'Guardando...'
                  : type === 'income'
                    ? 'Guardar Ingreso'
                    : 'Guardar Gasto'}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
