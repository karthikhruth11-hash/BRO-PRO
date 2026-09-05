import React from 'react';
import { 
  X, 
  Cpu, 
  MessageSquare, 
  Clock, 
  Zap, 
  FileText, 
  Code, 
  Languages, 
  Sparkles, 
  Share2, 
  Download, 
  Trash2,
  HelpCircle,
  Activity
} from 'lucide-react';

export default function RightContextPanel({
  isOpen,
  onClose,
  selectedModel,
  messageCount,
  tokensUsed = 0,
  activeTopic = "General Knowledge",
  onQuickToolClick,
  onExportChat,
  onClearChat
}) {
  if (!isOpen) return null;

  const aiTools = [
    { id: 'summarize', label: 'Summarize', icon: FileText, desc: 'Condensed summary', color: 'var(--accent-cyan)' },
    { id: 'explain', label: 'Explain Topic', icon: HelpCircle, desc: 'Simple terms', color: 'var(--accent-purple)' },
    { id: 'rewrite', label: 'Rewrite', icon: Sparkles, desc: 'Polished prose', color: 'var(--accent-pink)' },
    { id: 'code', label: 'Write Code', icon: Code, desc: 'Syntax & solution', color: 'var(--accent-emerald)' },
    { id: 'translate', label: 'Translate', icon: Languages, desc: 'Multi-lingual', color: 'var(--accent-amber)' },
    { id: 'analyze', label: 'Analyze Data', icon: Activity, desc: 'Deep insights', color: 'var(--accent-blue)' }
  ];

  return (
    <aside style={{
      width: '300px',
      background: 'var(--bg-secondary)',
      borderLeft: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '18px',
      gap: '18px',
      overflowY: 'auto',
      userSelect: 'none',
      boxShadow: '-4px 0 20px rgba(0,0,0,0.1)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
          <Cpu size={18} color="var(--accent-cyan)" /> Context & AI Tools
        </div>
        <button
          onClick={onClose}
          className="btn-secondary"
          style={{ padding: '6px', borderRadius: '8px' }}
          title="Close Panel"
        >
          <X size={16} />
        </button>
      </div>

      {/* Chat Metadata Box */}
      <div style={{
        padding: '14px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Session Analytics
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cpu size={14} color="var(--accent-cyan)" /> Active Engine:
          </span>
          <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{selectedModel}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MessageSquare size={14} color="var(--accent-purple)" /> Total Messages:
          </span>
          <span style={{ fontWeight: 600 }}>{messageCount}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
          <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={14} color="var(--accent-amber)" /> Est. Tokens:
          </span>
          <span style={{ fontWeight: 600 }}>{tokensUsed || '~' + (messageCount * 120)}</span>
        </div>
      </div>

      {/* AI Tools Palette */}
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
          AI Productivity Tools
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {aiTools.map((tool) => {
            const IconComp = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => onQuickToolClick && onQuickToolClick(tool.id)}
                className="btn-secondary"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '10px',
                  borderRadius: '10px',
                  gap: '4px',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  <IconComp size={14} color={tool.color} /> {tool.label}
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{tool.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Context / Memory Graph */}
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
          Active Topic & Memory
        </div>
        <div style={{
          padding: '12px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)', fontWeight: 600 }}>
            <Sparkles size={14} /> Topic: {activeTopic}
          </div>
          <span style={{ fontSize: '0.75rem' }}>
            Memory graph is active. Facts extracted automatically from user conversation.
          </span>
        </div>
      </div>

      {/* Quick Session Actions */}
      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Quick Actions
        </div>
        <button
          onClick={onExportChat}
          className="btn-secondary"
          style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.82rem' }}
        >
          <Download size={15} color="var(--accent-cyan)" /> Export Session (Markdown)
        </button>

        <button
          onClick={onClearChat}
          className="btn-secondary"
          style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.82rem', color: 'var(--accent-pink)' }}
        >
          <Trash2 size={15} /> Clear Current Canvas
        </button>
      </div>
    </aside>
  );
}
