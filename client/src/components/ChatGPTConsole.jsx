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
  Edit3
} from 'lucide-react';
import { soundFx } from '../services/soundFx';
import { speechEngine } from '../services/speech';

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
      margin: '16px 0',
      padding: '18px',
      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(13, 148, 136, 0.15) 100%)',
      border: '1px solid var(--accent-emerald)',
      borderRadius: '16px',
      boxShadow: '0 8px 25px rgba(16, 185, 129, 0.15)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-emerald)', marginBottom: '12px' }}>
        <MessageSquare size={18} /> WhatsApp Action Preview Card
      </div>

      <div style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '14px' }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
          Recipient Contact: <strong style={{ color: 'var(--text-main)' }}>{contact}</strong>
        </div>
        <div style={{ fontSize: '0.92rem', color: 'var(--text-main)', fontStyle: 'italic', background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '8px' }}>
          "{messageText}"
        </div>
      </div>

      {isSent ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-emerald)', fontSize: '0.85rem', fontWeight: 600 }}>
          <CheckCircle2 size={18} /> Message Delivered Successfully to {contact}!
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleSend}
            className="btn-primary"
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.84rem'
            }}
          >
            <Send size={14} /> Send Message
          </button>

          <button
            onClick={() => onSendMessage(`Edit message for ${contact}`)}
            className="btn-secondary"
            style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Edit3 size={14} /> Edit Message
          </button>
        </div>
      )}
    </div>
  );
}

