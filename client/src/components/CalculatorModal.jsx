import React, { useState } from 'react';
import { Calculator, X } from 'lucide-react';

export default function CalculatorModal({ onClose }) {
  const [display, setDisplay] = useState('0');

  const handleBtn = (val) => {
    if (val === 'C') {
      setDisplay('0');
    } else if (val === '=') {
      try {
        // Safe math evaluation
        const sanitized = display.replace(/[^0-9+\-*/.]/g, '');
        setDisplay(String(Function(`'use strict'; return (${sanitized})`)()));
      } catch (err) {
        setDisplay('Error');
      }
    } else {
      setDisplay(prev => prev === '0' || prev === 'Error' ? val : prev + val);
    }
  };

  const btns = [
    '7', '8', '9', '/',
    '4', '5', '6', '*',
    '1', '2', '3', '-',
    'C', '0', '=', '+'
  ];

  return (
    <div className="modal-overlay">
      <div style={{
        width: '320px',
        padding: '20px',
        borderRadius: '16px',
        background: 'var(--bg-card, #131b2e)',
        border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
        boxShadow: 'var(--shadow-lg, 0 16px 48px rgba(0, 0, 0, 0.45))',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calculator size={16} color="var(--accent-primary, #3b82f6)" />
            </div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: 'var(--text-main, #f8fafc)' }}>Utility Calculator</h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{
          background: 'var(--bg-input, rgba(0,0,0,0.4))',
          border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
          borderRadius: '10px',
          padding: '16px',
          textAlign: 'right',
          fontSize: '1.5rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-main, #f8fafc)',
          fontWeight: 700,
          minHeight: '60px',
          wordBreak: 'break-all'
        }}>
          {display}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {btns.map((btn, i) => (
            <button
              key={i}
              onClick={() => handleBtn(btn)}
              className={btn === '=' ? "btn-primary" : "btn-secondary"}
              style={{
                padding: '12px',
                justifyContent: 'center',
                fontSize: '1.05rem',
                fontWeight: 600,
                color: btn === '=' ? '#ffffff' : btn === 'C' ? 'var(--accent-danger, #ef4444)' : 'var(--text-main, #f8fafc)'
              }}
            >
              {btn}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
