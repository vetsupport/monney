export type EntryType = 'income' | 'payment' | 'expense' | 'savings';

export type PaymentStatus = 'pending' | 'paid';

export interface Entry {
  id: string;
  type: EntryType;
  description: string;
  amount: number;
  date: string; // ISO yyyy-mm-dd
  category?: string;
  status: PaymentStatus; // for payments: pending (Por pagar) or paid (Pagado)
  recurring?: 'none' | 'monthly';
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  id: string;
  currentBalance: number;
  currencySymbol: string;
  updatedAt?: string;
}

const DB_NAME = 'cashflow-db';
const DB_VERSION = 1;
const STORE_ENTRIES = 'entries';
const STORE_SETTINGS = 'settings';
const SETTINGS_ID = 'app-settings';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_ENTRIES)) {
        const store = db.createObjectStore(STORE_ENTRIES, { keyPath: 'id' });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('date', 'date', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = fn(t.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---- Entries CRUD ----

export async function getAllEntries(): Promise<Entry[]> {
  const entries = await tx<Entry[]>(STORE_ENTRIES, 'readonly', (s) => s.getAll());
  return (entries || []).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.createdAt < b.createdAt ? 1 : -1));
}

export async function getEntry(id: string): Promise<Entry | undefined> {
  return tx<Entry | undefined>(STORE_ENTRIES, 'readonly', (s) => s.get(id));
}

export async function saveEntry(entry: Entry): Promise<void> {
  await tx(STORE_ENTRIES, 'readwrite', (s) => s.put(entry));
}

export async function deleteEntry(id: string): Promise<void> {
  await tx(STORE_ENTRIES, 'readwrite', (s) => s.delete(id));
}

// ---- Settings ----

export async function getSettings(): Promise<Settings> {
  const s = await tx<Settings | undefined>(STORE_SETTINGS, 'readonly', (s) => s.get(SETTINGS_ID));
  if (s) return s;
  const initial: Settings = { id: SETTINGS_ID, currentBalance: 0, currencySymbol: '$' };
  await saveSettings(initial);
  return initial;
}

export async function saveSettings(settings: Settings): Promise<void> {
  await tx(STORE_SETTINGS, 'readwrite', (s) => s.put(settings));
}

// Utility for ISO date (local)
export function todayISO(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function monthKey(date: string): string {
  return date.slice(0, 7);
}
