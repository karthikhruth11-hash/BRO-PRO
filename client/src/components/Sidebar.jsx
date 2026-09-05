import React, { useState } from 'react';
import { 
  MessageSquare, 
  Cpu, 
  Folder, 
  Mic, 
  Sliders, 
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
  Brain,
  Shield
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
  onLogout
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [pinnedSessionIds, setPinnedSessionIds] = useState([]);

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

  // Categorize Sessions into Today, Yesterday, Older
  const todaySessions = recentSessions.slice(0, 3);
  const olderSessions = recentSessions.slice(3);

  // Slim Icon Rail Collapsed Mode
  if (isCollapsed && !isMobileOpen) {
    return (
      <aside style={{
        width: '64px',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: '100%',
        padding: '16px 8px',
        gap: '16px',
        userSelect: 'none'
      }}>
        {/* Toggle Expand Button */}
        <button
          onClick={onToggleCollapse}
          className="btn-secondary"
          style={{ padding: '8px', borderRadius: '10px' }}
          title="Expand Sidebar"
        >
          <PanelLeftOpen size={18} color="var(--accent-cyan)" />
        </button>

        {/* New Session Button */}
        <button
          onClick={createNewSession}
          className="btn-primary"
          style={{ padding: '10px', borderRadius: '10px', width: '42px', height: '42px', justifyContent: 'center' }}
          title="New Session"
        >
          <Plus size={18} />
        </button>

        {/* Vertical Icon Rail Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          <button
            onClick={() => setActiveView('chat')}
            className={`btn-secondary ${activeView === 'chat' ? 'glass-panel-glow' : ''}`}
            style={{ padding: '10px', borderRadius: '10px', border: activeView === 'chat' ? '1px solid var(--accent-cyan)' : '1px solid transparent' }}
            title="Chat Canvas"
          >
            <MessageSquare size={18} color="var(--accent-cyan)" />
          </button>

          <button
            onClick={() => setActiveView('telemetry')}
            className={`btn-secondary ${activeView === 'telemetry' ? 'glass-panel-glow' : ''}`}
            style={{ padding: '10px', borderRadius: '10px', border: activeView === 'telemetry' ? '1px solid var(--accent-cyan)' : '1px solid transparent' }}
            title="Telemetry Dashboard"
          >
            <Cpu size={18} color="var(--accent-emerald)" />
          </button>

          <button
            onClick={() => setActiveView('files')}
            className={`btn-secondary ${activeView === 'files' ? 'glass-panel-glow' : ''}`}
            style={{ padding: '10px', borderRadius: '10px', border: activeView === 'files' ? '1px solid var(--accent-cyan)' : '1px solid transparent' }}
            title="File Explorer"
          >
            <Folder size={18} color="var(--accent-amber)" />
          </button>

          <button
            onClick={() => setActiveView('voiceStudio')}
            className={`btn-secondary ${activeView === 'voiceStudio' ? 'glass-panel-glow' : ''}`}
            style={{ padding: '10px', borderRadius: '10px', border: activeView === 'voiceStudio' ? '1px solid var(--accent-cyan)' : '1px solid transparent' }}
            title="Voice Clone Studio"
          >
            <Mic size={18} color="var(--accent-pink)" />
          </button>
        </nav>

        {/* Footer Utilities Rail */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={toggleTheme}
            className="btn-secondary"
            style={{ padding: '10px', borderRadius: '10px' }}
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? <Sun size={18} color="var(--accent-amber)" /> : <Moon size={18} color="var(--accent-purple)" />}
          </button>

          <button
            onClick={onOpenSettings}
            className="btn-secondary"
            style={{ padding: '10px', borderRadius: '10px' }}
            title="System Settings"
          >
            <Settings size={18} color="var(--accent-cyan)" />
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
      padding: '16px',
      gap: '14px',
      userSelect: 'none'
    }}>
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #00f0ff 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(0,240,255,0.4)'
          }}>
            <Bot size={20} color="#000" />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, letterSpacing: '0.5px' }}>
              BRO AI <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>PRO</span>
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isServerConnected ? 'var(--accent-emerald)' : 'var(--accent-pink)',
                boxShadow: isServerConnected ? '0 0 8px #10b981' : 'none'
              }} />
              {isServerConnected ? 'Backend Bound' : 'Offline'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Collapse Sidebar Button */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="btn-secondary"
              style={{ padding: '6px', borderRadius: '8px' }}
              title="Collapse Sidebar"
            >
              <PanelLeftClose size={16} />
            </button>
          )}

          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="btn-secondary"
            style={{ padding: '6px', borderRadius: '8px' }}
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? <Sun size={16} color="var(--accent-amber)" /> : <Moon size={16} color="var(--accent-purple)" />}
          </button>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="btn-secondary mobile-menu-btn"
              style={{ padding: '6px', borderRadius: '8px', display: 'none' }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* New Conversation Button */}
      <button 
        onClick={createNewSession}
        className="btn-primary"
        style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
      >
        <Plus size={18} /> New Session
      </button>

      {/* PROMINENT AUTH & ADMIN DASHBOARD BAR */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {currentUser && (currentUser.isAdmin || currentUser.role === 'ADMIN' || (currentUser.email && currentUser.email.toLowerCase() === 'karthikhruth@gmail.com')) && (
          <button
            onClick={onOpenAdmin}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.25) 0%, rgba(112, 0, 255, 0.25) 100%)',
              border: '1px solid #00f0ff',
              color: '#00f0ff',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)'
            }}
          >
            <Shield size={16} /> Admin Control Center
          </button>
        )}

        <button
          onClick={onOpenAuth}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '10px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-glow)',
            color: 'var(--text-main)',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={14} color="var(--accent-cyan)" />
            {currentUser ? currentUser.name : "Sign In / Register"}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', background: 'rgba(0,240,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
            {currentUser ? (currentUser.isAdmin ? "Admin" : "30-Day Trial") : "Auth Module"}
          </span>
        </button>
      </div>

      {/* Conversation Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'var(--bg-input)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '8px',
        padding: '6px 10px'
      }}>
        <Search size={14} color="var(--text-muted)" />
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
            fontSize: '0.82rem',
            width: '100%'
          }}
        />
      </div>

      {/* Main Navigation Items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <button
          onClick={() => setActiveView('chat')}
          className={`btn-secondary ${activeView === 'chat' ? 'glass-panel-glow' : ''}`}
          style={{ width: '100%', justifyContent: 'flex-start', border: activeView === 'chat' ? '1px solid var(--accent-cyan)' : '1px solid transparent' }}
        >
          <MessageSquare size={16} color="var(--accent-cyan)" /> AI Chat Canvas
        </button>

        <button
          onClick={() => setActiveView('team')}
          className={`btn-secondary ${activeView === 'team' ? 'glass-panel-glow' : ''}`}
          style={{ width: '100%', justifyContent: 'flex-start', border: activeView === 'team' ? '1px solid var(--accent-cyan)' : '1px solid transparent' }}
        >
          <Users size={16} color="var(--accent-emerald)" /> Our Group
        </button>

        <button
          onClick={() => setActiveView('files')}
          className={`btn-secondary ${activeView === 'files' ? 'glass-panel-glow' : ''}`}
          style={{ width: '100%', justifyContent: 'flex-start', border: activeView === 'files' ? '1px solid var(--accent-cyan)' : '1px solid transparent' }}
        >
          <Folder size={16} color="var(--accent-amber)" /> File Explorer
        </button>

        <button
          onClick={() => setActiveView('telemetry')}
          className={`btn-secondary ${activeView === 'telemetry' ? 'glass-panel-glow' : ''}`}
          style={{ width: '100%', justifyContent: 'flex-start', border: activeView === 'telemetry' ? '1px solid var(--accent-cyan)' : '1px solid transparent' }}
        >
          <Cpu size={16} color="var(--accent-purple)" /> Telemetry & System
        </button>
      </nav>

      {/* Quick Utilities Section */}
      <div style={{ marginTop: '2px', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Utilities
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button 
            onClick={onOpenTerminal} 
            className="btn-secondary" 
            style={{ flex: 1, padding: '6px', justifyContent: 'center' }}
            title="Launch Terminal"
          >
            <Terminal size={15} color="var(--accent-cyan)" />
          </button>
          <button 
            onClick={onOpenCalculator} 
            className="btn-secondary" 
            style={{ flex: 1, padding: '6px', justifyContent: 'center' }}
            title="Launch Calculator"
          >
            <Calculator size={15} color="var(--accent-purple)" />
          </button>
          <button 
            onClick={onOpenSettings} 
            className="btn-secondary" 
            style={{ flex: 1, padding: '6px', justifyContent: 'center' }}
            title="System Settings"
          >
            <Settings size={15} color="var(--accent-amber)" />
          </button>
        </div>
      </div>

      {/* Chat History List with Pinning & Time Grouping */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}>
        {/* Pinned Chats */}
        {pinnedSessions.length > 0 && (
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Pin size={12} /> Pinned Conversations
            </div>
            {pinnedSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => {
                  setActiveSessionId(session.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                style={{
                  padding: '7px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: activeSessionId === session.id ? 'rgba(0,240,255,0.1)' : 'var(--bg-card)',
                  borderLeft: activeSessionId === session.id ? '3px solid var(--accent-cyan)' : '3px solid transparent',
                  color: activeSessionId === session.id ? 'var(--text-main)' : 'var(--text-muted)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '3px'
                }}
              >
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {session.title || 'Untitled Conversation'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    onClick={(e) => togglePinSession(e, session.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer' }}
                    title="Unpin Conversation"
                  >
                    <PinOff size={12} />
                  </button>
                  {deleteSession && (
                    <button
                      onClick={(e) => deleteSession(e, session.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-pink)', cursor: 'pointer' }}
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
          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> Today ({todaySessions.length})
          </div>
          {todaySessions.map((session) => (
            <div
              key={session.id}
              onClick={() => {
                setActiveSessionId(session.id);
                if (onCloseMobile) onCloseMobile();
              }}
              style={{
                padding: '7px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                background: activeSessionId === session.id ? 'rgba(0,240,255,0.1)' : 'transparent',
                borderLeft: activeSessionId === session.id ? '3px solid var(--accent-cyan)' : '3px solid transparent',
                color: activeSessionId === session.id ? 'var(--text-main)' : 'var(--text-muted)',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '2px'
              }}
            >
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, marginRight: '6px' }}>
                {session.title || 'Untitled Conversation'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  onClick={(e) => togglePinSession(e, session.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                  title="Pin Conversation"
                >
                  <Pin size={12} />
                </button>
                {deleteSession && (
                  <button
                    onClick={(e) => deleteSession(e, session.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
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
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
              Previous 7 Days ({olderSessions.length})
            </div>
            {olderSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => {
                  setActiveSessionId(session.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                style={{
                  padding: '7px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: activeSessionId === session.id ? 'rgba(0,240,255,0.1)' : 'transparent',
                  borderLeft: activeSessionId === session.id ? '3px solid var(--accent-cyan)' : '3px solid transparent',
                  color: activeSessionId === session.id ? 'var(--text-main)' : 'var(--text-muted)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '2px'
                }}
              >
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, marginRight: '6px' }}>
                  {session.title || 'Untitled Conversation'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    onClick={(e) => togglePinSession(e, session.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                    title="Pin Conversation"
                  >
                    <Pin size={12} />
                  </button>
                  {deleteSession && (
                    <button
                      onClick={(e) => deleteSession(e, session.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
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

      {/* Clear History & Persona Badge */}
      <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        
        {/* User Account / Auth Module Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={onOpenAuth}
            style={{
              flex: 1,
              padding: '7px 10px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser ? currentUser.name : "Sign In / Register"}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', marginLeft: '4px' }}>{currentUser ? (currentUser.isAdmin ? "Admin" : "30-Day Trial") : "Auth"}</span>
          </button>
          {currentUser && onLogout && (
            <button
              onClick={onLogout}
              style={{
                padding: '7px 10px',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Sign Out"
            >
              Logout
            </button>
          )}
        </div>

        <div style={{ display: 'flex', itemsCenter: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <span>Active Persona:</span>
          <span style={{ color: 'var(--accent-cyan)', fontWeight: 600, textTransform: 'capitalize' }}>{persona}</span>
        </div>
        <button
          onClick={clearHistory}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-dim)',
            fontSize: '0.78rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '2px 0'
          }}
        >
          <Trash2 size={13} /> Purge Chat History
        </button>
      </div>
    </aside>
  );
}
