import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  Sparkles, 
  Image as ImageIcon, 
  Copy, 
  Check, 
  BarChart2, 
  GitCommit, 
  Paperclip,
  Square,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  Menu,
  ChevronDown,
  PanelRight,
  Code,
  FileText,
  HelpCircle,
  Compass,
  Lightbulb,
  ExternalLink,
  Search,
  Globe,
  CheckCircle2,
  MessageSquare,
  Edit3,
  Download,
  FileSpreadsheet,
  Smartphone,
  Laptop,
  Bot,
  Shield,
  Users
} from 'lucide-react';
import { soundFx } from '../services/soundFx';
import { speechEngine } from '../services/speech';
import { personas } from './PersonalitySelector';

// Interactive WhatsApp Action Card Component Renderer
function RenderWhatsAppCard({ contact, messageText, onSendMessage }) {
  const [isSent, setIsSent] = useState(false);

  const handleSend = () => {
    soundFx.playSend();
    setIsSent(true);
    setTimeout(() => {
      onSendMessage(`[System Confirmation: WhatsApp Message successfully sent to ${contact}: "${messageText}"]`);
    }, 800);
  };

  return (
    <div style={{
      margin: '12px 0',
      padding: '14px 18px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '30px', height: '30px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MessageSquare size={16} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>WhatsApp Message Dispatcher</div>
          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>Recipient: <strong>{contact}</strong></div>
        </div>
      </div>

      <div style={{
        background: 'var(--bg-input)',
        padding: '10px 14px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-subtle)',
        fontSize: '0.88rem',
        color: 'var(--text-main)',
        lineHeight: '1.5'
      }}>
        "{messageText}"
      </div>

      {isSent ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-emerald)', fontSize: '0.84rem', fontWeight: 500, padding: '4px 0' }}>
          <CheckCircle2 size={15} /> Message Dispatched via WhatsApp Gateway
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
          <button
            onClick={handleSend}
            className="btn-primary"
            style={{
              padding: '7px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-emerald)',
              fontSize: '0.82rem'
            }}
          >
            <Send size={13} /> Send Message
          </button>

          <button
            onClick={() => onSendMessage(`Edit message for ${contact}`)}
            className="btn-secondary"
            style={{ padding: '7px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Edit3 size={13} /> Edit Message
          </button>
        </div>
      )}
    </div>
  );
}

// On-Demand Generated File Card Component Renderer (PDF, Word, Excel)
function RenderFileCard({ fileName, fileType, downloadUrl, fileSize, fileTitle }) {
  const isPdf = fileType === 'pdf';
  const isWord = fileType === 'word' || fileType === 'docx';
  const isExcel = fileType === 'excel' || fileType === 'xlsx';

  const theme = isPdf
    ? { color: 'var(--accent-red)', bg: 'rgba(239, 68, 68, 0.08)', label: 'PDF Document' }
    : isWord
    ? { color: 'var(--accent-primary)', bg: 'rgba(59, 130, 246, 0.08)', label: 'Word Document' }
    : { color: 'var(--accent-emerald)', bg: 'rgba(16, 185, 129, 0.08)', label: 'Excel Spreadsheet' };

  return (
    <div style={{
      margin: '12px 0',
      padding: '14px 18px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '14px',
      flexWrap: 'wrap'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: 'var(--radius-sm)',
          background: theme.bg,
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.color
        }}>
          {isExcel ? <FileSpreadsheet size={20} /> : <FileText size={20} />}
        </div>
        <div>
          <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px' }}>
            {fileTitle || fileName}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ color: theme.color, fontWeight: 500 }}>{theme.label}</span>
            <span>•</span>
            <span>{fileSize || 'Ready'}</span>
          </div>
        </div>
      </div>
      <a
        href={downloadUrl}
        download={fileName}
        className="btn-primary"
        style={{
          padding: '7px 14px',
          fontSize: '0.82rem',
          textDecoration: 'none'
        }}
      >
        <Download size={14} /> Download {theme.label.split(' ')[0]}
      </a>
    </div>
  );
}

