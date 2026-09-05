import React from 'react';
import { Bot, Zap, Heart, Terminal, Briefcase, GraduationCap, Scale, Code2 } from 'lucide-react';

export default function PersonalitySelector({ activePersona, onSelectPersona }) {
  const personas = [
    {
      id: 'jarvis',
      name: 'J.A.R.V.I.S.',
      role: 'Tactical Assistant',
      desc: 'Stark-inspired, calls user Boss, thorough & professional.',
      icon: Bot,
      color: '#00f0ff'
    },
    {
      id: 'friday',
      name: 'F.R.I.D.A.Y.',
      role: 'Operations AI',
      desc: 'Crisp, organized tactical operations manager.',
      icon: Zap,
      color: '#10b981'
    },
    {
      id: 'girlfriend',
      name: 'Luna',
      role: 'Companion',
      desc: 'Warm, affectionate, empathetic partner tone.',
      icon: Heart,
      color: '#ec4899'
    },
    {
      id: 'cyberpunk',
      name: 'Neo',
      role: 'Cyberpunk Hacker',
      desc: 'Futuristic high-octane tech & security specialist.',
      icon: Terminal,
      color: '#f43f5e'
    },
    {
      id: 'lead_dev',
      name: 'Victoria',
      role: 'Senior Tech Lead',
      desc: 'Architecture audits & production code standards.',
      icon: Briefcase,
      color: '#3b82f6'
    },
    {
      id: 'tutor',
      name: 'Prof. Sage',
      role: 'Academic Tutor',
      desc: 'Patient step-by-step science & math mentor.',
      icon: GraduationCap,
      color: '#a855f7'
    },
    {
      id: 'lawyer',
      name: 'Harvey',
      role: 'Legal Counsel',
      desc: 'Legal advocate — cites statutes, precedent & contracts.',
      icon: Scale,
      color: '#fbbf24'
    },
    {
      id: 'polyglot',
      name: 'Atlas',
      role: 'Software Architect',
      desc: 'Full-stack architect & polyglot code expert.',
      icon: Code2,
      color: '#06b6d4'
    }
  ];

  return (
    <div style={{
      padding: '10px 20px',
      background: 'rgba(7, 9, 14, 0.95)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      overflowX: 'auto',
      userSelect: 'none'
    }}>
      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>
        Select Persona:
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
              padding: '6px 14px',
              borderRadius: '20px',
              border: isSelected ? `1px solid ${p.color}` : '1px solid var(--border-subtle)',
              background: isSelected ? `${p.color}20` : 'rgba(255,255,255,0.03)',
              color: isSelected ? p.color : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: isSelected ? 600 : 400,
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <Icon size={14} color={isSelected ? p.color : 'var(--text-dim)'} />
            <span>{p.name}</span>
            <span style={{ opacity: 0.6, fontSize: '0.72rem' }}>({p.role})</span>
          </button>
        );
      })}
    </div>
  );
}
