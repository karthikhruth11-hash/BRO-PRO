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
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-display)' }} className="purple-gradient-text">
          Voice & Intent Command Studio
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Train custom phrases to automatically trigger OS tools, persona shifts, or instant workflow macros.
        </p>
      </div>

      {/* Add New Command Form */}
      <form onSubmit={handleAddCommand} className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          placeholder="Trigger Phrase (e.g. 'deploy website')"
          style={{
            flex: 1,
            minWidth: '220px',
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#fff',
            outline: 'none'
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
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#fff',
            outline: 'none'
          }}
        />
        <button type="submit" className="btn-primary" style={{ padding: '10px 20px' }}>
          <Plus size={18} /> Add Command
        </button>
      </form>

      {/* Command List */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Trained Voice Commands ({commands.length})</h3>
        {commands.map((cmd) => (
          <div
            key={cmd.id}
            style={{
              padding: '14px 18px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <Zap size={18} color="var(--accent-purple)" />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--accent-cyan)', fontSize: '0.95rem' }}>
                  "{cmd.phrase}"
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {cmd.action}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(139, 92, 246, 0.2)', color: 'var(--accent-purple)' }}>
                {cmd.category}
              </span>
              <button
                onClick={() => handleDelete(cmd.id)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                <Trash2 size={16} color="var(--accent-pink)" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
