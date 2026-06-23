import React from 'react';

export type Tab =
  | 'inicio'
  | 'pagos'
  | 'ingresos'
  | 'ahorros'
  | 'resumen';

interface Props {
  tab: Tab;
  setTab: React.Dispatch<React.SetStateAction<Tab>>;
}

export default function BottomNav({
  tab,
  setTab,
}: Props) {
  const items = [
    { key: 'inicio', label: 'Inicio' },
    { key: 'pagos', label: 'Pagos' },
    { key: 'ingresos', label: 'Ingresos' },
    { key: 'ahorros', label: 'Ahorros' },
    { key: 'resumen', label: 'Resumen' },
  ] as const;

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#ffffff',
        borderTop: '1px solid #e5e7eb',
        padding: 10,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(5,1fr)',
          gap: 6,
        }}
      >
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            style={{
              border: 0,
              borderRadius: 12,
              padding: 12,
              cursor: 'pointer',
              background:
                tab === item.key
                  ? '#0f766e'
                  : '#f1f5f9',
              color:
                tab === item.key
                  ? 'white'
                  : '#334155',
              fontWeight: 700,
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}