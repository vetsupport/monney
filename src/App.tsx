import React, { useMemo, useState } from 'react';
import { useData } from './hooks/useData';
import type { Entry, EntryType } from './lib/db';

type Tab = 'inicio' | 'pagos' | 'ingresos' | 'ahorros' | 'resumen';

const teal = '#0f766e';
const green = '#65a30d';
const orange = '#f97316';
const red = '#dc2626';
const blue = '#2563eb';
const purple = '#7c3aed';

const categories = [
  'Vivienda',
  'Renta',
  'Hipoteca',
  'HOA',
  'Vehículo',
  'Pago vehículo',
  'Gasolina',
  'Mantenimiento',
  'Peajes',
  'Deudas',
  'Tarjeta crédito',
  'Loan',
  'Student Loan',
  'Servicios',
  'Electricidad',
  'Agua',
  'Internet',
  'Teléfono',
  'Streaming',
  'Alimentación',
  'Supermercado',
  'Restaurante',
  'Seguros',
  'Auto',
  'Salud',
  'Vida',
  'Mascotas',
  'Veterinario',
  'Medicamentos',
  'Comida',
  'Familia',
  'Colegio',
  'Ropa',
  'Entretenimiento',
  'Ahorros',
  'Savings',
  'HYSA',
  '401k',
  'Brokerage',
  'Otros',
];

