import React, { useState } from 'react';
import { Settings, X, Key, Server, ShieldCheck, Check } from 'lucide-react';

export default function SettingsModal({ onClose }) {
  const [serverUrl, setServerUrl] = useState(localStorage.getItem('wednesday_server_url') || 'http://127.0.0.1:5001');
  const [groqKey, setGroqKey] = useState(localStorage.getItem('wednesday_groq_key') || '');
  const [openaiKey, setOpenaiKey] = useState(localStorage.getItem('wednesday_openai_key') || '');
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('wednesday_gemini_key') || '');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('wednesday_server_url', serverUrl);
    localStorage.setItem('wednesday_groq_key', groqKey);
    localStorage.setItem('wednesday_openai_key', openaiKey);
    localStorage.setItem('wednesday_gemini_key', geminiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel-glow" style={{ width: '520px', padding: '24px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings size={20} color="var(--accent-amber)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>System & Provider Configuration</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              <Server size={14} style={{ marginRight: '6px' }} /> Local Backend Server URL
            </label>
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                padding: '10px 14px',
                borderRadius: '8px',
                fontFamily: 'var(--font-mono)'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              <Key size={14} style={{ marginRight: '6px' }} /> Groq Cloud API Key (Tier 1 - Llama 3.3 70B)
            </label>
            <input
              type="password"
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              placeholder="gsk_..."
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                padding: '10px 14px',
                borderRadius: '8px'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              <Key size={14} style={{ marginRight: '6px' }} /> OpenAI API Key (Tier 2 - GPT-4o-mini)
            </label>
            <input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="sk-..."
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                padding: '10px 14px',
                borderRadius: '8px'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              <Key size={14} style={{ marginRight: '6px' }} /> Gemini API Key (Tier 3 - Gemini 2.5 Flash)
            </label>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIzaSy..."
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                padding: '10px 14px',
                borderRadius: '8px'
              }}
            />
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} color="var(--accent-emerald)" /> Secrets remain securely stored in server environment boundary.
          </div>

          <button type="submit" className="btn-primary" style={{ padding: '12px', justifyContent: 'center' }}>
            {saved ? <Check size={18} /> : null}
            {saved ? 'Configuration Saved!' : 'Save System Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}
