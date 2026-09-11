import React, { useState } from 'react';
import { Sliders, Plus, Trash2, CheckCircle, Zap } from 'lucide-react';

export default function TrainingPanel() {
  const [commands, setCommands] = useState([
    { id: '1', phrase: 'open notepad', action: 'Launches Windows Notepad text editor', category: 'OS Command' },
    { id: '2', phrase: 'status check', action: 'Triggers live telemetry query for CPU and memory', category: 'Telemetry' },
    { id: '3', phrase: 'code review', action: 'Switches persona to Atlas (Polyglot Architect)', category: 'Persona Switch' }
  ]);

  const [phrase, setPhrase] = useState('');
  const [action, setAction] = useState('');

  const handleAddCommand = (e) => {
    e.preventDefault();
    if (!phrase || !action) return;
    setCommands([
      ...commands,
      { id: Date.now().toString(), phrase, action, category: 'Custom Trained' }
    ]);
    setPhrase('');
    setAction('');
  };

  const handleDelete = (id) => {
    setCommands(commands.filter(c => c.id !== id));
  };

  return (
    <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
      <div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-main, #f8fafc)' }}>
          Voice & Intent Command Studio
        </h2>
        <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.82rem', margin: 0 }}>
          Train custom phrases to automatically trigger OS tools, persona shifts, or instant workflow macros.
        </p>
      </div>

      {/* Add New Command Form */}
      <form onSubmit={handleAddCommand} style={{ background: 'var(--bg-card, #131b2e)', border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))', borderRadius: '12px', padding: '18px', display: 'flex', gap: '12px', flexWrap: 'wrap', boxShadow: 'var(--shadow-sm)' }}>
        <input
          type="text"
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          placeholder="Trigger Phrase (e.g. 'deploy website')"
          style={{
            flex: 1,
            minWidth: '220px',
            background: 'var(--bg-input, rgba(0,0,0,0.3))',
            border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
            borderRadius: '8px',
            padding: '10px 14px',
            color: 'var(--text-main, #f8fafc)',
            outline: 'none',
            fontSize: '0.88rem'
          }}
        />
        <input
          type="text"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder="Execution Action / Response Macro"
          style={{
            flex: 1.5,
            minWidth: '280px',
            background: 'var(--bg-input, rgba(0,0,0,0.3))',
            border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
            borderRadius: '8px',
            padding: '10px 14px',
            color: 'var(--text-main, #f8fafc)',
            outline: 'none',
            fontSize: '0.88rem'
          }}
        />
        <button type="submit" className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.88rem', fontWeight: 600 }}>
          <Plus size={16} /> Add Command
        </button>
      </form>

      {/* Command List */}
      <div style={{ background: 'var(--bg-card, #131b2e)', border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-main, #f8fafc)' }}>Trained Voice Commands ({commands.length})</h3>
        {commands.map((cmd) => (
          <div
            key={cmd.id}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'var(--bg-secondary, rgba(255, 255, 255, 0.02))',
              border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={15} color="var(--accent-primary, #3b82f6)" />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-main, #f8fafc)', fontSize: '0.9rem' }}>
                  "{cmd.phrase}"
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)', marginTop: '2px' }}>
                  {cmd.action}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '3px 8px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.12)', color: 'var(--accent-primary, #3b82f6)' }}>
                {cmd.category}
              </span>
              <button
                onClick={() => handleDelete(cmd.id)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer', padding: '4px' }}
                title="Delete command"
              >
                <Trash2 size={15} color="var(--accent-danger, #ef4444)" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