export default function App() {
  const {
    entries,
    settings,
    loading,
    saveEntryData,
    removeEntry,
    markPaymentPaid,
    postponePayment,
    skipPayment,
    updateInitialBalance,
  } = useData();

  const [tab, setTab] = useState<Tab>('inicio');
  const [type, setType] = useState<EntryType>('payment');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Servicios');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today());
  const [isRecurring, setIsRecurring] = useState(false);
  const [initialBalanceInput, setInitialBalanceInput] = useState('');

  const monthYear = new Date().toLocaleDateString('es-US', {
    month: 'long',
    year: 'numeric',
  });

  const income = entries.filter((e) => e.type === 'income');
  const payments = entries.filter((e) => e.type === 'payment');
  const savings = entries.filter((e) => e.type === 'savings');

  const paidIncome = income.filter((e) => e.status === 'paid');
  const pendingIncome = income.filter((e) => e.status === 'pending');

  const paidPayments = payments.filter((e) => e.status === 'paid');
  const pendingPayments = payments.filter(
    (e) => e.status === 'pending' || e.status === 'postponed'
  );
  const skippedPayments = payments.filter((e) => e.status === 'skipped');

  const transferredSavings = savings.filter((e) => e.status === 'paid');

  const totals = useMemo(() => {
    const totalIncomeReceived = sum(paidIncome);
    const totalIncomePending = sum(pendingIncome);
    const totalPaidPayments = sum(paidPayments);
    const totalPendingPayments = sum(pendingPayments);
    const totalSavingsTransferred = sum(transferredSavings);

    const currentBalance =
      settings.initialBalance +
      totalIncomeReceived -
      totalPaidPayments -
      totalSavingsTransferred;

    const projectedBalance = currentBalance - totalPendingPayments;

    return {
      totalIncomeReceived,
      totalIncomePending,
      totalPaidPayments,
      totalPendingPayments,
      totalSavingsTransferred,
      currentBalance,
      projectedBalance,
    };
  }, [entries, settings.initialBalance]);

  const dueToday = useMemo(() => {
    return pendingPayments.filter((e) => e.date === today());
  }, [pendingPayments]);

  const upcomingPayments = useMemo(() => {
    return [...pendingPayments]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  }, [pendingPayments]);

  const nextThirtyDays = useMemo(() => {
    return [...pendingPayments]
      .filter((entry) => {
        const days = daysUntil(entry.date);
        return days >= 0 && days <= 30;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [pendingPayments]);

  function money(value: number) {
    return `${settings.currencySymbol}${value.toFixed(2)}`;
  }

  async function saveInitialBalance() {
    const value = Number(initialBalanceInput);

    if (Number.isNaN(value)) {
      alert('Monto inválido');
      return;
    }

    await updateInitialBalance(value);
    setInitialBalanceInput('');
  }

  async function addMovement() {
    const value = Number(amount);

    if (!description.trim()) {
      alert('Escribe un nombre o descripción.');
      return;
    }

    if (Number.isNaN(value) || value <= 0) {
      alert('Escribe un monto válido.');
      return;
    }

    const dueDay = Number(date.slice(-2));
    const isSavings = type === 'savings';
    const isIncome = type === 'income';

    await saveEntryData({
      type,
      description: description.trim(),
      amount: value,
      date,
      category: isSavings ? 'Ahorros' : category,
      dueDay,
      isRecurring: isSavings ? false : isRecurring,
      priority: 'medium',
      status: isIncome || isSavings ? 'paid' : 'pending',
      recurring: isSavings ? 'none' : isRecurring ? 'monthly' : 'none',
    });

    setDescription('');
    setAmount('');
    setCategory('Servicios');
    setType('payment');
    setIsRecurring(false);
  }

  if (loading) {
    return <div style={{ padding: 24 }}>Cargando Monney...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Arial, sans-serif', paddingBottom: 90 }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '16px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Logo />
            <div>
              <h1 style={{ margin: 0, color: teal, fontSize: 38, fontWeight: 900 }}>
                Mon<span style={{ color: green }}>ney</span>
              </h1>
              <p style={{ margin: 0, color: '#64748b' }}>Planificador financiero personal</p>
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
            <section style={card}>
              <h2 style={title}>Saldo Inicial</h2>
              <div style={formGrid}>
                <input style={input} type="number" placeholder="Saldo inicial del mes" value={initialBalanceInput} onChange={(e) => setInitialBalanceInput(e.target.value)} />
                <button style={primaryButton} onClick={saveInitialBalance}>Guardar Saldo Inicial</button>
              </div>
            </section>

            <section style={{ ...card, marginTop: 16 }}>
              <h2 style={title}>Gastos</h2>
              <p style={{ marginTop: -8, color: '#64748b' }}>
                Registra pagos, ingresos o aplica un ahorro transferido.
              </p>

              <div style={formGrid}>
                <select style={input} value={type} onChange={(e) => {
                  const nextType = e.target.value as EntryType;
                  setType(nextType);
                  if (nextType === 'savings') setCategory('Ahorros');
                  if (nextType === 'income') setCategory('Otros');
                  if (nextType === 'payment') setCategory('Servicios');
                }}>
                  <option value="payment">Pago</option>
                  <option value="income">Ingreso</option>
                  <option value="savings">Ahorro</option>
                </select>

                <input style={input} placeholder="Nombre / descripción" value={description} onChange={(e) => setDescription(e.target.value)} />

                {type !== 'savings' && (
                  <select style={input} value={category} onChange={(e) => setCategory(e.target.value)}>
                    {categories.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                )}

                <input style={input} type="number" placeholder="Monto" value={amount} onChange={(e) => setAmount(e.target.value)} />

                <input style={input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />

                {type === 'payment' && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                    <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
                    Recurrente
                  </label>
                )}

                <button style={primaryButton} onClick={addMovement}>
                  {type === 'savings' ? 'Aplicar' : 'Guardar'}
                </button>
              </div>
            </section>

            <SummaryCards money={money} settings={settings} totals={totals} dueToday={dueToday} upcomingPayments={upcomingPayments} nextThirtyDays={nextThirtyDays} />
          </>
        )}

        {tab === 'pagos' && (
          <section>
            <h2 style={pageTitle}>Pagos</h2>

            <div style={twoColumns}>
              <PaymentList
                title="Por pagar"
                entries={pendingPayments}
                money={money}
                color={orange}
                onPaid={markPaymentPaid}
                onPostpone={postponePayment}
                onSkip={skipPayment}
                onDelete={removeEntry}
              />

              <PaymentList
                title="Pagado"
                entries={paidPayments}
                money={money}
                color={green}
                onDelete={removeEntry}
              />

              <PaymentList
                title="Omitidos"
                entries={skippedPayments}
                money={money}
                color="#64748b"
                onDelete={removeEntry}
              />
            </div>
          </section>
        )}

        {tab === 'ingresos' && (
          <section>
            <h2 style={pageTitle}>Ingresos</h2>
            <GenericList title="Ingresos registrados" entries={income} money={money} color={blue} onDelete={removeEntry} />
          </section>
        )}

        {tab === 'ahorros' && (
          <section>
            <h2 style={pageTitle}>Ahorros</h2>
            <GenericList title="Ahorros aplicados" entries={savings} money={money} color={purple} onDelete={removeEntry} />
          </section>
        )}

        {tab === 'resumen' && (
          <section style={card}>
            <h2 style={title}>Resumen mensual</h2>

            <SummaryRow label="Saldo Inicial" value={money(settings.initialBalance)} />
            <SummaryRow label="Saldo Actual" value={money(totals.currentBalance)} />
            <SummaryRow label="Pagos Pendientes" value={money(totals.totalPendingPayments)} />
            <SummaryRow label="Saldo Proyectado" value={money(totals.projectedBalance)} />

            <hr style={{ border: 0, borderTop: '1px solid #e5e7eb', margin: '16px 0' }} />

            <SummaryRow label="Ingresos recibidos" value={money(totals.totalIncomeReceived)} />
            <SummaryRow label="Ingresos futuros registrados" value={money(totals.totalIncomePending)} />
            <SummaryRow label="Pagos realizados" value={money(totals.totalPaidPayments)} />
            <SummaryRow label="Pagos pendientes" value={money(totals.totalPendingPayments)} />
            <SummaryRow label="Ahorros aplicados" value={money(totals.totalSavingsTransferred)} />
          </section>
        )}
      </main>

      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}

function Logo() {
  return (
    <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #0f766e, #65a30d)', display: 'grid', placeItems: 'center', color: 'white', fontSize: 34, fontWeight: 900, boxShadow: '0 8px 18px rgba(15,118,110,0.25)' }}>
      $
    </div>
  );
}

function SummaryCards({ money, settings, totals, dueToday, upcomingPayments, nextThirtyDays }: any) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginTop: 16 }}>
        <Metric title="Saldo Inicial" value={money(settings.initialBalance)} color={blue} />
        <Metric title="Saldo Actual" value={money(totals.currentBalance)} color={green} />
        <Metric title="Pagos Pendientes" value={money(totals.totalPendingPayments)} color={orange} />
        <Metric title="Saldo Proyectado" value={money(totals.projectedBalance)} color={totals.projectedBalance < 0 ? red : teal} />
      </div>

      <section style={{ ...card, marginTop: 16 }}>
        <h2 style={title}>Vence Hoy</h2>
        {dueToday.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No hay pagos que vencen hoy.</p>
        ) : (
          dueToday.map((e: Entry) => <PaymentPreview key={e.id} entry={e} money={money} />)
        )}
      </section>

      <section style={{ ...card, marginTop: 16 }}>
        <h2 style={title}>Próximos Pagos</h2>
        {upcomingPayments.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No hay pagos pendientes.</p>
        ) : (
          upcomingPayments.map((e: Entry) => <PaymentPreview key={e.id} entry={e} money={money} />)
        )}
      </section>

      <section style={{ ...card, marginTop: 16 }}>
        <h2 style={title}>Próximos 30 días</h2>
        <SummaryRow label="Monto comprometido" value={money(sum(nextThirtyDays))} />
        {nextThirtyDays.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No hay pagos en los próximos 30 días.</p>
        ) : (
          nextThirtyDays.map((e: Entry) => <PaymentPreview key={e.id} entry={e} money={money} />)
        )}
      </section>
    </>
  );
}

