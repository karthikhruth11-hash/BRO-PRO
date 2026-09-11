import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Cpu, 
  MessageSquare, 
  Zap, 
  FileText, 
  Code, 
  Languages, 
  Sparkles, 
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
  const [showStatsPopover, setShowStatsPopover] = useState(false);
  const popoverRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setShowStatsPopover(false);
      }
    }
    if (showStatsPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStatsPopover]);

  if (!isOpen && typeof window !== 'undefined' && window.innerWidth > 1024) return null;

  const aiTools = [
    { id: 'summarize', label: 'Summarize', icon: FileText, desc: 'Condensed overview', color: 'var(--accent-primary)' },
    { id: 'explain', label: 'Explain', icon: HelpCircle, desc: 'Clear breakdown', color: 'var(--accent-purple)' },
    { id: 'rewrite', label: 'Rewrite', icon: Sparkles, desc: 'Refined prose', color: 'var(--accent-pink)' },
    { id: 'code', label: 'Write Code', icon: Code, desc: 'Syntax & solution', color: 'var(--accent-emerald)' },
    { id: 'translate', label: 'Translate', icon: Languages, desc: 'Multi-lingual', color: 'var(--accent-amber)' },
    { id: 'analyze', label: 'Analyze', icon: Activity, desc: 'Key insights', color: 'var(--accent-cyan)' }
  ];

  return (
    <aside className={`right-context-panel ${isOpen ? 'open' : ''}`}>
      {/* Session Analytics Trigger */}
      <div style={{ position: 'relative' }} ref={popoverRef}>
        <button
          onClick={() => setShowStatsPopover(!showStatsPopover)}
          className={`right-rail-btn ${showStatsPopover ? 'active' : ''}`}
          title={`Session Analytics (${selectedModel})`}
          style={{ color: showStatsPopover ? 'var(--accent-primary)' : 'var(--text-muted)' }}
        >
          <Cpu size={17} />
        </button>

        {/* Floating Popover for Session Analytics */}
        {showStatsPopover && (
          <div
            style={{
              position: 'absolute',
              right: '48px',
              top: '0px',
              width: '240px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 200,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              animation: 'fadeIn 0.15s ease-out'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Cpu size={13} style={{ color: 'var(--accent-primary)' }} /> Session Analytics
              </span>
              <button
                onClick={() => setShowStatsPopover(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
              >
                <X size={12} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Model:</span>
              <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{selectedModel}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem' }}>
              <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <MessageSquare size={12} style={{ color: 'var(--accent-purple)' }} /> Messages:
              </span>
              <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{messageCount}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem' }}>
              <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Zap size={12} style={{ color: 'var(--accent-amber)' }} /> Est. Tokens:
              </span>
              <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{tokensUsed || '~' + (messageCount * 120)}</span>
            </div>

            {activeTopic && (
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '6px', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: '2px' }}>Topic:</div>
                <div style={{ color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeTopic}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="right-rail-divider" />

      {/* AI Productivity Tools */}
      {aiTools.map((tool) => {
        const IconComp = tool.icon;
        return (
          <button
            key={tool.id}
            onClick={() => onQuickToolClick && onQuickToolClick(tool.id)}
            className="right-rail-btn"
            title={`${tool.label} — ${tool.desc}`}
          >
            <IconComp size={17} style={{ color: tool.color }} />
          </button>
        );
      })}

      <div className="right-rail-divider" />

      {/* Quick Session Actions */}
      <button
        onClick={onExportChat}
        className="right-rail-btn"
        title="Export Session (Markdown)"
      >
        <Download size={16} />
      </button>

      <button
        onClick={onClearChat}
        className="right-rail-btn"
        title="Clear Current Canvas"
        style={{ color: 'var(--accent-red)' }}
      >
        <Trash2 size={16} />
      </button>

      {/* Close / Collapse Rail */}
      <button
        onClick={onClose}
        className="right-rail-btn"
        title="Close Sidebar"
        style={{ marginTop: 'auto' }}
      >
        <X size={15} />
      </button>
    </aside>
  );
}
