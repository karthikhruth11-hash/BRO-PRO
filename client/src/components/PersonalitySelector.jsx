import React from 'react';
import { 
  Bot, 
  Cpu, 
  Heart, 
  Terminal, 
  Briefcase, 
  GraduationCap, 
  Activity, 
  Coffee 
} from 'lucide-react';

export const personas = [
  { id: 'jarvis', name: 'J.A.R.V.I.S.', role: 'Tactical', icon: Bot, color: 'var(--accent-primary)', desc: 'Precise, logical, and structured execution' },
  { id: 'friday', name: 'F.R.I.D.A.Y.', role: 'Operations', icon: Cpu, color: 'var(--accent-emerald)', desc: 'Fast, mission-oriented, and task-driven' },
  { id: 'luna', name: 'Luna', role: 'Companion', icon: Heart, color: 'var(--accent-pink)', desc: 'Empathetic, encouraging, and emotionally intelligent' },
  { id: 'neo', name: 'Neo', role: 'Systems', icon: Terminal, color: 'var(--accent-cyan)', desc: 'Direct, technical, and systems-focused' },
  { id: 'victoria', name: 'Victoria', role: 'Tech Lead', icon: Briefcase, color: 'var(--accent-purple)', desc: 'Architecture audits & production code standards' },
  { id: 'sage', name: 'Prof. Sage', role: 'Academic', icon: GraduationCap, color: 'var(--accent-amber)', desc: 'First-principles breakdowns & educational depth' },
  { id: 'dr_alex', name: 'Dr. Alex', role: 'Clinical', icon: Activity, color: 'var(--accent-red)', desc: 'Evidence-based healthcare and biological insights' },
  { id: 'sam', name: 'Sam', role: 'Casual', icon: Coffee, color: 'var(--accent-amber)', desc: 'Warm, down-to-earth, and conversational banter' }
];

export default function PersonalitySelector({ activePersona, onSelectPersona }) {
  return (
    <div style={{
      padding: '8px 16px',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      overflowX: 'auto',
      userSelect: 'none'
    }}>
      <span style={{ 
        fontSize: '0.72rem', 
        fontWeight: 600, 
        color: 'var(--text-dim)', 
        textTransform: 'uppercase', 
        letterSpacing: '0.04em', 
        whiteSpace: 'nowrap',
        marginRight: '4px'
      }}>
        Persona
      </span>
      {personas.map((p) => {
        const Icon = p.icon;
        const isSelected = activePersona === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onSelectPersona(p.id)}
            title={p.desc}
            style={{
              padding: '5px 11px',
              borderRadius: 'var(--radius-sm)',
              border: isSelected ? '1px solid var(--border-strong)' : '1px solid var(--border-subtle)',
              background: isSelected ? 'var(--bg-card-hover)' : 'transparent',
              color: isSelected ? 'var(--text-main)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              fontWeight: isSelected ? 600 : 400,
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
              boxShadow: isSelected ? 'var(--shadow-sm)' : 'none'
            }}
          >
            <Icon size={13} style={{ color: isSelected ? p.color : 'var(--text-dim)' }} />
            <span>{p.name}</span>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>{p.role}</span>
          </button>
        );
      })}
    </div>
  );
}
