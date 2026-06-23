import { useCallback, useEffect, useState } from "react";
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
} from "../lib/db";

function addMonthsISO(date: string, months: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const target = new Date(year, month - 1 + months, day);
  return new Date(target.getTime() - target.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

interface UseDataResult {
  entries: Entry[];
  settings: Settings;
  loading: boolean;

  saveEntryData: (data: Partial<Entry> & { id?: string }) => Promise<Entry>;
  removeEntry: (id: string) => Promise<void>;
  markPaymentPaid: (entry: Entry) => Promise<void>;
  postponePayment: (entry: Entry, weeks: number) => Promise<void>;
  skipPayment: (entry: Entry) => Promise<void>;
  togglePaymentPlan: (entry: Entry) => Promise<void>;
  updateCurrentBalance: (amount: number) => Promise<void>;
  updateInitialBalance: (amount: number) => Promise<void>;
  updateCurrency: (symbol: string) => Promise<void>;
  reload: () => Promise<void>;
}

export function useData(): UseDataResult {
  const [entries, setEntries] = useState<Entry[]>([]);

  const [settings, setSettings] = useState<Settings>({
    id: "app-settings",
    initialBalance: 0,
    currentBalance: 0,
    currencySymbol: "$",
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

  const saveEntryData = useCallback<UseDataResult["saveEntryData"]>(
    async (data) => {
      const now = new Date().toISOString();
      let entry: Entry;

      if (data.id) {
        const existing = entries.find((e) => e.id === data.id);

        if (!existing) throw new Error("No encontrado");

        entry = {
          ...existing,
          ...data,
          updatedAt: now,
        } as Entry;
      } else {
        entry = {
          id: genId(),
          type: data.type ?? "payment",
          description: data.description ?? "",
          amount: data.amount ?? 0,
          date: data.date ?? todayISO(),
          category: data.category,
          dueDay: data.dueDay,
          isRecurring: data.isRecurring ?? false,
          priority: data.priority ?? "medium",
          status: data.status ?? "pending",
          recurring: data.recurring ?? "none",
          planned: data.planned ?? false,
          lastPaidAmount: data.lastPaidAmount,
          createdAt: now,
          updatedAt: now,
        };
      }

      await saveEntry(entry);
      await reload();
      return entry;
    },
    [entries, reload],
  );

  const removeEntry = useCallback(
    async (id: string) => {
      await deleteEntry(id);
      await reload();
    },
    [reload],
  );

  const markPaymentPaid = useCallback<UseDataResult["markPaymentPaid"]>(
    async (entry) => {
      const now = new Date().toISOString();
      const updated: Entry = {
        ...entry,
        status: "paid",
        updatedAt: now,
      };

      await saveEntry(updated);

      if (entry.recurring === "monthly" || entry.isRecurring) {
        const nextDate = addMonthsISO(entry.date, 1);
        const nextMonth = nextDate.slice(0, 7);
        const alreadyExists = entries.some(
          (item) =>
            item.id !== entry.id &&
            item.type === "payment" &&
            item.status !== "paid" &&
            item.description.trim().toLowerCase() ===
              entry.description.trim().toLowerCase() &&
            item.date.slice(0, 7) === nextMonth,
        );

        if (!alreadyExists) {
          const nextEntry: Entry = {
            ...entry,
            id: genId(),
            status: "pending",
            date: nextDate,
            planned: false,
            lastPaidAmount: entry.amount,
            createdAt: now,
            updatedAt: now,
          };

          await saveEntry(nextEntry);
        }
      }

      await reload();
    },
    [entries, reload],
  );

  const postponePayment = useCallback<UseDataResult["postponePayment"]>(
    async (entry, weeks) => {
      const current = new Date(entry.date);
      current.setDate(current.getDate() + weeks * 7);

      const updated: Entry = {
        ...entry,
        status: "postponed",
        date: current.toISOString().slice(0, 10),
        updatedAt: new Date().toISOString(),
      };

      await saveEntry(updated);
      await reload();
    },
    [reload],
  );

  const skipPayment = useCallback<UseDataResult["skipPayment"]>(
    async (entry) => {
      const updated: Entry = {
        ...entry,
        status: "skipped",
        updatedAt: new Date().toISOString(),
      };

      await saveEntry(updated);
      await reload();
    },
    [reload],
  );

  const togglePaymentPlan = useCallback(
    async (entry: Entry) => {
      const updated: Entry = {
        ...entry,
        planned: !Boolean(entry.planned),
        updatedAt: new Date().toISOString(),
      };

      await saveEntry(updated);
      await reload();
    },
    [reload],
  );

  const updateCurrentBalance = useCallback(
    async (amount: number) => {
      const updated: Settings = {
        ...settings,
        currentBalance: amount,
        updatedAt: new Date().toISOString(),
      };

      await saveSettings(updated);
      setSettings(updated);
    },
    [settings],
  );

  const updateInitialBalance = useCallback(
    async (amount: number) => {
      const updated: Settings = {
        ...settings,
        initialBalance: amount,
        updatedAt: new Date().toISOString(),
      };

      await saveSettings(updated);
      setSettings(updated);
    },
    [settings],
  );

  const updateCurrency = useCallback(
    async (symbol: string) => {
      const updated: Settings = {
        ...settings,
        currencySymbol: symbol,
        updatedAt: new Date().toISOString(),
      };

      await saveSettings(updated);
      setSettings(updated);
    },
    [settings],
  );

  return {
    entries,
    settings,
    loading,
    saveEntryData,
    removeEntry,
    markPaymentPaid,
    postponePayment,
    skipPayment,
    togglePaymentPlan,
    updateCurrentBalance,
    updateInitialBalance,
    updateCurrency,
    reload,
  };
}
