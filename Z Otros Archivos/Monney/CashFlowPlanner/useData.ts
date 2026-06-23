import { useCallback, useEffect, useState } from 'react';
import {
  Entry,
  Settings,
  deleteEntry,
  genId,
  getAllEntries,
  getSettings,
  saveEntry,
  saveSettings,
  todayISO,
} from '../lib/db';

interface UseDataResult {
  entries: Entry[];
  settings: Settings;
  loading: boolean;
  saveEntryData: (data: Partial<Entry> & { id?: string }) => Promise<Entry>;
  removeEntry: (id: string) => Promise<void>;
  markPaymentPaid: (entry: Entry) => Promise<void>;
  updateCurrentBalance: (amount: number) => Promise<void>;
  updateCurrency: (symbol: string) => Promise<void>;
  reload: () => Promise<void>;
}

export function useData(): UseDataResult {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [settings, setSettings] = useState<Settings>({
    id: 'app-settings',
    currentBalance: 0,
    currencySymbol: '$',
  });
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [all, s] = await Promise.all([getAllEntries(), getSettings()]);
    setEntries(all);
    setSettings(s);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await reload();
      } finally {
        setLoading(false);
      }
    })();
  }, [reload]);

  const saveEntryData: UseDataResult['saveEntryData'] = useCallback(async (data) => {
    const now = new Date().toISOString();
    let entry: Entry;
    if (data.id) {
      // edit existing
      const existing = entries.find((e) => e.id === data.id);
      if (!existing) throw new Error('No encontrado');
      entry = {
        ...existing,
        ...data,
        type: data.type ?? existing.type,
        description: data.description ?? existing.description,
        amount: data.amount ?? existing.amount,
        date: data.date ?? existing.date,
        status: data.status ?? existing.status,
        category: data.category ?? existing.category,
        recurring: data.recurring ?? existing.recurring,
        updatedAt: now,
      } as Entry;
    } else {
      entry = {
        id: genId(),
        type: data.type ?? 'expense',
        description: data.description ?? '',
        amount: data.amount ?? 0,
        date: data.date ?? todayISO(),
        status: data.status ?? 'pending',
        category: data.category,
        recurring: data.recurring ?? 'none',
        createdAt: now,
        updatedAt: now,
      } as Entry;
    }
    await saveEntry(entry);
    await reload();
    return entry;
  }, [entries, reload]);

  const removeEntry: UseDataResult['removeEntry'] = useCallback(async (id) => {
    await deleteEntry(id);
    await reload();
  }, [reload]);

  const markPaymentPaid: UseDataResult['markPaymentPaid'] = useCallback(async (entry) => {
    const updated: Entry = { ...entry, status: 'paid', updatedAt: new Date().toISOString() };
    await saveEntry(updated);
    await reload();
  }, [reload]);

  const updateCurrentBalance: UseDataResult['updateCurrentBalance'] = useCallback(async (amount) => {
    const updated: Settings = { ...settings, currentBalance: amount, updatedAt: new Date().toISOString() };
    await saveSettings(updated);
    setSettings(updated);
  }, [settings]);

  const updateCurrency: UseDataResult['updateCurrency'] = useCallback(async (symbol) => {
    const updated: Settings = { ...settings, currencySymbol: symbol };
    await saveSettings(updated);
    setSettings(updated);
  }, [settings]);

  return {
    entries,
    settings,
    loading,
    saveEntryData,
    removeEntry,
    markPaymentPaid,
    updateCurrentBalance,
    updateCurrency,
    reload,
  };
}