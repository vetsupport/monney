import { Entry, Settings } from './db';
import { monthKey, todayISO } from './db';

export interface Balances {
  currentBalance: number; // saldo actual (checking)
  totalIncome: number;
  totalPaid: number; // pagos realizados
  totalPending: number; // pagos pendientes
  totalExpenses: number; // gastos reales
  totalSavings: number; // transferencias a ahorro
  availableBalance: number; // saldo actual - pagos pagados - ahorro
  projectedBalance: number; // formula completa
}

/**
 * Saldo proyectado =
 *   saldo actual
 *   + ingresos
 *   - pagos realizados
 *   - pagos pendientes
 *   - gastos reales
 *   - transferencias a ahorro
 */
export function computeBalances(entries: Entry[], settings: Settings): Balances {
  let totalIncome = 0;
  let totalPaid = 0;
  let totalPending = 0;
  let totalExpenses = 0;
  let totalSavings = 0;

  for (const e of entries) {
    switch (e.type) {
      case 'income':
        totalIncome += e.amount;
        break;
      case 'payment':
        if (e.status === 'paid') totalPaid += e.amount;
        else totalPending += e.amount;
        break;
      case 'expense':
        totalExpenses += e.amount;
        break;
      case 'savings':
        totalSavings += e.amount;
        break;
    }
  }

  const currentBalance = settings.currentBalance || 0;
  // Available = saldo actual - pagos realizados - transferencias a ahorro (already spent)
  // Expenses (gastos reales) also already subtract from available.
  const availableBalance =
    currentBalance + totalIncome - totalPaid - totalExpenses - totalSavings;

  const projectedBalance =
    currentBalance
    + totalIncome
    - totalPaid
    - totalPending
    - totalExpenses
    - totalSavings;

  return {
    currentBalance,
    totalIncome,
    totalPaid,
    totalPending,
    totalExpenses,
    totalSavings,
    availableBalance,
    projectedBalance,
  };
}

export interface MonthSummary {
  key: string; // YYYY-MM
  label: string;
  income: number;
  paid: number;
  pending: number;
  expenses: number;
  savings: number;
  projected: number;
  count: number;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export function summarizeByMonth(entries: Entry[]): MonthSummary[] {
  const map = new Map<string, Entry[]>();
  for (const e of entries) {
    const k = monthKey(e.date);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(e);
  }
  const months: MonthSummary[] = [];
  for (const [key, list] of map.entries()) {
    const bal = computeBalances(list, { id: '', currentBalance: 0, currencySymbol: '$' });
    const [y, m] = key.split('-');
    months.push({
      key,
      label: `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`,
      income: bal.totalIncome,
      paid: bal.totalPaid,
      pending: bal.totalPending,
      expenses: bal.totalExpenses,
      savings: bal.totalSavings,
      projected: bal.projectedBalance,
      count: list.length,
    });
  }
  return months.sort((a, b) => (a.key < b.key ? 1 : -1));
}

export function filterCurrentMonth(entries: Entry[]): Entry[] {
  const key = monthKey(todayISO());
  return entries.filter((e) => monthKey(e.date) === key);
}

export function formatCurrency(amount: number, symbol = '$'): string {
  const formatted = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);
  return `${symbol}${formatted}`;
}
