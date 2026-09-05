import React, { useState } from 'react';
import { Folder, FileText, ArrowLeft, RefreshCw, Eye, HardDrive, Shield } from 'lucide-react';

export default function FileSystemPanel() {
  const [currentPath, setCurrentPath] = useState('.');
  const [pathInput, setPathInput] = useState('.');
  const [fileContent, setFileContent] = useState(null);
  const [isReading, setIsReading] = useState(false);

  const virtualFiles = [
    { name: 'server/', isDirectory: true, size: '-' },
    { name: 'client/', isDirectory: true, size: '-' },
    { name: 'package.json', isDirectory: false, size: '482 B' },
    { name: 'README.md', isDirectory: false, size: '1.2 KB' },
    { name: 'BRO_AI_Blueprint.pdf', isDirectory: false, size: '240 KB' }
  ];

  const handleReadPath = (path) => {
    setIsReading(true);
    setCurrentPath(path);
    setPathInput(path);
    setTimeout(() => {
      setIsReading(false);
      setFileContent({
        path,
        content: `// Contents of ${path}\n{\n  "name": "wednesday-bro-ai-pro",\n  "version": "2.0.0",\n  "description": "Production-Grade AI Assistant Architecture",\n  "status": "online"\n}`
      });
    }, 500);
  };

  return (
    <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-display)' }} className="cyan-gradient-text">
            File System Explorer
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Safely browse local and virtual sandbox project files via the Tool Registry backend.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--accent-emerald)' }}>
          <Shield size={16} /> Sandbox Enforced
        </div>
      </div>

      {/* Path Address Bar */}
      <div className="glass-panel" style={{ padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <HardDrive size={18} color="var(--accent-cyan)" />
        <input
          type="text"
          value={pathInput}
          onChange={(e) => setPathInput(e.target.value)}
          placeholder="Enter file path..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#fff',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.9rem'
          }}
        />
        <button className="btn-primary" onClick={() => handleReadPath(pathInput)} style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
          <RefreshCw size={14} /> Inspect
        </button>
      </div>

      {/* Main File Table */}
      <div className="glass-panel" style={{ padding: '16px', flex: 1 }}>
        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Directory Items</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {virtualFiles.map((item, idx) => (
            <div
              key={idx}
              onClick={() => handleReadPath(item.name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 240, 255, 0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {item.isDirectory ? <Folder size={18} color="var(--accent-amber)" /> : <FileText size={18} color="var(--accent-cyan)" />}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem' }}>{item.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                <span>{item.size}</span>
                <Eye size={14} color="var(--text-muted)" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* File Content Preview */}
      {fileContent && (
        <div className="glass-panel-glow" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
              {fileContent.path}
            </span>
            <button onClick={() => setFileContent(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Close</button>
          </div>
          <pre style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            color: '#a7f3d0',
            background: 'rgba(0,0,0,0.5)',
            padding: '12px',
            borderRadius: '8px',
            overflowX: 'auto'
          }}>
            {fileContent.content}
          </pre>
        </div>
      )}
    </div>
  );
}
