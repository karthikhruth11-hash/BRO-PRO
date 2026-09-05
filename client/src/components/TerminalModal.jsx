import React, { useState } from 'react';
import { Terminal, X, Play, ShieldAlert } from 'lucide-react';

export default function TerminalModal({ onClose }) {
  const [cmdInput, setCmdInput] = useState('');
  const [history, setHistory] = useState([
    { type: 'sys', text: 'BRO AI Terminal Sandbox v2.0.0' },
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
      <div className="glass-panel-glow" style={{ width: '650px', maxHeight: '500px', display: 'flex', flexDirection: 'column', borderRadius: '16px' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Terminal size={18} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Interactive CLI Sandbox Terminal</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, padding: '16px', overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.6)' }}>
          {history.map((h, i) => (
            <div key={i} style={{ color: h.type === 'user' ? 'var(--accent-cyan)' : h.type === 'err' ? 'var(--accent-pink)' : '#a7f3d0' }}>
              {h.text}
            </div>
          ))}
        </div>

        <form onSubmit={handleRun} style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '10px' }}>
          <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center' }}>$</span>
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
