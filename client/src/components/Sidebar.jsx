import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Cpu, 
  Folder, 
  Mic, 
  Terminal, 
  Calculator, 
  Settings, 
  Plus, 
  Trash2, 
  Bot,
  Sun,
  Moon,
  Search,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  PinOff,
  Clock,
  Users,
  Shield,
  Smartphone,
  Laptop,
  ChevronDown,
  Wrench,
  Check
} from 'lucide-react';

export default function Sidebar({
  activeView,
  setActiveView,
  sessions,
  activeSessionId,
  setActiveSessionId,
  createNewSession,
  clearHistory,
  deleteSession,
  persona,
  onOpenTerminal,
  onOpenCalculator,
  onOpenSettings,
  isServerConnected,
  theme,
  toggleTheme,
  isMobileOpen,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
  currentUser,
  onOpenAuth,
  onOpenAdmin,
  onLogout,
  isMobile,
  deviceLabel
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [pinnedSessionIds, setPinnedSessionIds] = useState([]);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [isUtilitiesOpen, setIsUtilitiesOpen] = useState(false);
  const viewMenuRef = useRef(null);
  const utilitiesRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (viewMenuRef.current && !viewMenuRef.current.contains(e.target)) {
        setIsViewMenuOpen(false);
      }
      if (utilitiesRef.current && !utilitiesRef.current.contains(e.target)) {
        setIsUtilitiesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const viewOptions = [
    { 
      id: 'chat', 
      label: 'AI Chat Canvas', 
      icon: MessageSquare, 
      color: 'var(--accent-primary)',
      desc: 'Interactive AI Workspace'
    },
    { 
      id: 'team', 
      label: 'Our Group', 
      icon: Users, 
      color: 'var(--accent-emerald)',
      desc: 'Team & Collaboration'
    },
    { 
      id: 'files', 
      label: 'File Explorer', 
      icon: Folder, 
      color: 'var(--accent-amber)',
      desc: 'Documents & Storage'
    },
    { 
      id: 'telemetry', 
      label: 'Telemetry & System', 
      icon: Cpu, 
      color: 'var(--accent-purple)',
      desc: 'Diagnostics & Vitals'
    }
  ];

  const currentViewOption = viewOptions.find(v => v.id === activeView) || viewOptions[0];
  const CurrentViewIcon = currentViewOption.icon;


  const togglePinSession = (e, id) => {
    e.stopPropagation();
    setPinnedSessionIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const filteredSessions = sessions.filter(session => 
    (session.title || 'Untitled Conversation').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedSessions = filteredSessions.filter(s => pinnedSessionIds.includes(s.id));
  const recentSessions = filteredSessions.filter(s => !pinnedSessionIds.includes(s.id));

  // Categorize Sessions into Today, Older
  const todaySessions = recentSessions.slice(0, 3);
  const olderSessions = recentSessions.slice(3);

  // Slim Icon Rail Collapsed Mode
  if (isCollapsed && !isMobileOpen) {
    return (
      <aside style={{
        width: '60px',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: '100%',
        padding: '14px 8px',
        gap: '12px',
        userSelect: 'none'
      }}>
        {/* Brand Logo in collapsed rail */}
        <img
          src="/sagw-ai-logo.png"
          alt="SAGW AI"
          style={{
            width: '34px',
            height: '34px',
            borderRadius: 'var(--radius-sm)',
            objectFit: 'cover',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            cursor: 'pointer'
          }}
          onClick={onToggleCollapse}
          title="SAGW AI"
        />

        {/* Toggle Expand Button */}
        <button
          onClick={onToggleCollapse}
          className="btn-secondary"
          style={{ padding: '8px', borderRadius: 'var(--radius-sm)' }}
          title="Expand Sidebar"
        >
          <PanelLeftOpen size={17} />
        </button>

        {/* New Session Button */}
        <button
          onClick={createNewSession}
          className="btn-primary"
          style={{ padding: '8px', borderRadius: 'var(--radius-sm)', width: '38px', height: '38px', justifyContent: 'center' }}
          title="New Session"
        >
          <Plus size={17} />
        </button>

        {/* Vertical Icon Rail Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
          <button
            onClick={() => setActiveView('chat')}
            className="btn-secondary"
            style={{ 
              padding: '9px', 
              borderRadius: 'var(--radius-sm)', 
              background: activeView === 'chat' ? 'var(--bg-hover)' : 'transparent',
              borderColor: activeView === 'chat' ? 'var(--border-strong)' : 'transparent' 
            }}
            title="Chat Canvas"
          >
            <MessageSquare size={17} style={{ color: activeView === 'chat' ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
          </button>

          <button
            onClick={() => setActiveView('telemetry')}
            className="btn-secondary"
            style={{ 
              padding: '9px', 
              borderRadius: 'var(--radius-sm)', 
              background: activeView === 'telemetry' ? 'var(--bg-hover)' : 'transparent',
              borderColor: activeView === 'telemetry' ? 'var(--border-strong)' : 'transparent' 
            }}
            title="Telemetry Dashboard"
          >
            <Cpu size={17} style={{ color: activeView === 'telemetry' ? 'var(--accent-emerald)' : 'var(--text-muted)' }} />
          </button>

          <button
            onClick={() => setActiveView('files')}
            className="btn-secondary"
            style={{ 
              padding: '9px', 
              borderRadius: 'var(--radius-sm)', 
              background: activeView === 'files' ? 'var(--bg-hover)' : 'transparent',
              borderColor: activeView === 'files' ? 'var(--border-strong)' : 'transparent' 
            }}
            title="File Explorer"
          >
            <Folder size={17} style={{ color: activeView === 'files' ? 'var(--accent-amber)' : 'var(--text-muted)' }} />
          </button>

          <button
            onClick={() => setActiveView('team')}
            className="btn-secondary"
            style={{ 
              padding: '9px', 
              borderRadius: 'var(--radius-sm)', 
              background: activeView === 'team' ? 'var(--bg-hover)' : 'transparent',
              borderColor: activeView === 'team' ? 'var(--border-strong)' : 'transparent' 
            }}
            title="Our Group"
          >
            <Users size={17} style={{ color: activeView === 'team' ? 'var(--accent-emerald)' : 'var(--text-muted)' }} />
          </button>
        </nav>

        {/* Footer Utilities Rail */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button
            onClick={onOpenTerminal}
            className="btn-secondary"
            style={{ padding: '8px', borderRadius: 'var(--radius-sm)' }}
            title="Terminal Sandbox"
          >
            <Terminal size={16} />
          </button>

          <button
            onClick={onOpenCalculator}
            className="btn-secondary"
            style={{ padding: '8px', borderRadius: 'var(--radius-sm)' }}
            title="Calculator"
          >
            <Calculator size={16} />
          </button>

          <button
            onClick={onOpenSettings}
            className="btn-secondary"
            style={{ padding: '8px', borderRadius: 'var(--radius-sm)' }}
            title="System Settings"
          >
            <Settings size={16} />
          </button>

          <button
            onClick={toggleTheme}
            className="btn-secondary"
            style={{ padding: '8px', borderRadius: 'var(--radius-sm)' }}
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </aside>
    );
  }

  // Full Expanded Sidebar View
  return (
    <aside className={`app-sidebar ${isMobileOpen ? 'open' : ''}`} style={{
      width: '260px',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '14px',
      gap: '12px',
      userSelect: 'none'
    }}>
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <img
            src="/sagw-ai-logo.png"
            alt="SAGW AI Logo"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              objectFit: 'cover',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div className="sagw-brand-title" style={{ fontSize: '0.96rem' }}>
                <span className="sagw-word">SAGW</span>
                <span className="ai-word">AI</span>
              </div>
              <span style={{ 
                fontSize: '0.62rem', 
                fontWeight: 700, 
                padding: '1px 5px', 
                borderRadius: 'var(--radius-xs)', 
                background: 'rgba(56, 189, 248, 0.12)', 
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                letterSpacing: '0.04em'
              }}>
                PRO
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '1px' }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isServerConnected ? 'var(--accent-emerald)' : 'var(--accent-red)'
              }} />
              {isServerConnected ? 'Connected' : 'Offline'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          {/* Collapse Sidebar Button */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="btn-secondary"
              style={{ padding: '6px', borderRadius: 'var(--radius-sm)' }}
              title="Collapse Sidebar"
            >
              <PanelLeftClose size={15} />
            </button>
          )}

          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="btn-secondary"
            style={{ padding: '6px', borderRadius: 'var(--radius-sm)' }}
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? <Sun size={15} style={{ color: 'var(--accent-amber)' }} /> : <Moon size={15} style={{ color: 'var(--accent-purple)' }} />}
          </button>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="btn-secondary mobile-menu-btn"
              style={{ padding: '6px', borderRadius: 'var(--radius-sm)', display: 'none' }}
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* New Conversation Button */}
      <button 
        onClick={() => {
          createNewSession();
          if (onCloseMobile) onCloseMobile();
        }}
        className="btn-primary"
        style={{ width: '100%', justifyContent: 'center', padding: '9px 14px' }}
      >
        <Plus size={16} /> New Session
      </button>

      {/* AUTH & ADMIN DASHBOARD BAR */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {currentUser && (currentUser.isAdmin || currentUser.role === 'ADMIN' || (currentUser.email && currentUser.email.toLowerCase() === 'karthikhruth@gmail.com')) && (
          <button
            onClick={() => {
              onOpenAdmin();
              if (onCloseMobile) onCloseMobile();
            }}
            className="btn-secondary"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent-primary)',
              borderColor: 'var(--accent-primary)',
              background: 'var(--accent-primary-subtle)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Shield size={14} /> Admin Control Center
          </button>
        )}

        <button
          onClick={() => {
            onOpenAuth();
            if (onCloseMobile) onCloseMobile();
          }}
          className="btn-secondary"
          style={{
            width: '100%',
            padding: '7px 10px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <Users size={13} style={{ color: 'var(--accent-primary)' }} />
            {currentUser ? currentUser.name : "Sign In / Register"}
          </span>
          <span style={{ 
            fontSize: '0.68rem', 
            color: 'var(--text-dim)', 
            background: 'var(--bg-hover)', 
            padding: '2px 5px', 
            borderRadius: 'var(--radius-xs)' 
          }}>
            {currentUser ? (currentUser.isAdmin ? "Admin" : "30d Trial") : "Account"}
          </span>
        </button>
      </div>

      {/* Conversation Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        background: 'var(--bg-input)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        padding: '6px 9px'
      }}>
        <Search size={13} color="var(--text-dim)" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search chats..."
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-main)',
            fontSize: '0.8rem',
            width: '100%',
            fontFamily: 'var(--font-body)'
          }}
        />
      </div>

      {/* ACTION CONTROLS: #1 VIEW SELECTOR & #2 SYSTEM UTILITIES */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        
        {/* #1: Unified View Selector (Single Button with Slide-down Menu) */}
        <div ref={viewMenuRef} style={{ position: 'relative', width: '100%' }}>
          <button
            onClick={() => {
              setIsViewMenuOpen(prev => !prev);
              setIsUtilitiesOpen(false);
            }}
            className="btn-secondary"
            style={{ 
              width: '100%', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between', 
              padding: '8px 10px',
              background: isViewMenuOpen ? 'var(--bg-hover)' : 'var(--bg-card, rgba(255, 255, 255, 0.03))',
              border: `1px solid ${isViewMenuOpen ? 'var(--accent-primary)' : 'var(--border-strong)'}`,
              color: 'var(--text-main)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Switch Workspace View"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
              <CurrentViewIcon size={15} style={{ color: currentViewOption.color, flexShrink: 0 }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentViewOption.label}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
              <span style={{ 
                fontSize: '0.62rem', 
                padding: '1px 5px', 
                borderRadius: 'var(--radius-xs)', 
                background: 'rgba(56, 189, 248, 0.1)', 
                color: 'var(--accent-primary)',
                fontWeight: 600,
                border: '1px solid rgba(56, 189, 248, 0.2)'
              }}>
                Views
              </span>
              <ChevronDown 
                size={13} 
                style={{ 
                  color: 'var(--text-dim)', 
                  transform: isViewMenuOpen ? 'rotate(180deg)' : 'none', 
                  transition: 'transform 0.2s ease' 
                }} 
              />
            </div>
          </button>

          {/* Slide-down Menu for #1 */}
          {isViewMenuOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              zIndex: 60,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              padding: '4px',
              boxShadow: '0 12px 28px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(16px)',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              animation: 'slideDownMenu 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
              {viewOptions.map(item => {
                const ItemIcon = item.icon;
                const isSelected = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveView(item.id);
                      setIsViewMenuOpen(false);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    className="btn-secondary"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 9px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'var(--bg-hover)' : 'transparent',
                      border: `1px solid ${isSelected ? 'var(--border-strong)' : 'transparent'}`,
                      color: isSelected ? 'var(--text-main)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.12s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ItemIcon size={14} style={{ color: item.color, flexShrink: 0 }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: isSelected ? 600 : 500 }}>
                          {item.label}
                        </span>
                        <span style={{ fontSize: '0.66rem', color: 'var(--text-dim)' }}>
                          {item.desc}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <Check size={13} style={{ color: item.color, flexShrink: 0 }} />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* #2: Unified System Utilities (Single Button with Slide-down Panel) */}
        <div ref={utilitiesRef} style={{ position: 'relative', width: '100%' }}>
          <button
            onClick={() => {
              setIsUtilitiesOpen(prev => !prev);
              setIsViewMenuOpen(false);
            }}
            className="btn-secondary"
            style={{ 
              width: '100%', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between', 
              padding: '8px 10px',
              background: isUtilitiesOpen ? 'var(--bg-hover)' : 'var(--bg-card, rgba(255, 255, 255, 0.03))',
              border: `1px solid ${isUtilitiesOpen ? 'var(--accent-amber)' : 'var(--border-subtle)'}`,
              color: 'var(--text-main)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Open System Utilities"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wrench size={14} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                System Utilities
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
              <span style={{ 
                fontSize: '0.62rem', 
                padding: '1px 5px', 
                borderRadius: 'var(--radius-xs)', 
                background: 'rgba(245, 158, 11, 0.1)', 
                color: 'var(--accent-amber)',
                fontWeight: 600,
                border: '1px solid rgba(245, 158, 11, 0.2)'
              }}>
                3 tools
              </span>
              <ChevronDown 
                size={13} 
                style={{ 
                  color: 'var(--text-dim)', 
                  transform: isUtilitiesOpen ? 'rotate(180deg)' : 'none', 
                  transition: 'transform 0.2s ease' 
                }} 
              />
            </div>
          </button>

          {/* Slide-down Panel for #2 */}
          {isUtilitiesOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              zIndex: 55,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              padding: '4px',
              boxShadow: '0 12px 28px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(16px)',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              animation: 'slideDownMenu 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
              <button
                onClick={() => {
                  onOpenTerminal();
                  setIsUtilitiesOpen(false);
                  if (onCloseMobile) onCloseMobile();
                }}
                className="btn-secondary"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 9px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid transparent',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Terminal size={14} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Terminal Sandbox</span>
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-dim)' }}>Interactive CLI environment</span>
                </div>
              </button>

              <button
                onClick={() => {
                  onOpenCalculator();
                  setIsUtilitiesOpen(false);
                  if (onCloseMobile) onCloseMobile();
                }}
                className="btn-secondary"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 9px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid transparent',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Calculator size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Calculator</span>
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-dim)' }}>Scientific computations</span>
                </div>
              </button>

              <button
                onClick={() => {
                  onOpenSettings();
                  setIsUtilitiesOpen(false);
                  if (onCloseMobile) onCloseMobile();
                }}
                className="btn-secondary"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 9px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid transparent',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Settings size={14} style={{ color: 'var(--accent-purple)', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>System Settings</span>
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-dim)' }}>Preferences & API config</span>
                </div>
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Chat History List with Pinning & Time Grouping */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {/* Pinned Chats */}
        {pinnedSessions.length > 0 && (
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Pin size={11} /> Pinned
            </div>
            {pinnedSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => {
                  setActiveSessionId(session.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                style={{
                  padding: '6px 9px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  background: activeSessionId === session.id ? 'var(--bg-hover)' : 'transparent',
                  border: activeSessionId === session.id ? '1px solid var(--border-strong)' : '1px solid transparent',
                  color: activeSessionId === session.id ? 'var(--text-main)' : 'var(--text-muted)',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '2px'
                }}
              >
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {session.title || 'Untitled Conversation'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <button
                    onClick={(e) => togglePinSession(e, session.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '2px' }}
                    title="Unpin Conversation"
                  >
                    <PinOff size={12} />
                  </button>
                  {deleteSession && (
                    <button
                      onClick={(e) => deleteSession(e, session.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '2px' }}
                      title="Delete Session"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Today's Conversations */}
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={11} /> Recent ({todaySessions.length})
          </div>
          {todaySessions.map((session) => (
            <div
              key={session.id}
              onClick={() => {
                setActiveSessionId(session.id);
                if (onCloseMobile) onCloseMobile();
              }}
              style={{
                padding: '6px 9px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                background: activeSessionId === session.id ? 'var(--bg-hover)' : 'transparent',
                border: activeSessionId === session.id ? '1px solid var(--border-strong)' : '1px solid transparent',
                color: activeSessionId === session.id ? 'var(--text-main)' : 'var(--text-muted)',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '2px'
              }}
            >
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, marginRight: '6px' }}>
                {session.title || 'Untitled Conversation'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <button
                  onClick={(e) => togglePinSession(e, session.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '2px' }}
                  title="Pin Conversation"
                >
                  <Pin size={12} />
                </button>
                {deleteSession && (
                  <button
                    onClick={(e) => deleteSession(e, session.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '2px' }}
                    title="Delete Session"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Older Conversations */}
        {olderSessions.length > 0 && (
          <div style={{ marginTop: '4px' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
              Previous ({olderSessions.length})
            </div>
            {olderSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => {
                  setActiveSessionId(session.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                style={{
                  padding: '6px 9px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  background: activeSessionId === session.id ? 'var(--bg-hover)' : 'transparent',
                  border: activeSessionId === session.id ? '1px solid var(--border-strong)' : '1px solid transparent',
                  color: activeSessionId === session.id ? 'var(--text-main)' : 'var(--text-muted)',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '2px'
                }}
              >
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, marginRight: '6px' }}>
                  {session.title || 'Untitled Conversation'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <button
                    onClick={(e) => togglePinSession(e, session.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '2px' }}
                    title="Pin Conversation"
                  >
                    <Pin size={12} />
                  </button>
                  {deleteSession && (
                    <button
                      onClick={(e) => deleteSession(e, session.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '2px' }}
                      title="Delete Session"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info & Purge Button */}
      <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        
        {currentUser && onLogout && (
          <button
            onClick={onLogout}
            className="btn-secondary"
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent-red)',
              fontSize: '0.76rem',
              fontWeight: 500,
              cursor: 'pointer',
              justifyContent: 'center'
            }}
            title="Sign Out"
          >
            Sign Out
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-dim)' }}>
          <span>Active Persona:</span>
          <span style={{ color: 'var(--text-main)', fontWeight: 500, textTransform: 'capitalize' }}>{persona}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-dim)' }}>
          <span>Device:</span>
          <span style={{
            color: 'var(--text-muted)',
            fontWeight: 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {isMobile ? <Smartphone size={11} /> : <Laptop size={11} />}
            {deviceLabel || (isMobile ? "Mobile" : "Desktop")}
          </span>
        </div>
        <button
          onClick={clearHistory}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-dim)',
            fontSize: '0.74rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '2px 0'
          }}
        >
          <Trash2 size={12} /> Clear Conversations
        </button>
      </div>
    </aside>
  );
}
