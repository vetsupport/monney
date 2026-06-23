import React, { useMemo, useState } from 'react';
import { useData } from './hooks/useData';
import type { Entry, EntryType } from './lib/db';

type Tab = 'inicio' | 'pagos' | 'ingresos' | 'ahorros' | 'resumen';

const teal = '#0f766e';
const green = '#65a30d';

export default function App() {
  const { entries, settings, loading, saveEntryData, removeEntry, markPaymentPaid, updateCurrentBalance } = useData();

  const [tab, setTab] = useState<Tab>('inicio');
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<EntryType>('payment');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Servicios');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [balanceInput, setBalanceInput] = useState('');

  const monthYear = new Date().toLocaleDateString('es-US', { month: 'long', year: 'numeric' });

  const income = entries.filter(e => e.type === 'income');
  const payments = entries.filter(e => e.type === 'payment');
  const savings = entries.filter(e => e.type === 'savings');
  const expenses = entries.filter(e => e.type === 'expense');

  const paid = payments.filter(e => e.status === 'paid');
  const pending = payments.filter(e => e.status === 'pending');

  const totals = useMemo(() => {
    const totalIncome = income.reduce((s, e) => s + e.amount, 0);
    const totalPaid = paid.reduce((s, e) => s + e.amount, 0);
    const totalPending = pending.reduce((s, e) => s + e.amount, 0);
    const totalSavings = savings.reduce((s, e) => s + e.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const projected = settings.currentBalance + totalIncome - totalPaid - totalPending - totalSavings - totalExpenses;
    return { totalIncome, totalPaid, totalPending, totalSavings, totalExpenses, projected };
  }, [entries, settings.currentBalance]);

  function money(v: number) {
    return `${settings.currencySymbol}${v.toFixed(2)}`;
  }

  async function saveBalance() {
    const value = Number(balanceInput);
    if (Number.isNaN(value)) return alert('Monto inválido');
    await updateCurrentBalance(value);
    setBalanceInput('');
  }

  async function addMovement() {
    const value = Number(amount);
    if (!description.trim()) return alert('Escribe un nombre o descripción.');
    if (Number.isNaN(value) || value <= 0) return alert('Escribe un monto válido.');

    await saveEntryData({
      type,
      description: description.trim(),
      amount: value,
      date,
      category,
      status: type === 'payment' ? 'pending' : 'paid',
      recurring: 'none',
    });

    setDescription('');
    setAmount('');
    setCategory('Servicios');
    setType('payment');
    setShowForm(false);
  }

  if (loading) return <div style={{ padding: 24 }}>Cargando Monney...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Arial, sans-serif', paddingBottom: 90 }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '16px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <img src="/monney.jpg" alt="Monney" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} />
            <div>
              <h1 style={{ margin: 0, color: teal, fontSize: 38, fontWeight: 900 }}>Mon<span style={{ color: green }}>ney</span></h1>
              <p style={{ margin: 0, color: '#64748b' }}>Planificador financiero familiar</p>
            </div>
          </div>

          <div style={{ background: '#ecfdf5', color: teal, padding: '12px 18px', borderRadius: 16, fontWeight: 900 }}>
            {capitalize(monthYear)}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: 20 }}>
        {tab === 'inicio' && (
          <>
            <Hero onAdd={() => setShowForm(!showForm)} />

            {showForm && (
              <section style={card}>
                <h2 style={title}>Agregar movimiento</h2>
                <div style={formGrid}>
                  <select style={input} value={type} onChange={e => setType(e.target.value as EntryType)}>
                    <option value="payment">Pago</option>
                    <option value="income">Ingreso</option>
                    <option value="savings">Ahorro</option>
                    <option value="expense">Gasto</option>
                  </select>

                  <input style={input} placeholder="Nombre / descripción" value={description} onChange={e => setDescription(e.target.value)} />

                  <select style={input} value={category} onChange={e => setCategory(e.target.value)}>
                    <option>Vehículo</option>
                    <option>Renta</option>
                    <option>Servicios</option>
                    <option>Comida</option>
                    <option>Imprevistos</option>
                    <option>Salud</option>
                    <option>Mascotas</option>
                    <option>Familia</option>
                    <option>Ahorros</option>
                    <option>Otros</option>
                  </select>

                  <input style={input} type="number" placeholder="Monto" value={amount} onChange={e => setAmount(e.target.value)} />
                  <input style={input} type="date" value={date} onChange={e => setDate(e.target.value)} />
                  <button style={primaryButton} onClick={addMovement}>Guardar</button>
                </div>
              </section>
            )}

            <section style={{ ...card, marginTop: 16 }}>
              <h2 style={title}>Saldo actual</h2>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input style={input} type="number" placeholder="Nuevo saldo actual" value={balanceInput} onChange={e => setBalanceInput(e.target.value)} />
                <button style={primaryButton} onClick={saveBalance}>Actualizar saldo</button>
              </div>
            </section>

            <SummaryCards money={money} balance={settings.currentBalance} totals={totals} />
          </>
        )}

        {tab === 'pagos' && (
          <section>
            <h2 style={pageTitle}>Pagos</h2>
            <div style={twoColumns}>
              <List title="Por pagar" entries={pending} money={money} color="#f97316" onPaid={markPaymentPaid} onDelete={removeEntry} />
              <List title="Pagado" entries={paid} money={money} color="#16a34a" onDelete={removeEntry} />
            </div>
          </section>
        )}

        {tab === 'ingresos' && (
          <section>
            <h2 style={pageTitle}>Ingresos</h2>
            <List title="Ingresos registrados" entries={income} money={money} color="#2563eb" onDelete={removeEntry} />
          </section>
        )}

        {tab === 'ahorros' && (
          <section>
            <h2 style={pageTitle}>Ahorros</h2>
            <List title="Ahorros registrados" entries={savings} money={money} color="#7c3aed" onDelete={removeEntry} />
          </section>
        )}

        {tab === 'resumen' && (
          <section style={card}>
            <h2 style={title}>Resumen mensual</h2>
            <p>Saldo actual: <strong>{money(settings.currentBalance)}</strong></p>
            <p>Ingresos: <strong>{money(totals.totalIncome)}</strong></p>
            <p>Pagos realizados: <strong>{money(totals.totalPaid)}</strong></p>
            <p>Pagos pendientes: <strong>{money(totals.totalPending)}</strong></p>
            <p>Ahorros: <strong>{money(totals.totalSavings)}</strong></p>
            <p>Saldo proyectado: <strong>{money(totals.projected)}</strong></p>
          </section>
        )}
      </main>

      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}

