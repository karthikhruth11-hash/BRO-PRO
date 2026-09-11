import React from 'react';
import { Terminal, HardDrive, Cpu, ShieldCheck, CheckCircle, AlertTriangle } from 'lucide-react';

export default function AgentTools({ activeTool, lastExecution }) {
  const tools = [
    { id: 'open_app', name: 'App Launcher', desc: 'Opens allow-listed OS desktop applications', icon: HardDrive, color: '#3b82f6' },
    { id: 'run_terminal', name: 'Terminal Execution', desc: 'Executes approved CLI shell commands', icon: Terminal, color: '#10b981' },
    { id: 'get_telemetry', name: 'OS Telemetry', desc: 'Reads live system CPU, RAM, and hardware metrics', icon: Cpu, color: '#f59e0b' },
    { id: 'read_files', name: 'File Explorer', desc: 'Reads virtual/local file system paths safely', icon: ShieldCheck, color: '#8b5cf6' }
  ];

  return (
    <div style={{
      padding: '12px 16px',
      background: 'var(--bg-secondary, #0e1526)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Registered OS Tools:
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {tools.map((t) => {
            const Icon = t.icon;
            const isActive = activeTool === t.id;
            return (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  background: isActive ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  border: isActive ? '1px solid var(--accent-primary, #3b82f6)' : '1px solid var(--border-subtle)',
                  fontSize: '0.75rem',
                  color: isActive ? 'var(--accent-primary, #3b82f6)' : 'var(--text-muted)'
                }}
              >
                <Icon size={14} color={isActive ? 'var(--accent-primary, #3b82f6)' : t.color} />
                <span style={{ fontWeight: 500 }}>{t.name}</span>
                {isActive && <CheckCircle size={12} color="var(--accent-emerald)" />}
              </div>
            );
          })}
        </div>
      </div>

      {lastExecution && (
        <div style={{
          fontSize: '0.75rem',
          color: lastExecution.success ? 'var(--accent-emerald)' : 'var(--accent-pink)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(0,0,0,0.3)',
          padding: '4px 10px',
          borderRadius: '6px'
        }}>
          {lastExecution.success ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          <span>{lastExecution.intent} ({lastExecution.provider})</span>
        </div>
      )}
    </div>
  );
}
