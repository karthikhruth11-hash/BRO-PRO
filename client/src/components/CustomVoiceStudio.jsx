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
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-display)' }} className="gold-gradient-text">
          Voice Clone & Synthesis Studio
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Customize acoustic tone, playback velocity, and custom synthesized voices for spoken assistant replies.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Controls Card */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={18} color="var(--accent-amber)" /> Synthesis Parameters
          </h3>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Selected Voice Profile
            </label>
            <select
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                padding: '10px',
                borderRadius: '8px'
              }}
            >
              <option value="Jarvis Cybernetic">J.A.R.V.I.S. Tactical (Default)</option>
              <option value="Luna Warm Companion">Luna Companion (Warm Female Tone)</option>
              <option value="Harvey Counsel">Harvey Counsel (Deep Authoritative)</option>
              <option value="Atlas Architect">Atlas Polyglot (Crisp Analytical)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Pitch Modulation</span>
              <span>{pitch}x</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-amber)' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span>Speech Speed Rate</span>
              <span>{rate}x</span>
            </label>
            <input
              type="range"
              min="0.7"
              max="1.6"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-amber)' }}
            />
          </div>
        </div>

        {/* Live Audio Preview Card */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Volume2 size={18} color="var(--accent-cyan)" /> Live Voice Preview
          </h3>

          <textarea
            value={sampleText}
            onChange={(e) => setSampleText(e.target.value)}
            rows={4}
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '12px',
              color: '#fff',
              outline: 'none',
              fontFamily: 'var(--font-body)',
              resize: 'none'
            }}
          />

          <button
            onClick={handleTestSpeech}
            className="btn-primary"
            disabled={isPlaying}
            style={{ padding: '12px', justifyContent: 'center' }}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            {isPlaying ? 'Synthesizing Audio...' : 'Play Sample Voice'}
          </button>
        </div>
      </div>
    </div>
  );
}
