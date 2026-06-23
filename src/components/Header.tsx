import React from 'react';

export default function Header() {
  const now = new Date();

  const monthYear = now.toLocaleDateString('es-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <header
      style={{
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        padding: '18px 20px',
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img
            src="/monney.jpg"
            alt="Monney"
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              objectFit: 'cover',
            }}
          />

          <div>
            <h1
              style={{
                margin: 0,
                color: '#0f766e',
                fontSize: 36,
                fontWeight: 900,
              }}
            >
              Monney
            </h1>

            <div
              style={{
                color: '#64748b',
                fontSize: 14,
              }}
            >
              Planificador financiero familiar
            </div>
          </div>
        </div>

        <div
          style={{
            background: '#ecfdf5',
            padding: '12px 18px',
            borderRadius: 14,
            fontWeight: 700,
            color: '#0f766e',
          }}
        >
          {monthYear}
        </div>
      </div>
    </header>
  );
}