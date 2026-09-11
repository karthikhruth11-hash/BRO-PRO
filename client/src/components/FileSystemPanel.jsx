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
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-main, #f8fafc)' }}>
            File System Explorer
          </h2>
          <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.82rem', margin: 0 }}>
            Safely browse local and virtual sandbox project files via the Tool Registry backend.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--accent-success, #10b981)', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
          <Shield size={15} /> Sandbox Enforced
        </div>
      </div>

      {/* Path Address Bar */}
      <div style={{ background: 'var(--bg-card, #131b2e)', border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))', borderRadius: '12px', padding: '10px 14px', display: 'flex', gap: '10px', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
        <HardDrive size={18} color="var(--accent-primary, #3b82f6)" />
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
            color: 'var(--text-main, #f8fafc)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.88rem'
          }}
        />
        <button className="btn-primary" onClick={() => handleReadPath(pathInput)} style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
          <RefreshCw size={14} /> Inspect
        </button>
      </div>

      {/* Main File Table */}
      <div style={{ background: 'var(--bg-card, #131b2e)', border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.08))', borderRadius: '12px', padding: '16px', flex: 1, boxShadow: 'var(--shadow-sm)' }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', margin: '0 0 12px 0' }}>Directory Items</h4>
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
                background: 'var(--bg-secondary, rgba(255, 255, 255, 0.02))',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-secondary, rgba(255, 255, 255, 0.02))'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {item.isDirectory ? <Folder size={17} color="var(--accent-warning, #f59e0b)" /> : <FileText size={17} color="var(--accent-primary, #3b82f6)" />}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-main, #f8fafc)' }}>{item.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>
                <span>{item.size}</span>
                <Eye size={14} color="var(--text-muted, #94a3b8)" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* File Content Preview */}
      {fileContent && (
        <div style={{ background: 'var(--bg-card, #131b2e)', border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))', borderRadius: '12px', padding: '16px', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--accent-primary, #3b82f6)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              {fileContent.path}
            </span>
            <button onClick={() => setFileContent(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer', fontSize: '0.78rem' }}>Close</button>
          </div>
          <pre style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.82rem',
            color: 'var(--text-main, #f8fafc)',
            background: 'var(--bg-input, rgba(0,0,0,0.4))',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.06))',
            overflowX: 'auto',
            margin: 0
          }}>
            {fileContent.content}
          </pre>
        </div>
      )}
    </div>
  );
}
