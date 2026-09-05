import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import PersonalitySelector from './components/PersonalitySelector';
import AgentTools from './components/AgentTools';
import ChatGPTConsole from './components/ChatGPTConsole';
import RightContextPanel from './components/RightContextPanel';
import TelemetryPanel from './components/TelemetryPanel';
import FileSystemPanel from './components/FileSystemPanel';
import TrainingPanel from './components/TrainingPanel';
import CustomVoiceStudio from './components/CustomVoiceStudio';
import TerminalModal from './components/TerminalModal';
import CalculatorModal from './components/CalculatorModal';
import SettingsModal from './components/SettingsModal';
import TeamSection from './components/TeamSection';
import { AuthModal } from './components/AuthModule/AuthModal';
import AuthPage from './components/AuthModule/AuthPage';
import { AdminDashboardModal } from './components/AuthModule/AdminDashboardModal';
import { AdminControlCenter } from './components/AuthModule/AdminControlCenter';
import { SubscriptionModal } from './components/AuthModule/SubscriptionModal';
import { sendChatMessage } from './services/apiClient';
import { streamChatResponse } from './services/streamingClient';
import { soundFx } from './services/soundFx';
import { speechEngine } from './services/speech';
import { parseCommandFlags } from './services/inputProcessor';

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem('wednesday_theme') || 'dark');
  const [activeView, setActiveView] = useState('chat');
  const [persona, setPersona] = useState('jarvis');
  const [selectedModel, setSelectedModel] = useState('Multi-LLM Ensemble');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  // New Auth & Admin Module States
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('wednesday_theme', theme);
  }, [theme]);

  // Check Auth Manager Session on Mount
  useEffect(() => {
    const checkAuthSession = async () => {
      const token = localStorage.getItem('bro_auth_token');
      if (!token) return;
      try {
        const res = await fetch('/api/auth-manager/me', {
          headers: { 'Authorization': `Bearer ${token}`, 'x-wednesday-token': 'wednesday-secret-local-handshake-token-2026' }
        });
        const data = await res.json();
        if (data.success && data.authenticated) {
          setCurrentUser(data.user);
          if (data.user && (data.user.isAdmin || data.user.role === 'ADMIN')) {
            // Admin gets instant access to chat view with unlimited access
            setActiveView('chat');
          }
          if (data.accessInfo && data.accessInfo.isExpired && !data.user.isAdmin) {
            setShowSubscriptionModal(true);
          } else if (data.trialInfo && data.trialInfo.isExpired && !data.user.isAdmin) {
            setShowSubscriptionModal(true);
          }
        }
      } catch (e) {
        console.warn("Auth session check failed:", e);
      }
    };
    checkAuthSession();
  }, []);

  // Heartbeat ping to server to maintain real-time "Currently Logged In" active status
  useEffect(() => {
    if (!currentUser) return;
    const sendHeartbeat = async () => {
      const token = localStorage.getItem('bro_auth_token');
      if (!token) return;
      try {
        await fetch('/api/auth-manager/heartbeat', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-wednesday-token': 'wednesday-secret-local-handshake-token-2026'
          }
        });
      } catch (e) {
        // silent heartbeat error
      }
    };
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 45000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleLogout = async () => {
    const token = localStorage.getItem('bro_auth_token');
    if (token) {
      try {
        await fetch('/api/auth-manager/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-wednesday-token': 'wednesday-secret-local-handshake-token-2026'
          }
        });
      } catch (e) {
        console.warn("Logout request error:", e);
      }
    }
    localStorage.removeItem('bro_auth_token');
    localStorage.removeItem('bro_guest_start');
    setCurrentUser(null);
    setShowAdminDashboard(false);
    setShowSubscriptionModal(false);
    setActiveView('chat');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('wednesday_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to load sessions from localStorage:", e);
    }
    return [{ id: 'session-1', title: 'Initial System Session', messages: [] }];
  });

  const [activeSessionId, setActiveSessionId] = useState(() => {
    try {
      const savedId = localStorage.getItem('wednesday_active_session_id');
      if (savedId) return savedId;
    } catch (e) {}
    return 'session-1';
  });

  useEffect(() => {
    try {
      localStorage.setItem('wednesday_sessions', JSON.stringify(sessions));
      localStorage.setItem('wednesday_active_session_id', activeSessionId);
    } catch (e) {
      console.error("Failed to save sessions to localStorage:", e);
    }
  }, [sessions, activeSessionId]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTool, setActiveTool] = useState(null);
  const [lastExecution, setLastExecution] = useState(null);
  const [activeEmotion, setActiveEmotion] = useState(null);
  const [isServerConnected, setIsServerConnected] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals
  const [showTerminal, setShowTerminal] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // 10-Minute Unregistered Guest Access Enforcement
  useEffect(() => {
    let guestStart = localStorage.getItem("bro_guest_start");
    if (!guestStart) {
      guestStart = Date.now().toString();
      localStorage.setItem("bro_guest_start", guestStart);
    }

    const interval = setInterval(() => {
      if (!currentUser) {
        const elapsedMs = Date.now() - parseInt(guestStart, 10);
        if (elapsedMs >= 10 * 60 * 1000) { // 10 minutes
          setActiveView("auth");
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession ? activeSession.messages : [];

  const updateSessionMessages = (newMessages, titleUpdate = null) => {
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          messages: newMessages,
          title: titleUpdate || s.title
        };
      }
      return s;
    }));
  };

  const handleSendMessage = async (text, autoSpeak = false) => {
    if (!text || isProcessing) return;

    // Check 10-Minute Unregistered Guest Limit
    if (!currentUser) {
      const guestStart = localStorage.getItem("bro_guest_start");
      if (guestStart) {
        const elapsedMs = Date.now() - parseInt(guestStart, 10);
        if (elapsedMs >= 10 * 60 * 1000) {
          alert("Your 10-Minute Unregistered Guest Trial has expired! Please register an account and enter the 6-digit OTP sent to your Mobile/Gmail to continue.");
          setActiveView("auth");
          return;
        }
      }
    }

    const flags = parseCommandFlags(text);
    const targetPersona = flags.persona || persona;
    const shouldSpeak = flags.speak || autoSpeak;
    const cleanPrompt = flags.rawText;

    const userMessage = { role: 'user', content: text, timestamp: new Date().toISOString() };
    const updatedMessages = [...messages, userMessage];
    
    let title = activeSession.title;
    if (messages.length === 0 || title === 'New Conversation' || title === 'Initial System Session') {
      title = cleanPrompt.slice(0, 26) + (cleanPrompt.length > 26 ? '...' : '');
    }

    updateSessionMessages(updatedMessages, title);
    setIsProcessing(true);

    // Initial placeholder message for streaming chunks
    let accumulatedText = "";
    const streamingAssistantMsg = {
      role: 'assistant',
      content: "",
      provider: selectedModel,
      timestamp: new Date().toISOString()
    };

    updateSessionMessages([...updatedMessages, streamingAssistantMsg], title);

    await streamChatResponse({
      message: cleanPrompt,
      conversationId: activeSessionId,
      persona: targetPersona,
      options: { model: selectedModel, userContext: currentUser },
      onChunk: (chunkText) => {
        accumulatedText += chunkText;
        updateSessionMessages(
          [...updatedMessages, { ...streamingAssistantMsg, content: accumulatedText }],
          title
        );
      },
      onDone: (data) => {
        setIsProcessing(false);
        soundFx.playReceive();
        if (shouldSpeak && accumulatedText) {
          speechEngine.speak(accumulatedText);
        }
      },
      onError: async (err) => {
        console.warn("Streaming failed, falling back to non-streaming endpoint:", err);
        const result = await sendChatMessage(cleanPrompt, targetPersona);
        setIsProcessing(false);
        soundFx.playReceive();
        updateSessionMessages(
          [...updatedMessages, { ...streamingAssistantMsg, content: result.response }],
          title
        );
        if (shouldSpeak && result.response) {
          speechEngine.speak(result.response);
        }
      }
    });
  };

  const createNewSession = () => {
    const newId = `session-${Date.now()}`;
    const newSession = { id: newId, title: 'New Conversation', messages: [] };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newId);
    setActiveView('chat');
  };

  const clearHistory = () => {
    setSessions([{ id: 'session-1', title: 'New Conversation', messages: [] }]);
    setActiveSessionId('session-1');
  };

  const deleteSession = (e, sessionId) => {
    if (e) e.stopPropagation();
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      if (filtered.length === 0) {
        const newId = `session-${Date.now()}`;
        setActiveSessionId(newId);
        return [{ id: newId, title: 'New Conversation', messages: [] }];
      }
      if (activeSessionId === sessionId) {
        setActiveSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleExportChat = () => {
    const chatText = messages.map(m => `### ${m.role.toUpperCase()} (${m.timestamp})\n${m.content}\n`).join('\n---\n\n');
    const blob = new Blob([chatText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bro-ai-chat-${activeSessionId}.md`;
    a.click();
  };

  if (activeView === 'admin') {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#070a12' }}>
        <AdminControlCenter onClose={() => setActiveView('chat')} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Panel 1: Left Navigation Sidebar */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        sessions={sessions}
        activeSessionId={activeSessionId}
        setActiveSessionId={setActiveSessionId}
        createNewSession={createNewSession}
        clearHistory={clearHistory}
        deleteSession={deleteSession}
        persona={persona}
        onOpenTerminal={() => setShowTerminal(true)}
        onOpenCalculator={() => setShowCalculator(true)}
        onOpenSettings={() => setShowSettings(true)}
        isServerConnected={isServerConnected}
        theme={theme}
        toggleTheme={toggleTheme}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        currentUser={currentUser}
        onOpenAuth={() => setActiveView('auth')}
        onOpenAdmin={() => setActiveView('admin')}
        onLogout={handleLogout}
      />

      {/* Panel 2: Main Workspace & Conversation Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Persona Selector Bar */}
        <PersonalitySelector activePersona={persona} onSelectPersona={setPersona} />

        {/* Registered Tool State Indicator */}
        {activeTool && <AgentTools activeTool={activeTool} />}

        {/* View Switcher */}
        {activeView === 'chat' && (
          <ChatGPTConsole
            messages={messages}
            onSendMessage={handleSendMessage}
            isProcessing={isProcessing}
            activeTool={activeTool}
            persona={persona}
            activeEmotion={activeEmotion}
            onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            onToggleRightPanel={() => setIsRightPanelOpen(!isRightPanelOpen)}
            currentUser={currentUser}
            onOpenAuth={() => setActiveView('auth')}
            onOpenAdmin={() => setActiveView('admin')}
            onLogout={handleLogout}
          />
        )}

        {activeView === 'team' && <TeamSection />}
        {activeView === 'telemetry' && <TelemetryPanel />}
        {activeView === 'files' && <FileSystemPanel />}
        {activeView === 'training' && <TrainingPanel />}
        {activeView === 'voiceStudio' && <CustomVoiceStudio />}

        {activeView === 'auth' && (
          <div style={{ flex: 1, width: '100%', height: '100%', overflowY: 'auto' }}>
            <AuthPage
              onAuthSuccess={(user, token) => {
                setCurrentUser(user);
                setActiveView('chat');
              }}
              onNavigateToApp={() => setActiveView('chat')}
            />
          </div>
        )}
      </div>

      {/* Panel 3: Right Context & AI Tools Panel */}
      {activeView === 'chat' && (
        <RightContextPanel
          isOpen={isRightPanelOpen}
          onClose={() => setIsRightPanelOpen(false)}
          selectedModel={selectedModel}
          messageCount={messages.length}
          tokensUsed={lastExecution?.tokensUsed}
          activeTopic={activeSession.title}
          onQuickToolClick={(toolId) => handleSendMessage(`Execute quick tool: ${toolId}`)}
          onExportChat={handleExportChat}
          onClearChat={clearHistory}
        />
      )}

      {/* Modals */}
      {showTerminal && <TerminalModal onClose={() => setShowTerminal(false)} />}
      {showCalculator && <CalculatorModal onClose={() => setShowCalculator(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {/* Isolated Auth & Admin Module Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={(user, token) => {
          setCurrentUser(user);
        }}
      />

      <AdminDashboardModal
        isOpen={showAdminDashboard}
        onClose={() => setShowAdminDashboard(false)}
      />

      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onSubscriptionSuccess={() => {
          if (currentUser) {
            setCurrentUser({ ...currentUser, subscriptionStatus: 'paid' });
          }
        }}
      />
    </div>
  );
}
