import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Zap, Database, RefreshCw, Trash2, Brain } from 'lucide-react';
import { fetchTelemetry, fetchMemoryFacts, deleteMemoryFact, clearMemoryFacts } from '../services/apiClient';

export default function TelemetryPanel() {
  const [telemetryData, setTelemetryData] = useState(null);
  const [memoryFacts, setMemoryFacts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAllMetrics = async () => {
    setLoading(true);
    const tRes = await fetchTelemetry();
    if (tRes.success) setTelemetryData(tRes);

    const mRes = await fetchMemoryFacts();
    if (mRes.success) setMemoryFacts(mRes.facts);
    setLoading(false);
  };

  useEffect(() => {
    loadAllMetrics();
    const interval = setInterval(loadAllMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDeleteFact = async (id) => {
    await deleteMemoryFact(id);
    setMemoryFacts(memoryFacts.filter(f => f.id !== id));
  };

  const handlePurgeMemory = async () => {
    await clearMemoryFacts();
    setMemoryFacts([]);
  };

  const sys = telemetryData?.system;
  const ai = telemetryData?.aiUsage;

  return (
    <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-display)' }} className="cyan-gradient-text">
            Telemetry & Memory Observability
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Real-time CPU/RAM hardware stats, provider gateway token metrics, and long-term memory graph.
          </p>
        </div>
        <button className="btn-secondary" onClick={loadAllMetrics} style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
          <RefreshCw size={14} className={loading ? 'pulse-glow' : ''} /> Refresh
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {/* CPU Box */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>
            <Cpu size={16} color="var(--accent-cyan)" /> CPU Architecture
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
            {sys ? `${sys.cpuCores} Cores` : '8 Cores'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            {sys ? sys.cpuModel.slice(0, 24) : 'Intel Core i7 Processor'}
          </div>
        </div>

        {/* RAM Box */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>
            <HardDrive size={16} color="var(--accent-emerald)" /> System RAM
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
            {sys ? `${sys.memory.usedMB} MB / ${sys.memory.totalMB} MB` : '8192 MB / 16384 MB'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            {sys ? `${sys.memory.percentUsed}% Utilization` : '48% Utilization'}
          </div>
        </div>

        {/* AI Requests Box */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>
            <Zap size={16} color="var(--accent-amber)" /> AI Gateway Hits
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
            {ai ? ai.totalRequests : 0} Total Requests
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Cache Hits: {ai ? ai.cacheHits : 0}
          </div>
        </div>

        {/* Est. Tokens Box */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>
            <Database size={16} color="var(--accent-purple)" /> Tokens Processed
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-purple)' }}>
            {ai ? ai.estimatedTokensUsed : 0} Tokens
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Cache Size: {ai ? ai.cacheSize : 0} entries
          </div>
        </div>
      </div>

      {/* Memory Graph Section */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Brain size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>
              Long-Term Fact Knowledge Graph ({memoryFacts.length})
            </h3>
          </div>

          {memoryFacts.length > 0 && (
            <button
              onClick={handlePurgeMemory}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: 'var(--accent-pink)' }}
            >
              <Trash2 size={14} color="var(--accent-pink)" /> Forget All Facts
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {memoryFacts.length === 0 ? (
            <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', padding: '12px' }}>
              No extracted long-term facts stored yet. Say "my name is Alex" or "i prefer python" in chat!
            </div>
          ) : (
            memoryFacts.map((fact) => (
              <div
                key={fact.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(0, 240, 255, 0.15)', color: 'var(--accent-cyan)' }}>
                    {fact.tag}
                  </span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{fact.fact}</span>
                </div>
                <button
                  onClick={() => handleDeleteFact(fact.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                  title="Forget this fact"
                >
                  <Trash2 size={14} color="var(--accent-pink)" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