function Hero({ onAdd }: { onAdd: () => void }) {
  return (
    <section style={{ ...card, background: 'linear-gradient(135deg, #ecfdf5, #ffffff)', border: '1px solid #ccfbf1' }}>
      <h2 style={{ marginTop: 0, color: teal, fontSize: 30 }}>¡Bienvenido a Monney!</h2>
      <p style={{ color: '#475569', fontSize: 18 }}>Organiza ingresos, pagos y ahorros del hogar.</p>
      <button style={primaryButton} onClick={onAdd}>+ Agregar movimiento</button>
    </section>
  );
}

function SummaryCards({ money, balance, totals }: any) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginTop: 16 }}>
      <Metric title="Saldo actual" value={money(balance)} color={green} />
      <Metric title="Ingresos" value={money(totals.totalIncome)} color="#2563eb" />
      <Metric title="Por pagar" value={money(totals.totalPending)} color="#f97316" />
      <Metric title="Saldo proyectado" value={money(totals.projected)} color={totals.projected < 0 ? '#dc2626' : teal} />
    </div>
  );
}

function Metric({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <div style={card}>
      <div style={{ color: '#64748b', fontWeight: 700 }}>{title}</div>
      <div style={{ color, fontSize: 26, fontWeight: 900 }}>{value}</div>
    </div>
  );
}

function List({ title, entries, money, color, onPaid, onDelete }: any) {
  return (
    <div style={{ ...card, borderTop: `5px solid ${color}` }}>
      <h3 style={{ color }}>{title}</h3>
      {entries.length === 0 ? <p style={{ color: '#94a3b8' }}>No hay registros.</p> : entries.map((e: Entry) => (
        <div key={e.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, marginBottom: 10 }}>
          <strong>{e.description}</strong>
          <div>{money(e.amount)}</div>
          <div>{e.category || 'Sin categoría'} — {e.date}</div>
          <div>Estado: {e.status}</div>
          {onPaid && e.status !== 'paid' && <button style={primaryButton} onClick={() => onPaid(e)}>Realizar pago</button>}
          <button style={{ ...primaryButton, background: '#dc2626', marginLeft: 8 }} onClick={() => onDelete(e.id)}>Eliminar</button>
        </div>
      ))}
    </div>
  );
}

function BottomNav({ tab, setTab }: { tab: Tab; setTab: React.Dispatch<React.SetStateAction<Tab>> }) {
  const items: { key: Tab; label: string }[] = [
    { key: 'inicio', label: 'Inicio' },
    { key: 'pagos', label: 'Pagos' },
    { key: 'ingresos', label: 'Ingresos' },
    { key: 'ahorros', label: 'Ahorros' },
    { key: 'resumen', label: 'Resumen' },
  ];

  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e5e7eb', padding: 10 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6 }}>
        {items.map(item => (
          <button key={item.key} onClick={() => setTab(item.key)} style={{
            border: 0,
            borderRadius: 12,
            padding: 12,
            fontWeight: 800,
            cursor: 'pointer',
            background: tab === item.key ? teal : '#f1f5f9',
            color: tab === item.key ? 'white' : '#334155',
          }}>
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

const card: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: 18,
  padding: 18,
  border: '1px solid #e5e7eb',
  boxShadow: '0 8px 22px rgba(0,0,0,0.05)',
};

const title: React.CSSProperties = {
  marginTop: 0,
  color: teal,
};

const pageTitle: React.CSSProperties = {
  color: teal,
  fontSize: 30,
};

const input: React.CSSProperties = {
  padding: 12,
  borderRadius: 10,
  border: '1px solid #d1d5db',
  fontSize: 15,
};

const primaryButton: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: 10,
  border: 0,
  background: teal,
  color: 'white',
  fontWeight: 800,
  cursor: 'pointer',
};

const formGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 10,
};

const twoColumns: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 16,
};

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}