// Interactive SVG Chart Renderer
function renderSvgChart(chartType, title, labelsStr, valuesStr) {
  const labels = labelsStr.split(',').map(l => l.trim());
  const values = valuesStr.split(',').map(v => parseFloat(v.trim()) || 0);
  const maxVal = Math.max(...values, 100);

  const colors = ['#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#0ea5e9', '#ec4899'];

  return (
    <div style={{
      margin: '12px 0',
      padding: '16px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '12px' }}>
        <BarChart2 size={16} style={{ color: 'var(--accent-primary)' }} /> {title || "Data Analytics & Distribution Chart"}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {labels.map((label, idx) => {
          const val = values[idx] || 0;
          const pct = Math.min(100, Math.max(8, (val / maxVal) * 100));
          const barColor = colors[idx % colors.length];

          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-main)', fontWeight: 500 }}>
                <span>{label}</span>
                <span style={{ color: barColor, fontWeight: 600 }}>{val}</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: barColor,
                  borderRadius: '4px',
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Flowchart / Step Sequence Diagram Renderer
function renderFlowchartDiagram(diagramType, stepsStr) {
  const steps = stepsStr.split('->').map(s => s.trim());

  return (
    <div style={{
      margin: '12px 0',
      padding: '14px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-sm)',
      overflowX: 'auto'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '10px' }}>
        <GitCommit size={15} style={{ color: 'var(--accent-primary)' }} /> Process Flowchart & Sequential Workflow
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
        {steps.map((step, idx) => (
          <React.Fragment key={idx}>
            <div style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-hover)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-main)',
              fontSize: '0.78rem',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{idx + 1}.</span> {step}
            </div>
            {idx < steps.length - 1 && (
              <span style={{ color: 'var(--text-dim)', fontWeight: 600, fontSize: '0.9rem' }}>→</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// Inline Text Renderer for Bold, Italics, Code, and Clickable Source Links
function renderInlineContent(text) {
  if (!text) return null;

  // Replace link patterns [label](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIdx = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.substring(lastIdx, match.index));
    }
    const label = match[1];
    const url = match[2];
    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: 'var(--accent-primary)',
          fontWeight: 500,
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          background: 'var(--accent-primary-subtle)',
          padding: '1px 6px',
          borderRadius: 'var(--radius-xs)',
          margin: '0 2px'
        }}
      >
        {label} <ExternalLink size={11} />
      </a>
    );
    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < text.length) {
    parts.push(text.substring(lastIdx));
  }

  const rawStr = parts.length > 0 ? parts : [text];

  // Process bold (**text**) and code (`code`)
  return rawStr.map((item, itemIdx) => {
    if (typeof item !== 'string') return item;

    const boldParts = item.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return (
      <React.Fragment key={itemIdx}>
        {boldParts.map((sub, sIdx) => {
          if (sub.startsWith('**') && sub.endsWith('**')) {
            return <strong key={sIdx} style={{ color: 'var(--text-main)', fontWeight: 600 }}>{sub.slice(2, -2)}</strong>;
          }
          if (sub.startsWith('`') && sub.endsWith('`')) {
            return (
              <code key={sIdx} style={{
                background: 'var(--code-inline-bg, rgba(255, 255, 255, 0.09))',
                color: 'var(--code-inline-color, var(--text-main))',
                padding: '2px 7px',
                borderRadius: '6px',
                fontFamily: "'Fira Code', Consolas, monospace",
                fontSize: '0.88em',
                border: '1px solid var(--code-inline-border, rgba(255, 255, 255, 0.12))',
                margin: '0 2px'
              }}>
                {sub.slice(1, -1)}
              </code>
            );
          }
          return sub;
        })}
      </React.Fragment>
    );
  });
}

// Markdown Table Component Renderer (Converts raw pipes | into styled HTML tables)
function renderMarkdownTable(tableLines, keyIdx) {
  const cleanLines = tableLines.filter(l => l.trim().startsWith('|'));
  if (cleanLines.length === 0) return null;

  const headerLine = cleanLines[0];
  const headers = headerLine.split('|').map(h => h.trim()).filter(h => h.length > 0);

  // Skip delimiter line (e.g. | :--- | :--- |)
  const bodyLines = cleanLines.slice(1).filter(l => !l.includes('---'));

  return (
    <div key={keyIdx} className="markdown-table-wrapper" style={{ overflowX: 'auto', margin: '14px 0' }}>
      <table className="markdown-table">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i}>{renderInlineContent(h)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyLines.map((line, rIdx) => {
            const cells = line.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
            return (
              <tr key={rIdx}>
                {cells.map((cell, cIdx) => (
                  <td key={cIdx}>{renderInlineContent(cell)}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Clean syntax tokenizer for code blocks to match official ChatGPT styling
function highlightSyntax(code, lang) {
  if (!code) return code;
  const lines = code.split('\n');
  return lines.map((line, lIdx) => {
    const tokenRegex = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|'(?:\\'|[^'])*'|"(?:\\"|[^"])*"|`[^`]*`|\b(?:int|char|float|double|void|const|return|if|else|for|while|struct|class|function|let|var|def|import|from|export|default|switch|case|break)\b|\b\d+\b)/g;

    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = tokenRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.substring(lastIndex, match.index));
      }
      const val = match[0];
      if (val.startsWith('//') || val.startsWith('/*')) {
        parts.push(<span key={match.index} style={{ color: '#6b7280', fontStyle: 'italic' }}>{val}</span>);
      } else if (val.startsWith("'") || val.startsWith('"') || val.startsWith('`')) {
        // String literal in emerald green like ChatGPT screenshot
        parts.push(<span key={match.index} style={{ color: '#86efac' }}>{val}</span>);
      } else if (/^\d+$/.test(val)) {
        // Numeric literal in sky cyan
        parts.push(<span key={match.index} style={{ color: '#38bdf8' }}>{val}</span>);
      } else {
        // Keywords in purple/violet
        parts.push(<span key={match.index} style={{ color: '#c084fc', fontWeight: 500 }}>{val}</span>);
      }
      lastIndex = tokenRegex.lastIndex;
    }

    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex));
    }

    return (
      <React.Fragment key={lIdx}>
        {parts.length > 0 ? parts : (line || ' ')}
        {lIdx < lines.length - 1 && '\n'}
      </React.Fragment>
    );
  });
}

// Official ChatGPT-Style Code Block Component
function ChatGPTCodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const displayLang = language ? language.toLowerCase() : 'code';

  return (
    <div style={{
      margin: '16px 0',
      background: '#1e1e1e',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
    }}>
      {/* Code Header with language and copy button */}
      <div style={{
        background: '#262626',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        userSelect: 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <Code size={13} style={{ color: '#9ca3af' }} />
          <span style={{
            fontSize: '0.78rem',
            fontFamily: "'Fira Code', Consolas, monospace",
            color: '#b4b4b4',
            fontWeight: 500,
            letterSpacing: '0.02em'
          }}>
            {displayLang}
          </span>
        </div>
        <button
          onClick={handleCopy}
          type="button"
          style={{
            background: 'transparent',
            border: 'none',
            color: copied ? '#10b981' : '#9ca3af',
            cursor: 'pointer',
            padding: '3px 7px',
            borderRadius: '5px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.75rem',
            fontFamily: 'inherit',
            transition: 'all 0.15s ease'
          }}
          title={copied ? 'Copied to clipboard' : 'Copy code'}
        >
          {copied ? (
            <>
              <Check size={13} style={{ color: '#10b981' }} />
              <span style={{ color: '#10b981', fontWeight: 500 }}>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <pre style={{
        padding: '14px 18px',
        margin: 0,
        fontFamily: "'Fira Code', Consolas, monospace",
        fontSize: '0.9rem',
        color: '#e2e8f0',
        overflowX: 'auto',
        lineHeight: '1.65',
        background: '#181818'
      }}>
        <code>{highlightSyntax(code, displayLang)}</code>
      </pre>
    </div>
  );
}

// Main Formatted Response Component Renderer (Converts Markdown Syntax & Custom Action Tags to React UI)
function renderFormattedMessage(content, onSendMessage) {
  if (!content) return null;

  let text = content;
  const elements = [];

  // 0. WhatsApp Action Card Tag
  const waRegex = /\[\[WHATSAPP:\s*([^|]+)\|\s*([^\]]+)\]\]/;
  const waMatch = text.match(waRegex);
  if (waMatch) {
    const contact = waMatch[1].trim();
    const messageText = waMatch[2].trim();

    text = text.replace(waMatch[0], '').trim();
    elements.push(
      <RenderWhatsAppCard
        key="whatsapp"
        contact={contact}
        messageText={messageText}
        onSendMessage={onSendMessage}
      />
    );
  }

  // 0.5. On-Demand Generated File Card Tag [[FILE_CARD: filename | type | downloadUrl | size | title]]
  const fileCardRegex = /\[\[FILE_CARD:\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^\]]+)\]\]/;
  const fileCardMatch = text.match(fileCardRegex);
  if (fileCardMatch) {
    const fileName = fileCardMatch[1].trim();
    const fileType = fileCardMatch[2].trim().toLowerCase();
    const downloadUrl = fileCardMatch[3].trim();
    const fileSize = fileCardMatch[4].trim();
    const fileTitle = fileCardMatch[5].trim();

    text = text.replace(fileCardMatch[0], '').trim();
    elements.push(
      <RenderFileCard
        key={`file-card-${fileName}`}
        fileName={fileName}
        fileType={fileType}
        downloadUrl={downloadUrl}
        fileSize={fileSize}
        fileTitle={fileTitle}
      />
    );
  }

  // 1. Gallery Component Tag
  const galleryRegex = /\[\[GALLERY:\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*(\d+)\]\]/;
  const galleryMatch = text.match(galleryRegex);
  if (galleryMatch) {
    const mainImg = galleryMatch[1].trim();
    const side1Img = galleryMatch[2].trim();
    const side2Img = galleryMatch[3].trim();
    const count = galleryMatch[4].trim();

    text = text.replace(galleryMatch[0], '').trim();

    elements.push(
      <div key="gallery" style={{
        display: 'grid',
        gridTemplateColumns: '1.7fr 1fr',
        gap: '8px',
        margin: '12px 0 18px 0',
        borderRadius: '16px',
        overflow: 'hidden',
        maxHeight: '320px',
        width: '100%',
        boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
        border: '1px solid var(--border-subtle)'
      }}>
        <div style={{ height: '100%', minHeight: '250px', overflow: 'hidden' }}>
          <img src={mainImg} alt="Visual Presentation" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
          <div style={{ flex: 1, overflow: 'hidden', minHeight: '120px' }}>
            <img src={side1Img} alt="Visual Detail 1" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
          <div style={{ flex: 1, overflow: 'hidden', minHeight: '120px', position: 'relative' }}>
            <img src={side2Img} alt="Visual Detail 2" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(8px)',
              padding: '4px 10px',
              borderRadius: '14px',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              border: '1px solid rgba(255,255,255,0.15)'
            }}>
              <ImageIcon size={12} color="var(--accent-cyan)" /> +{count}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Chart Component Tag
  const chartRegex = /\[\[CHART:\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^\]]+)\]\]/;
  const chartMatch = text.match(chartRegex);
  if (chartMatch) {
    const chartType = chartMatch[1].trim();
    const title = chartMatch[2].trim();
    const labels = chartMatch[3].trim();
    const values = chartMatch[4].trim();

    text = text.replace(chartMatch[0], '').trim();
    elements.push(
      <React.Fragment key="chart">
        {renderSvgChart(chartType, title, labels, values)}
      </React.Fragment>
    );
  }

  // 3. Diagram Component Tag
  const diagramRegex = /\[\[DIAGRAM:\s*([^|]+)\|\s*([^\]]+)\]\]/;
  const diagramMatch = text.match(diagramRegex);
  if (diagramMatch) {
    const diagramType = diagramMatch[1].trim();
    const stepsStr = diagramMatch[2].trim();

    text = text.replace(diagramMatch[0], '').trim();
    elements.push(
      <React.Fragment key="diagram">
        {renderFlowchartDiagram(diagramType, stepsStr)}
      </React.Fragment>
    );
  }

  // 4. Block-by-Block Markdown Parser (Headings, Tables, Lists, Code Blocks, Paragraphs)
  const lines = text.split('\n');
  const renderedBlocks = [];
  let tableBuffer = [];
  let inCodeBlock = false;
  let codeBuffer = [];
  let codeLang = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code block toggle
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        inCodeBlock = false;
        renderedBlocks.push(
          <ChatGPTCodeBlock
            key={`code-${i}`}
            language={codeLang}
            code={codeBuffer.join('\n')}
          />
        );
        codeBuffer = [];
        codeLang = '';
      } else {
        // Start code block
        inCodeBlock = true;
        codeLang = trimmed.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Markdown Table Buffer
    if (trimmed.startsWith('|')) {
      tableBuffer.push(line);
      continue;
    } else if (tableBuffer.length > 0) {
      renderedBlocks.push(renderMarkdownTable(tableBuffer, `tbl-${i}`));
      tableBuffer = [];
    }

    // Horizontal Rule
    if (trimmed === '---' || trimmed === '***') {
      renderedBlocks.push(<hr key={`hr-${i}`} style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '20px 0' }} />);
      continue;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      renderedBlocks.push(
        <h3 key={`h3-${i}`} style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)', margin: '18px 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {renderInlineContent(trimmed.slice(4))}
        </h3>
      );
      continue;
    }

    if (trimmed.startsWith('#### ')) {
      renderedBlocks.push(
        <h4 key={`h4-${i}`} style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', margin: '14px 0 6px 0' }}>
          {renderInlineContent(trimmed.slice(5))}
        </h4>
      );
      continue;
    }

    if (trimmed.startsWith('## ')) {
      renderedBlocks.push(
        <h2 key={`h2-${i}`} style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', margin: '22px 0 10px 0', letterSpacing: '-0.01em' }}>
          {renderInlineContent(trimmed.slice(3))}
        </h2>
      );
      continue;
    }

    // Numbered List (e.g. 1. Item)
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      renderedBlocks.push(
        <div key={`nli-${i}`} style={{ display: 'flex', gap: '10px', margin: '6px 0', fontSize: '0.98rem', lineHeight: '1.72', color: 'var(--text-main)', paddingLeft: '4px' }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: 600, minWidth: '18px', userSelect: 'none' }}>{numMatch[1]}.</span>
          <div>{renderInlineContent(numMatch[2])}</div>
        </div>
      );
      continue;
    }

    // Bullet Lists (- or *)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      renderedBlocks.push(
        <div key={`li-${i}`} style={{ display: 'flex', gap: '10px', margin: '6px 0', fontSize: '0.98rem', lineHeight: '1.72', color: 'var(--text-main)', paddingLeft: '4px' }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: 600, userSelect: 'none' }}>•</span>
          <div>{renderInlineContent(trimmed.slice(2))}</div>
        </div>
      );
      continue;
    }

    // Empty lines
    if (trimmed === '') {
      continue;
    }

    // Standard Paragraph - matches ChatGPT spacious, elegant typography
    renderedBlocks.push(
      <p key={`p-${i}`} style={{
        margin: '12px 0',
        lineHeight: '1.75',
        fontSize: '0.98rem',
        color: 'var(--text-main)',
        letterSpacing: '-0.005em'
      }}>
        {renderInlineContent(line)}
      </p>
    );
  }

  if (inCodeBlock && codeBuffer.length > 0) {
    renderedBlocks.push(
      <ChatGPTCodeBlock
        key="code-end"
        language={codeLang}
        code={codeBuffer.join('\n')}
      />
    );
  }

  if (tableBuffer.length > 0) {
    renderedBlocks.push(renderMarkdownTable(tableBuffer, `tbl-end`));
  }

  return (
    <div>
      {elements}
      <div>
        {renderedBlocks}
      </div>
    </div>
  );
}