function PaymentPreview({ entry, money }: { entry: Entry; money: (value: number) => string }) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, marginBottom: 10, borderLeft: `6px solid ${paymentColor(entry)}` }}>
      <strong>{entry.description}</strong>
      <div>{money(entry.amount)}</div>
      <div>{entry.category || 'Sin categoría'} — {entry.date}</div>
      <div style={{ color: paymentColor(entry), fontWeight: 800 }}>{paymentLabel(entry)}</div>
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

function PaymentList({ title, entries, money, color, onPaid, onPostpone, onSkip, onDelete }: any) {
  return (
    <div style={{ ...card, borderTop: `5px solid ${color}` }}>
      <h3 style={{ color }}>{title}</h3>

      {entries.length === 0 ? (
        <p style={{ color: '#94a3b8' }}>No hay registros.</p>
      ) : (
        entries.map((e: Entry) => (
          <div key={e.id} style={{ border: '1px solid #e5e7eb', borderLeft: `6px solid ${paymentColor(e)}`, borderRadius: 12, padding: 12, marginBottom: 10 }}>
            <strong>{e.description}</strong>
            <div>{money(e.amount)}</div>
            <div>{e.category || 'Sin categoría'} — {e.date}</div>
            <div>Estado: {translateStatus(e.status)}</div>
            <div style={{ color: paymentColor(e), fontWeight: 800 }}>{paymentLabel(e)}</div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              {onPaid && e.status !== 'paid' && (
                <button style={primaryButton} onClick={() => onPaid(e)}>Pagar</button>
              )}

              {onPostpone && e.status !== 'paid' && (
                <>
                  <button style={secondaryButton} onClick={() => onPostpone(e, 1)}>+1 sem</button>
                  <button style={secondaryButton} onClick={() => onPostpone(e, 2)}>+2 sem</button>
                  <button style={secondaryButton} onClick={() => onPostpone(e, 3)}>+3 sem</button>
                  <button style={secondaryButton} onClick={() => onPostpone(e, 4)}>+4 sem</button>
                </>
              )}

              {onSkip && e.status !== 'paid' && (
                <button style={{ ...secondaryButton, background: '#64748b' }} onClick={() => onSkip(e)}>Omitir</button>
              )}

              <button style={{ ...secondaryButton, background: red }} onClick={() => onDelete(e.id)}>Eliminar</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function GenericList({ title, entries, money, color, onDelete }: any) {
  return (
    <div style={{ ...card, borderTop: `5px solid ${color}` }}>
      <h3 style={{ color }}>{title}</h3>

      {entries.length === 0 ? (
        <p style={{ color: '#94a3b8' }}>No hay registros.</p>
      ) : (
        entries.map((e: Entry) => (
          <div key={e.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, marginBottom: 10 }}>
            <strong>{e.description}</strong>
            <div>{money(e.amount)}</div>
            <div>{e.category || 'Sin categoría'} — {e.date}</div>
            <div>Estado: {translateStatus(e.status)}</div>
            <button style={{ ...secondaryButton, background: red, marginTop: 10 }} onClick={() => onDelete(e.id)}>Eliminar</button>
          </div>
        ))
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ color: '#475569' }}>{label}</span>
      <strong>{value}</strong>
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
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            style={{
              border: 0,
              borderRadius: 12,
              padding: 12,
              fontWeight: 800,
              cursor: 'pointer',
              background: tab === item.key ? teal : '#f1f5f9',
              color: tab === item.key ? 'white' : '#334155',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

function sum(entries: Entry[]) {
  return entries.reduce((total, entry) => total + entry.amount, 0);
}

function today() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function daysUntil(date: string) {
  const todayDate = new Date(today());
  const targetDate = new Date(date);
  const diff = targetDate.getTime() - todayDate.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function paymentColor(entry: Entry) {
  if (entry.status === 'paid') return green;
  if (entry.status === 'skipped') return '#64748b';

  const days = daysUntil(entry.date);

  if (days < 0) return red;
  if (days <= 3) return orange;
  return blue;
}

function paymentLabel(entry: Entry) {
  if (entry.status === 'paid') return 'Pagado';
  if (entry.status === 'skipped') return 'Omitido';

  const days = daysUntil(entry.date);

  if (days < 0) return 'Vencido';
  if (days === 0) return 'Vence hoy';
  if (days <= 3) return `Vence en ${days} días`;

  return 'Próximo';
}

function translateStatus(status: Entry['status']) {
  if (status === 'pending') return 'Pendiente';
  if (status === 'paid') return 'Pagado';
  if (status === 'postponed') return 'Pospuesto';
  if (status === 'skipped') return 'Omitido';
  return status;
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

const secondaryButton: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 10,
  border: 0,
  background: '#334155',
  color: 'white',
  fontWeight: 800,
  cursor: 'pointer',
};

const formGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 10,
  alignItems: 'stretch',
};

const twoColumns: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 16,
};

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
