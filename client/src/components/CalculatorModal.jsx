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
      <div className="glass-panel-glow" style={{ width: '320px', padding: '20px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calculator size={18} color="var(--accent-purple)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Utility Calculator</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{
          background: 'rgba(0,0,0,0.6)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '16px',
          textAlign: 'right',
          fontSize: '1.5rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--accent-cyan)',
          minHeight: '60px',
          wordBreak: 'break-all'
        }}>
          {display}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {btns.map((btn, i) => (
            <button
              key={i}
              onClick={() => handleBtn(btn)}
              className="btn-secondary"
              style={{
                padding: '14px',
                justifyContent: 'center',
                fontSize: '1.1rem',
                fontWeight: 600,
                color: btn === '=' ? 'var(--accent-cyan)' : btn === 'C' ? 'var(--accent-pink)' : '#fff'
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
