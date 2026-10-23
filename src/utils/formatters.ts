export interface CurrencyOption {
  code: 'COP' | 'USD' | 'EUR' | 'MXN' | 'PEN' | 'ARS' | 'CLP';
  symbol: string;
  name: string;
  locale: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'COP', symbol: '$', name: 'Peso Colombiano (COP)', locale: 'es-CO' },
  { code: 'USD', symbol: '$', name: 'Dólar (USD)', locale: 'en-US' },
  { code: 'MXN', symbol: '$', name: 'Peso Mexicano (MXN)', locale: 'es-MX' },
  { code: 'PEN', symbol: 'S/', name: 'Sol Peruano (PEN)', locale: 'es-PE' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR)', locale: 'es-ES' },
  { code: 'CLP', symbol: '$', name: 'Peso Chileno (CLP)', locale: 'es-CL' },
  { code: 'ARS', symbol: '$', name: 'Peso Argentino (ARS)', locale: 'es-AR' },
];

const MONTH_NAMES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

/**
 * Obtiene el mes actual en formato YYYY-MM
 */
export function getCurrentMonthString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Avanza o retrocede N meses desde un string YYYY-MM
 */
export function shiftMonth(monthStr: string, delta: number): string {
  const [yearStr, monStr] = monthStr.split('-');
  const year = Number(yearStr);
  const monthIndex = Number(monStr) - 1;
  const target = new Date(year, monthIndex + delta, 1);
  return getCurrentMonthString(target);
}

/**
 * Formatea YYYY-MM a texto legible en español (ej: "Octubre 2026")
 */
export function formatMonthLabel(monthStr: string): string {
  const [yearStr, monStr] = monthStr.split('-');
  const monthIndex = Number(monStr) - 1;
  const monthName = MONTH_NAMES_ES[monthIndex] ?? monthStr;
  return `${monthName} ${yearStr}`;
}

/**
 * Convierte centavos (integer) a cadena monetaria formateada
 */
export function formatCurrencyFromCents(
  amountInCents: number,
  currency: CurrencyOption = CURRENCIES[0]
): string {
  const value = amountInCents / 100;
  const isWholeZeroDecimalCurrency =
    (currency.code === 'COP' || currency.code === 'CLP') &&
    amountInCents % 100 === 0;

  try {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: isWholeZeroDecimalCurrency ? 0 : 2,
      maximumFractionDigits: isWholeZeroDecimalCurrency ? 0 : 2,
    }).format(value);
  } catch {
    return `${currency.symbol}${value.toFixed(isWholeZeroDecimalCurrency ? 0 : 2)}`;
  }
}

/**
 * Convierte un string numérico ingresado por el usuario (ej: "125.50") a centavos (integer)
 */
export function parseInputToCents(raw: string): number {
  const normalized = raw.replace(/[^0-9.,-]/g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return 0;
  }
  return Math.round(parsed * 100);
}

/**
 * Formatea una fecha ISO (YYYY-MM-DD o timestamp completo) a encabezado amigable
 */
export function formatDateGroupHeader(
  isoDateKey: string,
  referenceDate: Date = new Date()
): string {
  const todayKey = referenceDate.toISOString().slice(0, 10);
  const yesterday = new Date(referenceDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  const [y, m, d] = isoDateKey.split('-').map(Number);
  if (!y || !m || !d) return isoDateKey;

  const dateObj = new Date(y, m - 1, d);
  const formattedShort = dateObj.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  if (isoDateKey === todayKey) {
    return `Hoy · ${formattedShort}`;
  }
  if (isoDateKey === yesterdayKey) {
    return `Ayer · ${formattedShort}`;
  }
  return formattedShort.charAt(0).toUpperCase() + formattedShort.slice(1);
}