// Interactive SVG Chart Renderer
function renderSvgChart(chartType, title, labelsStr, valuesStr) {
  const labels = labelsStr.split(',').map(l => l.trim());
  const values = valuesStr.split(',').map(v => parseFloat(v.trim()) || 0);
  const maxVal = Math.max(...values, 100);

  const colors = ['#00f0ff', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <div style={{
      margin: '16px 0',
      padding: '18px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-glow)',
      borderRadius: '14px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '14px' }}>
        <BarChart2 size={18} /> {title || "Data Analytics & Distribution Chart"}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {labels.map((label, idx) => {
          const val = values[idx] || 0;
          const pct = Math.min(100, Math.max(8, (val / maxVal) * 100));
          const barColor = colors[idx % colors.length];

          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 500 }}>
                <span>{label}</span>
                <span style={{ color: barColor, fontWeight: 700 }}>{val}</span>
              </div>
              <div style={{ width: '100%', height: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${barColor} 0%, #3b82f6 100%)`,
                  borderRadius: '6px',
                  transition: 'width 0.8s ease-in-out'
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
      margin: '16px 0',
      padding: '16px',
      background: 'var(--bg-card)',
      border: '1px solid var(--accent-cyan)',
      borderRadius: '14px',
      overflowX: 'auto'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '12px' }}>
        <GitCommit size={16} /> Process Flowchart & Sequential Workflow
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'nowrap' }}>
        {steps.map((step, idx) => (
          <React.Fragment key={idx}>
            <div style={{
              padding: '8px 14px',
              borderRadius: '10px',
              background: 'rgba(0, 240, 255, 0.1)',
              border: '1px solid var(--accent-cyan)',
              color: 'var(--text-main)',
              fontSize: '0.82rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ color: 'var(--accent-cyan)' }}>{idx + 1}.</span> {step}
            </div>
            {idx < steps.length - 1 && (
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '1rem' }}>→</span>
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
          color: 'var(--accent-cyan)',
          fontWeight: 600,
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(0,240,255,0.08)',
          padding: '2px 8px',
          borderRadius: '6px',
          margin: '0 2px'
        }}
      >
        {label} <ExternalLink size={12} />
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
            return <strong key={sIdx} style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{sub.slice(2, -2)}</strong>;
          }
          if (sub.startsWith('`') && sub.endsWith('`')) {
            return (
              <code key={sIdx} style={{
                background: 'var(--code-bg)',
                color: 'var(--accent-pink)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.88em'
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
    <div key={keyIdx} style={{ overflowX: 'auto', margin: '14px 0' }}>
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
          <div key={`code-${i}`} style={{
            margin: '12px 0',
            background: 'var(--code-bg)',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden'
          }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', fontSize: '0.75rem', color: 'var(--accent-cyan)', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)' }}>
              <span>{codeLang || 'CODE'}</span>
            </div>
            <pre style={{ padding: '12px', margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.88rem', color: '#f3f4f6', overflowX: 'auto' }}>
              <code>{codeBuffer.join('\n')}</code>
            </pre>
          </div>
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
      renderedBlocks.push(<hr key={`hr-${i}`} style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '16px 0' }} />);
      continue;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      renderedBlocks.push(
        <h3 key={`h3-${i}`} style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-cyan)', margin: '14px 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {renderInlineContent(trimmed.slice(4))}
        </h3>
      );
      continue;
    }

    if (trimmed.startsWith('#### ')) {
      renderedBlocks.push(
        <h4 key={`h4-${i}`} style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', margin: '12px 0 6px 0' }}>
          {renderInlineContent(trimmed.slice(5))}
        </h4>
      );
      continue;
    }

    if (trimmed.startsWith('## ')) {
      renderedBlocks.push(
        <h2 key={`h2-${i}`} style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-cyan)', margin: '18px 0 10px 0' }}>
          {renderInlineContent(trimmed.slice(3))}
        </h2>
      );
      continue;
    }

    // Lists (- or *)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      renderedBlocks.push(
        <div key={`li-${i}`} style={{ display: 'flex', gap: '8px', margin: '4px 0', fontSize: '0.92rem', paddingLeft: '8px' }}>
          <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>•</span>
          <div>{renderInlineContent(trimmed.slice(2))}</div>
        </div>
      );
      continue;
    }

    // Empty lines
    if (trimmed === '') {
      continue;
    }

    // Standard Paragraph
    renderedBlocks.push(
      <p key={`p-${i}`} style={{ margin: '6px 0', lineHeight: '1.6' }}>
        {renderInlineContent(line)}
      </p>
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
  activeEmotion,
  onToggleMobileSidebar,
  selectedModel = "Multi-LLM Ensemble",
  onSelectModel,
  onToggleRightPanel,
  currentUser,
  onOpenAuth,
  onOpenAdmin,
  onLogout
}) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [likedIdx, setLikedIdx] = useState({});
  const [researchStage, setResearchStage] = useState(0);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

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
    { title: "Write Production Code", desc: "Build an Express API endpoint with auth", prompt: "Write an Express API endpoint with JWT authentication", icon: Code, color: "var(--accent-cyan)" },
    { title: "Analyze System Spec", desc: "Compare laptop hardware components", prompt: "Compare laptop hardware specifications", icon: BarChart2, color: "var(--accent-purple)" },
    { title: "Explain Topic", desc: "Break down complex concepts simply", prompt: "Explain higher education and universities simply", icon: HelpCircle, color: "var(--accent-pink)" },
    { title: "Step-by-Step Procedure", desc: "Generate execution workflows", prompt: "How to install Node.js step by step", icon: Compass, color: "var(--accent-emerald)" },
    { title: "Explore Visual Concept", desc: "Contextual HD visual gallery", prompt: "TELL ME ABOUT NATURE", icon: ImageIcon, color: "var(--accent-amber)" },
    { title: "Plan System Architecture", desc: "Design scalable cloud microservices", prompt: "Plan a scalable cloud microservice architecture", icon: Lightbulb, color: "var(--accent-blue)" }
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header bar */}
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-secondary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="btn-secondary mobile-menu-btn"
              style={{ padding: '6px', borderRadius: '8px', display: 'none' }}
              title="Toggle Navigation"
            >
              <Menu size={18} />
            </button>
          )}

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <select
              value={selectedModel}
              onChange={(e) => onSelectModel && onSelectModel(e.target.value)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '6px 32px 6px 12px',
                color: 'var(--accent-cyan)',
                fontWeight: 600,
                fontSize: '0.85rem',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none'
              }}
            >
              {modelOptions.map((opt, i) => (
                <option key={i} value={opt} style={{ background: '#0d111a', color: '#fff' }}>{opt}</option>
              ))}
            </select>
            <ChevronDown size={14} color="var(--accent-cyan)" style={{ position: 'absolute', right: '10px', pointerEvents: 'none' }} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Admin Dashboard Header Button (VISIBLE TO ADMIN ONLY) */}
          {currentUser && currentUser.isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="btn-secondary"
              style={{
                padding: '6px 14px',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--accent-cyan)',
                border: '1px solid var(--accent-cyan)',
                background: 'rgba(0, 240, 255, 0.15)',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <GitCommit size={15} /> Admin Dashboard
            </button>
          )}

          {/* User Account / Auth Modal Header Button */}
          <button
            onClick={onOpenAuth}
            className="btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--text-main)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-card)',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Code size={14} color="var(--accent-cyan)" />
            {currentUser ? currentUser.name : "Sign In / Register"}
          </button>

          {currentUser && onLogout && (
            <button
              onClick={onLogout}
              className="btn-secondary"
              style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#fca5a5',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.15)',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
              title="Sign Out"
            >
              Logout
            </button>
          )}

          {/* Access Expiration / Days Remaining Warning Badge */}
          {currentUser && !currentUser.isAdmin && currentUser.accessExpiresAt && (
            <div style={{
              fontSize: '0.75rem',
              padding: '4px 10px',
              borderRadius: '8px',
              fontWeight: 600,
              background: (new Date(currentUser.accessExpiresAt) - new Date()) / (1000 * 60 * 60 * 24) <= 3 
                ? 'rgba(239, 68, 68, 0.2)' 
                : (new Date(currentUser.accessExpiresAt) - new Date()) / (1000 * 60 * 60 * 24) <= 7 
                ? 'rgba(245, 158, 11, 0.2)' 
                : 'rgba(0, 240, 255, 0.1)',
              border: (new Date(currentUser.accessExpiresAt) - new Date()) / (1000 * 60 * 60 * 24) <= 3 
                ? '1px solid #ef4444' 
                : (new Date(currentUser.accessExpiresAt) - new Date()) / (1000 * 60 * 60 * 24) <= 7 
                ? '1px solid #f59e0b' 
                : '1px solid var(--accent-cyan)',
              color: (new Date(currentUser.accessExpiresAt) - new Date()) / (1000 * 60 * 60 * 24) <= 3 
                ? '#fca5a5' 
                : (new Date(currentUser.accessExpiresAt) - new Date()) / (1000 * 60 * 60 * 24) <= 7 
                ? '#fde68a' 
                : 'var(--accent-cyan)'
            }}>
              Access: {Math.max(0, Math.ceil((new Date(currentUser.accessExpiresAt) - new Date()) / (1000 * 60 * 60 * 24)))} days left
            </div>
          )}

          {activeEmotion && (
            <div style={{
              fontSize: '0.72rem',
              padding: '4px 10px',
              borderRadius: '20px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)'
            }}>
              Mood: <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>{activeEmotion.mood}</span>
            </div>
          )}

          <button
            onClick={() => setAutoSpeak(!autoSpeak)}
            className={`btn-secondary ${autoSpeak ? 'glass-panel-glow' : ''}`}
            style={{ padding: '6px 12px', fontSize: '0.78rem', border: autoSpeak ? '1px solid var(--accent-pink)' : '1px solid transparent' }}
            title="Auto Text-to-Speech"
          >
            <Volume2 size={15} color={autoSpeak ? 'var(--accent-pink)' : 'var(--text-muted)'} />
            {autoSpeak ? 'TTS Active' : 'TTS Muted'}
          </button>

          {onToggleRightPanel && (
            <button
              onClick={onToggleRightPanel}
              className="btn-secondary"
              style={{ padding: '6px 10px', borderRadius: '8px' }}
              title="Toggle Context & AI Tools Panel"
            >
              <PanelRight size={16} color="var(--accent-cyan)" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Canvas */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {messages.length === 0 && (
          <div style={{
            margin: 'auto',
            textAlign: 'center',
            maxWidth: '680px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'rgba(0,240,255,0.1)',
              border: '1px solid var(--accent-cyan)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 35px rgba(0,240,255,0.25)'
            }}>
              <Sparkles size={32} color="var(--accent-cyan)" />
            </div>

            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 700, marginBottom: '8px' }}>
                How can I help you today?
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.5' }}>
                Ask anything, request step-by-step procedures, comparison tables, data distribution charts, or launch OS tools.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', width: '100%', marginTop: '8px' }}>
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
                      padding: '14px',
                      borderRadius: '12px',
                      gap: '6px'
                    }}
                  >
                    <IconComp size={18} color={card.color} />
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{card.title}</div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{card.desc}</span>
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
              maxWidth: '88%',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              position: 'relative'
            }}
          >
            <div style={{
              fontSize: '0.72rem',
              color: 'var(--text-dim)',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {msg.role === 'user' ? (
                'You'
              ) : (
                <>
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{persona.toUpperCase()}</span>
                  {msg.provider && msg.provider !== persona.toUpperCase() && (
                    <span style={{ background: 'var(--bg-card)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                      JARVIS
                    </span>
                  )}
                </>
              )}
            </div>

            <div style={{
              padding: '16px 20px',
              borderRadius: msg.role === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-blue) 100%)'
                : 'var(--bg-card)',
              color: msg.role === 'user' ? '#fff' : 'var(--text-main)',
              fontWeight: msg.role === 'user' ? 500 : 400,
              fontSize: '0.92rem',
              lineHeight: '1.6',
              boxShadow: msg.role === 'user' ? '0 4px 15px rgba(0,240,255,0.25)' : 'none',
              border: msg.role === 'user' ? 'none' : '1px solid var(--border-subtle)',
              wordBreak: 'break-word',
              width: msg.role !== 'user' ? '100%' : 'auto'
            }}>
              {msg.role === 'user' ? msg.content : renderFormattedMessage(msg.content, onSendMessage)}
            </div>

            {/* Action Bar for Assistant Messages */}
            {msg.role !== 'user' && (
              <div className="message-action-bar" style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px', color: 'var(--text-muted)' }}>
                <button
                  onClick={() => handleCopyText(msg.content, idx)}
                  style={{ background: 'none', border: 'none', color: copiedIdx === idx ? 'var(--accent-emerald)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Copy Response"
                >
                  {copiedIdx === idx ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedIdx === idx ? 'Copied!' : 'Copy'}</span>
                </button>

                <button
                  onClick={() => handleRegenerate(idx)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Regenerate Response"
                >
                  <RotateCcw size={13} /> Regenerate
                </button>

                <button
                  onClick={() => handleToggleLike(idx, 'like')}
                  style={{ background: 'none', border: 'none', color: likedIdx[idx] === 'like' ? 'var(--accent-cyan)' : 'var(--text-muted)', cursor: 'pointer' }}
                  title="Good Response"
                >
                  <ThumbsUp size={13} />
                </button>

                <button
                  onClick={() => handleToggleLike(idx, 'dislike')}
                  style={{ background: 'none', border: 'none', color: likedIdx[idx] === 'dislike' ? 'var(--accent-pink)' : 'var(--text-muted)', cursor: 'pointer' }}
                  title="Needs Improvement"
                >
                  <ThumbsDown size={13} />
                </button>

                <button
                  onClick={() => handleSpeak(msg.content)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Text-to-Speech"
                >
                  <Volume2 size={13} /> Listen
                </button>
              </div>
            )}
          </div>
        ))}

        {isProcessing && (
          <div style={{
            alignSelf: 'flex-start',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            maxWidth: '380px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
              <Globe size={16} className="spin-slow" />
              <span>JARVIS Personal Assistant Engine</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: researchStage >= 1 ? 'var(--accent-cyan)' : 'var(--text-dim)' }}>
                {researchStage >= 1 ? <CheckCircle2 size={13} /> : <Search size={13} />}
                <span>Reading session context & topic memory...</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: researchStage >= 2 ? 'var(--accent-cyan)' : 'var(--text-dim)' }}>
                {researchStage >= 2 ? <CheckCircle2 size={13} /> : <Search size={13} />}
                <span>Evaluating task modifications & entities...</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: researchStage >= 3 ? 'var(--accent-emerald)' : 'var(--text-dim)' }}>
                {researchStage >= 3 ? <Sparkles size={13} color="var(--accent-emerald)" /> : <Search size={13} />}
                <span>Synthesizing continuous context response...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer Area */}
      <div style={{
        padding: '16px 24px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-secondary)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
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
              style={{ padding: '6px 14px', fontSize: '0.8rem', borderColor: 'var(--accent-pink)', color: 'var(--accent-pink)' }}
            >
              <Square size={14} /> Stop Generation
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-end',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '10px 14px'
        }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary"
            style={{ padding: '8px', borderRadius: '10px', background: 'transparent', border: 'none' }}
            title="Attach file or image"
          >
            <Paperclip size={18} color="var(--text-muted)" />
          </button>

          <button
            type="button"
            onClick={toggleMic}
            className="btn-secondary"
            style={{
              padding: '8px',
              borderRadius: '10px',
              background: isListening ? 'rgba(236, 72, 153, 0.2)' : 'transparent',
              border: 'none'
            }}
            title={isListening ? "Listening..." : "Voice Input"}
          >
            {isListening ? <MicOff size={18} color="var(--accent-pink)" /> : <Mic size={18} color="var(--accent-cyan)" />}
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="composer-textarea"
            placeholder={`Message ${persona}... (Press Enter to send, Shift+Enter for new line)`}
          />

          <button
            type="submit"
            className="btn-primary"
            disabled={!input.trim() || isProcessing}
            style={{
              padding: '10px 16px',
              borderRadius: '10px',
              opacity: (!input.trim() || isProcessing) ? 0.5 : 1,
              cursor: (!input.trim() || isProcessing) ? 'not-allowed' : 'pointer'
            }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