export default function ChatGPTConsole({
  messages,
  onSendMessage,
  isProcessing,
  activeTool,
  persona,
  onSelectPersona,
  activeEmotion,
  onToggleMobileSidebar,
  selectedModel = "Multi-LLM Ensemble",
  onSelectModel,
  onToggleRightPanel,
  currentUser,
  onOpenAuth,
  onOpenAdmin,
  onLogout,
  isMobile,
  deviceLabel
}) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [likedIdx, setLikedIdx] = useState({});
  const [researchStage, setResearchStage] = useState(0);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const personaMenuRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (personaMenuRef.current && !personaMenuRef.current.contains(event.target)) {
        setShowPersonaMenu(false);
      }
    }
    if (showPersonaMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPersonaMenu]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  // Dynamic Search Progress Animation Steps during processing
  useEffect(() => {
    if (isProcessing) {
      setResearchStage(1);
      const timer1 = setTimeout(() => setResearchStage(2), 600);
      const timer2 = setTimeout(() => setResearchStage(3), 1200);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else {
      setResearchStage(0);
    }
  }, [isProcessing]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isProcessing) return;
    soundFx.playSend();
    const messageText = input;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    onSendMessage(messageText, autoSpeak);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopyText = (text, idx) => {
    const cleanText = text.replace(/\[\[(GALLERY|CHART|DIAGRAM|WHATSAPP):[\s\S]*?\]\]/g, '').trim();
    navigator.clipboard.writeText(cleanText);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleToggleLike = (idx, status) => {
    setLikedIdx(prev => ({
      ...prev,
      [idx]: prev[idx] === status ? null : status
    }));
  };

  const handleRegenerate = (idx) => {
    for (let i = idx - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        soundFx.playSend();
        onSendMessage(messages[i].content, autoSpeak);
        break;
      }
    }
  };

  const toggleMic = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      speechEngine.startListening(
        (transcript) => {
          setIsListening(false);
          setInput(transcript);
          soundFx.playSend();
          onSendMessage(transcript, autoSpeak);
        },
        (error) => {
          setIsListening(false);
          console.warn('Voice input error:', error);
        }
      );
    }
  };

  const handleSpeak = (text) => {
    speechEngine.speak(text);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setInput(prev => `${prev} [Attached file: ${file.name}]`);
    }
  };

  const modelOptions = [
    "Multi-LLM Ensemble",
    "Google Gemini 2.5 Flash",
    "Groq Llama 3.3 70B",
    "ChatGPT GPT-4o-mini"
  ];

  const suggestionCards = [
    { title: "Write Production Code", desc: "Build an Express API endpoint with auth", prompt: "Write an Express API endpoint with JWT authentication", icon: Code, color: "var(--accent-primary)" },
    { title: "Analyze System Spec", desc: "Compare laptop hardware components", prompt: "Compare laptop hardware specifications", icon: BarChart2, color: "var(--accent-purple)" },
    { title: "Explain Topic", desc: "Break down complex concepts simply", prompt: "Explain higher education and universities simply", icon: HelpCircle, color: "var(--accent-pink)" },
    { title: "Step-by-Step Procedure", desc: "Generate execution workflows", prompt: "How to install Node.js step by step", icon: Compass, color: "var(--accent-emerald)" },
    { title: "Explore Visual Concept", desc: "Contextual HD visual gallery", prompt: "TELL ME ABOUT NATURE", icon: ImageIcon, color: "var(--accent-amber)" },
    { title: "Plan System Architecture", desc: "Design scalable cloud microservices", prompt: "Plan a scalable cloud microservice architecture", icon: Lightbulb, color: "var(--accent-cyan)" }
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header bar */}
      <div className="chat-header-bar" style={{
        padding: '9px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-secondary)',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="btn-secondary mobile-menu-btn"
              style={{ padding: '6px 8px', borderRadius: 'var(--radius-sm)', display: 'none', flexShrink: 0 }}
              title="Toggle Navigation"
            >
              <Menu size={16} />
            </button>
          )}

          {/* Compact Persona Selector Dropdown */}
          <div style={{ position: 'relative' }} ref={personaMenuRef}>
            {(() => {
              const activeP = (personas || []).find(p => p.id === (persona || 'jarvis').toLowerCase()) || (personas && personas[0]) || { name: 'JARVIS', icon: Bot, role: 'Tactical', color: 'var(--accent-primary)' };
              const IconComp = activeP.icon || Bot;
              return (
                <button
                  onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                  className="btn-secondary"
                  style={{
                    padding: '5px 9px',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-main)',
                    cursor: 'pointer'
                  }}
                  title={`Active Persona: ${activeP.name} (${activeP.role})`}
                >
                  <IconComp size={13} style={{ color: activeP.color || 'var(--accent-primary)' }} />
                  <span style={{ fontWeight: 600 }}>{activeP.name}</span>
                  <ChevronDown size={12} style={{ color: 'var(--text-dim)', marginLeft: '1px' }} />
                </button>
              );
            })()}

            {showPersonaMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 5px)',
                  left: '0',
                  width: '270px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '6px',
                  zIndex: 600,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  animation: 'fadeIn 0.12s ease-out'
                }}
              >
                <div style={{ padding: '6px 10px 4px', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Select AI Persona
                </div>
                {(personas || []).map((p) => {
                  const PIcon = p.icon || Bot;
                  const isSelected = (persona || 'jarvis').toLowerCase() === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        if (onSelectPersona) onSelectPersona(p.id);
                        setShowPersonaMenu(false);
                      }}
                      style={{
                        padding: '7px 10px',
                        borderRadius: 'var(--radius-sm)',
                        background: isSelected ? 'var(--bg-card-hover)' : 'transparent',
                        border: isSelected ? '1px solid var(--border-strong)' : '1px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        textAlign: 'left',
                        width: '100%',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                        <PIcon size={14} style={{ color: p.color }} />
                        <div>
                          <div style={{ fontSize: '0.79rem', fontWeight: isSelected ? 600 : 500, color: 'var(--text-main)' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                            {p.role} · {p.desc}
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check size={13} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Model Selector Dropdown */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', minWidth: 0 }}>
            <select
              value={selectedModel}
              onChange={(e) => onSelectModel && onSelectModel(e.target.value)}
              className="chat-model-select"
              title="Active Intelligence Model"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '5px 24px 5px 9px',
                color: 'var(--text-main)',
                fontWeight: 500,
                fontSize: '0.78rem',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                maxWidth: '170px'
              }}
            >
              {modelOptions.map((opt, i) => (
                <option key={i} value={opt} style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>{opt}</option>
              ))}
            </select>
            <ChevronDown size={12} color="var(--text-dim)" style={{ position: 'absolute', right: '7px', pointerEvents: 'none' }} />
          </div>
        </div>

        <div className="chat-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* Admin Dashboard Header Button (VISIBLE TO ADMIN ONLY) */}
          {currentUser && currentUser.isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="btn-secondary"
              style={{
                padding: '5px 9px',
                fontSize: '0.76rem',
                fontWeight: 600,
                color: 'var(--accent-primary)',
                border: '1px solid var(--accent-primary)',
                background: 'var(--accent-primary-subtle)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="Admin Dashboard"
            >
              <Shield size={13} />
              <span className="hide-on-mobile">Admin</span>
            </button>
          )}

          {/* User Account / Auth Modal Header Button */}
          <button
            onClick={onOpenAuth}
            className="btn-secondary"
            style={{
              padding: '5px 9px',
              fontSize: '0.76rem',
              fontWeight: 500,
              color: 'var(--text-main)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Users size={13} style={{ color: 'var(--accent-primary)' }} />
            <span className="hide-on-mobile">{currentUser ? currentUser.name.split(' ')[0] : "Sign In"}</span>
          </button>

          {currentUser && onLogout && (
            <button
              onClick={onLogout}
              className="btn-secondary"
              style={{
                padding: '5px 8px',
                fontSize: '0.74rem',
                fontWeight: 500,
                color: 'var(--accent-red)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer'
              }}
              title="Sign Out"
            >
              Logout
            </button>
          )}

          {/* Access Expiration / Days Remaining Warning Badge */}
          {currentUser && !currentUser.isAdmin && currentUser.accessExpiresAt && (
            <div className="hide-on-mobile" style={{
              fontSize: '0.7rem',
              padding: '3px 7px',
              borderRadius: 'var(--radius-xs)',
              fontWeight: 600,
              background: (new Date(currentUser.accessExpiresAt) - new Date()) / (1000 * 60 * 60 * 24) <= 3 
                ? 'rgba(239, 68, 68, 0.12)' 
                : 'var(--bg-hover)',
              border: (new Date(currentUser.accessExpiresAt) - new Date()) / (1000 * 60 * 60 * 24) <= 3 
                ? '1px solid rgba(239, 68, 68, 0.3)' 
                : '1px solid var(--border-subtle)',
              color: (new Date(currentUser.accessExpiresAt) - new Date()) / (1000 * 60 * 60 * 24) <= 3 
                ? 'var(--accent-red)' 
                : 'var(--text-muted)'
            }}>
              {Math.max(0, Math.ceil((new Date(currentUser.accessExpiresAt) - new Date()) / (1000 * 60 * 60 * 24)))}d left
            </div>
          )}

          {activeEmotion && (
            <div className="hide-on-mobile" style={{
              fontSize: '0.7rem',
              padding: '3px 7px',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)'
            }}>
              Mood: <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>{activeEmotion.mood}</span>
            </div>
          )}

          {/* Text-to-Speech Toggle */}
          <button
            onClick={() => setAutoSpeak(!autoSpeak)}
            className="btn-secondary"
            style={{ 
              padding: '5px 8px', 
              fontSize: '0.74rem', 
              border: autoSpeak ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
              background: autoSpeak ? 'var(--accent-primary-subtle)' : 'var(--bg-card)'
            }}
            title={autoSpeak ? "Auto Text-to-Speech Active" : "Auto Text-to-Speech Muted"}
          >
            <Volume2 size={13} style={{ color: autoSpeak ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
          </button>

          {/* Real-time Device Mode Indicator */}
          <div
            title={`Detected Device Mode: ${deviceLabel || (isMobile ? 'Mobile' : 'Laptop / PC')}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 6px',
              borderRadius: 'var(--radius-xs)',
              fontSize: '0.7rem',
              fontWeight: 500,
              background: 'var(--bg-hover)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)'
            }}
          >
            {isMobile ? <Smartphone size={12} /> : <Laptop size={12} />}
            <span className="hide-on-mobile">{deviceLabel || (isMobile ? "Mobile" : "PC")}</span>
          </div>

          {/* Toggle Right Panel Button */}
          {onToggleRightPanel && (
            <button
              onClick={onToggleRightPanel}
              className="btn-secondary"
              style={{ padding: '5px 7px', borderRadius: 'var(--radius-sm)' }}
              title="Toggle Right Tool Rail"
            >
              <PanelRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Messages Canvas */}
      <div className="message-canvas" style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px'
      }}>
        {messages.length === 0 && (
          <div style={{
            margin: 'auto',
            textAlign: 'center',
            maxWidth: '640px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            <img
              src="/sagw-ai-logo.png"
              alt="SAGW AI Logo"
              style={{
                width: '84px',
                height: '84px',
                borderRadius: 'var(--radius-md)',
                objectFit: 'cover',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                boxShadow: '0 4px 24px rgba(56, 189, 248, 0.3)'
              }}
            />

            <div>
              <div className="sagw-brand-title" style={{ fontSize: '2rem', marginBottom: '8px' }}>
                <span className="sagw-word">SAGW</span>
                <span className="ai-word">AI</span>
              </div>
              <div className="sagw-brand-subtitle" style={{ marginBottom: '6px' }}>
                FROM DARKNESS TO CLARITY
              </div>
              <div className="sagw-tagline-pills">
                <span>LEARN</span>
                <span className="divider">/</span>
                <span>ASK</span>
                <span className="divider">/</span>
                <span>BUILD</span>
                <span className="divider">/</span>
                <span>GROW</span>
              </div>
            </div>

            <div className="suggestion-cards-grid">
              {suggestionCards.map((card, i) => {
                const IconComp = card.icon;
                return (
                  <button
                    key={i}
                    onClick={() => onSendMessage(card.prompt, autoSpeak)}
                    className="btn-secondary"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      textAlign: 'left',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      gap: '5px',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <IconComp size={16} style={{ color: card.color }} />
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>{card.title}</div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>{card.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className="message-row"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: msg.role === 'user' ? '78%' : '100%',
              width: '100%',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              position: 'relative',
              marginBottom: msg.role === 'user' ? '12px' : '24px'
            }}
          >
            {msg.role === 'user' && (
              <div style={{
                fontSize: '0.72rem',
                color: 'var(--text-dim)',
                marginBottom: '3px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                You
              </div>
            )}

            {msg.role === 'user' ? (
              <div style={{
                padding: '12px 18px',
                borderRadius: '18px 18px 4px 18px',
                background: 'var(--accent-primary)',
                color: '#ffffff',
                fontWeight: 400,
                fontSize: '0.94rem',
                lineHeight: '1.6',
                boxShadow: 'var(--shadow-sm)',
                border: 'none',
                wordBreak: 'break-word',
                width: 'auto',
                maxWidth: '100%'
              }}>
                {msg.content}
              </div>
            ) : msg.content && msg.content.trim() ? (
              <div className="assistant-message-content" style={{
                padding: '2px 0',
                background: 'transparent',
                color: 'var(--text-main)',
                fontWeight: 400,
                fontSize: '0.98rem',
                lineHeight: '1.75',
                letterSpacing: '-0.005em',
                wordBreak: 'break-word',
                width: '100%'
              }}>
                {renderFormattedMessage(msg.content, onSendMessage)}
              </div>
            ) : (
              /* Clean loading indicator without heavy card bubble */
              <div style={{
                padding: '10px 16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.04)',
                color: 'var(--text-main)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '9px',
                width: 'fit-content'
              }}>
                <div className="simple-typing-indicator">
                  <span className="dot dot-1" />
                  <span className="dot dot-2" />
                  <span className="dot dot-3" />
                </div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', userSelect: 'none' }}>Thinking...</span>
              </div>
            )}

            {/* Action Bar for Assistant Messages (only shown when message has content) */}
            {msg.role !== 'user' && Boolean(msg.content && msg.content.trim()) && (
              <div className="message-action-bar" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '5px', color: 'var(--text-muted)' }}>
                <button
                  onClick={() => handleCopyText(msg.content, idx)}
                  style={{ background: 'none', border: 'none', color: copiedIdx === idx ? 'var(--accent-emerald)' : 'var(--text-dim)', cursor: 'pointer', fontSize: '0.73rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Copy Response"
                >
                  {copiedIdx === idx ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedIdx === idx ? 'Copied!' : 'Copy'}</span>
                </button>

                <button
                  onClick={() => handleRegenerate(idx)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.73rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Regenerate Response"
                >
                  <RotateCcw size={12} /> Regenerate
                </button>

                <button
                  onClick={() => handleToggleLike(idx, 'like')}
                  style={{ background: 'none', border: 'none', color: likedIdx[idx] === 'like' ? 'var(--accent-primary)' : 'var(--text-dim)', cursor: 'pointer' }}
                  title="Good Response"
                >
                  <ThumbsUp size={12} />
                </button>

                <button
                  onClick={() => handleToggleLike(idx, 'dislike')}
                  style={{ background: 'none', border: 'none', color: likedIdx[idx] === 'dislike' ? 'var(--accent-red)' : 'var(--text-dim)', cursor: 'pointer' }}
                  title="Needs Improvement"
                >
                  <ThumbsDown size={12} />
                </button>

                <button
                  onClick={() => handleSpeak(msg.content)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.73rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Text-to-Speech"
                >
                  <Volume2 size={12} /> Listen
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Fallback loading indicator if isProcessing is true and assistant message hasn't appeared yet */}
        {isProcessing && (messages.length === 0 || messages[messages.length - 1]?.role === 'user') && (
          <div
            className="message-row"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              maxWidth: '85%',
              alignSelf: 'flex-start',
              position: 'relative'
            }}
          >
            <div style={{
              fontSize: '0.72rem',
              color: 'var(--text-dim)',
              marginBottom: '3px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{persona.toUpperCase()}</span>
            </div>
            <div style={{
              padding: '10px 16px',
              borderRadius: '14px 14px 14px 2px',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--border-subtle)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '9px',
              width: 'fit-content'
            }}>
              <div className="simple-typing-indicator">
                <span className="dot dot-1" />
                <span className="dot dot-2" />
                <span className="dot dot-3" />
              </div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', userSelect: 'none' }}>Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer Area */}
      <div className="composer-container" style={{
        padding: '12px 20px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-secondary)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />

        {isProcessing && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary"
              style={{ padding: '5px 12px', fontSize: '0.78rem', borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }}
            >
              <Square size={13} /> Stop Generation
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="composer-form" style={{
          display: 'flex',
          gap: '6px',
          alignItems: 'flex-end',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '8px 12px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary"
            style={{ padding: '7px', borderRadius: 'var(--radius-sm)', background: 'transparent', border: 'none' }}
            title="Attach file or image"
          >
            <Paperclip size={17} color="var(--text-muted)" />
          </button>

          <button
            type="button"
            onClick={toggleMic}
            className="btn-secondary"
            style={{
              padding: '7px',
              borderRadius: 'var(--radius-sm)',
              background: isListening ? 'rgba(236, 72, 153, 0.12)' : 'transparent',
              border: 'none'
            }}
            title={isListening ? "Listening..." : "Voice Input"}
          >
            {isListening ? <MicOff size={17} color="var(--accent-pink)" /> : <Mic size={17} color="var(--text-muted)" />}
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="composer-textarea"
            placeholder={`Message ${persona}... (Enter to send, Shift+Enter for newline)`}
          />

          <button
            type="submit"
            className="btn-primary"
            disabled={!input.trim() || isProcessing}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              opacity: (!input.trim() || isProcessing) ? 0.4 : 1,
              cursor: (!input.trim() || isProcessing) ? 'not-allowed' : 'pointer'
            }}
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
