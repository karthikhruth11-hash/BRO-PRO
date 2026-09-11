import React, { useState } from 'react';
import { Mic, Play, Pause, RefreshCw, Volume2, Radio, CheckCircle2 } from 'lucide-react';
import { speechEngine } from '../services/speech';

export default function CustomVoiceStudio() {
  const [pitch, setPitch] = useState(1.0);
  const [rate, setRate] = useState(1.0);
  const [voiceName, setVoiceName] = useState('Jarvis Cybernetic');
  const [sampleText, setSampleText] = useState('All systems nominal, Boss. I am ready to process your instructions.');
  const [isPlaying, setIsPlaying] = useState(false);

  const handleTestSpeech = () => {
    setIsPlaying(true);
    speechEngine.speak(sampleText, () => setIsPlaying(false));
  };

  return (
    <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
      <div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-main, #f8fafc)' }}>
          Voice Clone & Synthesis Studio
        </h2>
        <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.82rem', margin: 0 }}>
          Customize acoustic tone, playback velocity, and custom synthesized voices for spoken assistant replies.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Controls Card */}
        <div style={{ background: 'var(--bg-card, #131b2e)', border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Radio size={16} color="var(--accent-primary, #3b82f6)" />
            </div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-main, #f8fafc)' }}>Synthesis Parameters</h3>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.3px', display: 'block', marginBottom: '6px' }}>
              Selected Voice Profile
            </label>
            <select
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-input, rgba(0,0,0,0.3))',
                border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
                color: 'var(--text-main, #f8fafc)',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            >
              <option value="Jarvis Cybernetic">J.A.R.V.I.S. Tactical (Default)</option>
              <option value="Luna Warm Companion">Luna Companion (Warm Female Tone)</option>
              <option value="Harvey Counsel">Harvey Counsel (Deep Authoritative)</option>
              <option value="Atlas Architect">Atlas Polyglot (Crisp Analytical)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #cbd5e1)', display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Pitch Modulation</span>
              <span style={{ fontWeight: 600, color: 'var(--accent-primary, #3b82f6)' }}>{pitch}x</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-primary, #3b82f6)', cursor: 'pointer' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary, #cbd5e1)', display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Speech Speed Rate</span>
              <span style={{ fontWeight: 600, color: 'var(--accent-primary, #3b82f6)' }}>{rate}x</span>
            </label>
            <input
              type="range"
              min="0.7"
              max="1.6"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-primary, #3b82f6)', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Live Audio Preview Card */}
        <div style={{ background: 'var(--bg-card, #131b2e)', border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Volume2 size={16} color="var(--accent-primary, #3b82f6)" />
            </div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-main, #f8fafc)' }}>Live Voice Preview</h3>
          </div>

          <textarea
            value={sampleText}
            onChange={(e) => setSampleText(e.target.value)}
            rows={4}
            style={{
              width: '100%',
              background: 'var(--bg-input, rgba(0,0,0,0.3))',
              border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
              borderRadius: '8px',
              padding: '12px',
              color: 'var(--text-main, #f8fafc)',
              outline: 'none',
              fontFamily: 'inherit',
              fontSize: '0.85rem',
              resize: 'none',
              boxSizing: 'border-box'
            }}
          />

          <button
            onClick={handleTestSpeech}
            className="btn-primary"
            disabled={isPlaying}
            style={{ padding: '11px', justifyContent: 'center', fontSize: '0.88rem', fontWeight: 600, opacity: isPlaying ? 0.7 : 1 }}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            {isPlaying ? 'Synthesizing Audio...' : 'Play Sample Voice'}
          </button>
        </div>
      </div>
    </div>
  );
}
