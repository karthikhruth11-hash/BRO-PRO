import React from 'react';
import { Terminal, HardDrive, Cpu, ShieldCheck, CheckCircle, AlertTriangle } from 'lucide-react';

export default function AgentTools({ activeTool, lastExecution }) {
  const tools = [
    { id: 'open_app', name: 'App Launcher', desc: 'Opens allow-listed OS desktop applications', icon: HardDrive, color: '#00f0ff' },
    { id: 'run_terminal', name: 'Terminal Execution', desc: 'Executes approved CLI shell commands', icon: Terminal, color: '#10b981' },
    { id: 'get_telemetry', name: 'OS Telemetry', desc: 'Reads live system CPU, RAM, and hardware metrics', icon: Cpu, color: '#f59e0b' },
    { id: 'read_files', name: 'File Explorer', desc: 'Reads virtual/local file system paths safely', icon: ShieldCheck, color: '#8b5cf6' }
  ];

  return (
    <div style={{
      padding: '16px',
      background: 'rgba(13, 17, 26, 0.6)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Registered OS Tools:
        </span>
        <div style={{ display: 'flex', gap: '10px' }}>
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
                  padding: '6px 12px',
                  borderRadius: '20px',
                  background: isActive ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  border: isActive ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                  fontSize: '0.75rem',
                  color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)'
                }}
              >
                <Icon size={14} color={isActive ? 'var(--accent-cyan)' : t.color} />
                <span style={{ fontWeight: 500 }}>{t.name}</span>
                {isActive && <CheckCircle size={12} color="var(--accent-emerald)" className="pulse-glow" />}
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
