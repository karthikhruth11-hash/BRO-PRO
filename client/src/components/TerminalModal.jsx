import React, { useState } from 'react';
import { Terminal, X, Play, ShieldAlert } from 'lucide-react';

export default function TerminalModal({ onClose }) {
  const [cmdInput, setCmdInput] = useState('');
  const [history, setHistory] = useState([
    { type: 'sys', text: 'SAGW AI Terminal Sandbox v2.0.0' },
    { type: 'sys', text: 'Allow-listed commands: dir, tasklist, systeminfo, ipconfig, node -v, git status' }
  ]);

  const handleRun = async (e) => {
    e.preventDefault();
    if (!cmdInput.trim()) return;

    const userCmd = cmdInput;
    setCmdInput('');
    setHistory(prev => [...prev, { type: 'user', text: `$ ${userCmd}` }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wednesday-token': 'wednesday-secret-local-handshake-token-2026'
        },
        body: JSON.stringify({ message: `exec ${userCmd}`, persona: 'jarvis' })
      });
      const data = await res.json();
      setHistory(prev => [...prev, { type: 'out', text: data.response }]);
    } catch (err) {
      setHistory(prev => [...prev, { type: 'err', text: `Execution error: ${err.message}` }]);
    }
  };

  return (
    <div className="modal-overlay">
      <div style={{ width: '650px', maxWidth: '90vw', maxHeight: '520px', display: 'flex', flexDirection: 'column', borderRadius: '16px', background: 'var(--bg-card, #131b2e)', border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))', boxShadow: 'var(--shadow-lg, 0 16px 48px rgba(0, 0, 0, 0.45))', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Terminal size={16} color="var(--accent-primary, #3b82f6)" />
            </div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: 'var(--text-main, #f8fafc)' }}>Interactive CLI Sandbox Terminal</h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer', padding: '6px', borderRadius: '6px', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, padding: '16px', overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.4)' }}>
          {history.map((h, i) => (
            <div key={i} style={{ color: h.type === 'user' ? 'var(--accent-primary, #3b82f6)' : h.type === 'err' ? 'var(--accent-danger, #ef4444)' : '#a7f3d0' }}>
              {h.text}
            </div>
          ))}
        </div>

        <form onSubmit={handleRun} style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ color: 'var(--accent-primary, #3b82f6)', fontFamily: 'var(--font-mono)', fontWeight: 700, display: 'flex', alignItems: 'center' }}>$</span>
          <input
            type="text"
            value={cmdInput}
            onChange={(e) => setCmdInput(e.target.value)}
            placeholder="Type command (e.g. 'dir', 'systeminfo')..."
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontFamily: 'var(--font-mono)' }}
          />
          <button type="submit" className="btn-primary" style={{ padding: '6px 12px' }}>
            <Play size={14} /> Run
          </button>
        </form>
      </div>
    </div>
  );
}
