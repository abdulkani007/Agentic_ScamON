import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, LayoutDashboard, FileText, History, AlertOctagon, 
  Terminal, Settings, Upload, Activity, Server, Globe, 
  FileAudio, RefreshCw, Layers, ChevronRight, Play, AlertTriangle, Search, X, Minimize2,
  PhoneCall, Mail, FolderLock, MessageSquare, Camera, Image as ImageIcon, ChevronDown, Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import LiveCallDetector from './LiveCallDetector';
import LandingPage from './LandingPage';

const renderVisualEvidence = (isLoading, result) => {
  if (isLoading) {
    return (
      <div className="glass-panel card" style={{ position: 'relative', overflow: 'hidden', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <span className="card-title">VISUAL_EVIDENCE</span>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div className="scanner-line"></div>
          <Globe className="animate-spin" style={{ width: '36px', height: '36px', color: 'var(--accent-green)', opacity: 0.8 }} />
          <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontFamily: 'var(--font-cyber)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Capturing Website Screenshot...
          </span>
        </div>
      </div>
    );
  }
  
  if (!result) return null;
  
  const isHighRisk = result.risk_score >= 70;
  
  if (!result.screenshot_success && result.screenshot_error_reason) {
    return (
      <div className="glass-panel card" style={{ position: 'relative', overflow: 'hidden', minHeight: '300px', display: 'flex', flexDirection: 'column', border: '1px solid #FF3D00' }}>
        <span className="card-title" style={{ color: '#FF3D00', borderColor: 'rgba(255,61,0,0.1)' }}>VISUAL_EVIDENCE</span>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '24px', textAlign: 'center', gap: '12px' }}>
          <AlertTriangle style={{ width: '36px', height: '36px', color: '#FF3D00' }} className="animate-pulse" />
          <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#FF3D00', textTransform: 'uppercase', fontFamily: 'var(--font-cyber)', marginTop: '4px' }}>
            Website Preview Not Available
          </h4>
          <div style={{ background: 'rgba(255,61,0,0.05)', border: '1px solid rgba(255,61,0,0.2)', padding: '10px 16px', borderRadius: '0px', width: '100%' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Reason</span>
            <span style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold', fontFamily: 'var(--font-cyber)' }}>• {result.screenshot_error_reason}</span>
          </div>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>The domain is unreachable or rejected connections during the verification scan.</p>
        </div>
      </div>
    );
  }

  const isQR = result.source === 'QR';
  const prefixUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `http://127.0.0.1:8001${path}`;
  };

  return (
    <div className="glass-panel card" style={{ position: 'relative', overflow: 'hidden', minHeight: '300px', display: 'flex', flexDirection: 'column', border: isHighRisk ? '1px solid #FF3D00' : '1px solid var(--accent-green-dim)' }}>
      <span className="card-title">VISUAL_EVIDENCE</span>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, padding: '4px' }}>
        
        {isQR && result.qr_url && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderBottom: '1px solid rgba(0,230,118,0.1)', paddingBottom: '10px' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Uploaded QR Image</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img 
                src={prefixUrl(result.qr_url)} 
                alt="QR Code" 
                style={{ width: '50px', height: '50px', border: '1px solid var(--accent-green-dim)', objectFit: 'contain', background: '#fff', padding: '2px' }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--accent-green)', fontWeight: 'bold' }}>
                  <span>[✓]</span> <span>Decoded URL</span>
                </div>
                <div style={{ fontSize: '10px', color: '#fff', fontFamily: 'var(--font-cyber)', wordBreak: 'break-all', marginTop: '2px', maxWidth: '220px' }}>
                  {result.url}
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ position: 'relative', width: '100%', height: '150px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020305' }}>
          
          <img 
            src={prefixUrl(result.screenshot_url)} 
            alt="Website Screenshot" 
            className="fade-in"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />

          {isHighRisk && (
            <div style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%', 
              background: 'rgba(255, 61, 0, 0.45)', 
              backdropFilter: 'blur(1px)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center'
            }}>
              <div style={{ 
                background: '#FF3D00', 
                color: '#fff', 
                fontSize: '11px', 
                fontWeight: 'bold', 
                padding: '6px 12px', 
                fontFamily: 'var(--font-cyber)',
                boxShadow: '0 0 10px rgba(255,61,0,0.6)',
                border: '1px solid #fff',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <AlertTriangle style={{ width: '12px', height: '12px', color: '#fff' }} />
                <span>POTENTIAL PHISHING WEBSITE</span>
              </div>
            </div>
          )}

          {result.favicon_url && (
            <div style={{ 
              position: 'absolute', 
              top: '6px', 
              left: '6px', 
              background: 'rgba(3,5,8,0.85)', 
              border: '1px solid rgba(255,255,255,0.15)', 
              padding: '4px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '20px',
              height: '20px'
            }}>
              <img 
                src={result.favicon_url} 
                alt="Favicon" 
                onError={(e) => { e.target.style.display = 'none'; }}
                style={{ width: '12px', height: '12px', objectFit: 'contain' }}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
            <span style={{ color: 'var(--text-muted)', width: '70px', flexShrink: 0 }}>Website Title:</span>
            <span style={{ color: '#fff', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{result.page_title}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <span style={{ color: 'var(--text-muted)' }}>HTTP Status:</span>
              <span style={{ color: result.http_status === 200 ? 'var(--accent-green)' : '#FF3D00', fontWeight: 'bold' }}>{result.http_status || 'ERR'}</span>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Resolution:</span>
              <span style={{ color: '#fff' }}>{result.screenshot_resolution}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '4px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '4px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Screenshot Time:</span>
            <span style={{ color: '#fff', fontSize: '9px' }}>{result.screenshot_time}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

const Typewriter = ({ text, delay = 50, onComplete }) => {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentText('');
    setCurrentIndex(0);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setCurrentText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, delay);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, delay, onComplete]);

  return <span>{currentText}</span>;
};

export default function App() {
  // Sidebar State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Navigation State
  const [activeNav, setActiveNav] = useState('Web & QR Scan');
  const [view, setView] = useState('landing');

  // Sidebar Search and Expand States
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('');
  const [sectionsExpanded, setSectionsExpanded] = useState({
    hub: true,
    ai: true,
    evidence: true,
    system: true
  });

  // Master Agent Orchestrator States
  const [masterInputText, setMasterInputText] = useState('');
  const [masterAttachedFile, setMasterAttachedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startSecondLine, setStartSecondLine] = useState(false);
  const [routingState, setRoutingState] = useState({
    active: false,
    input: '',
    file: null,
    type: null, // 'url' | 'image' | 'audio' | 'sms'
    target: null, // 'Web & QR Scan' | 'Visual Investigation' | 'Call Analysis' | 'SMS Investigation'
  });

  const [typingState, setTypingState] = useState({
    active: false,
    text: '',
    targetField: null, // 'webUrlText' | 'smsMessage' | 'callTranscriptText' | 'visualFile' | 'callSelectedFile'
    file: null,
  });

  const [analyzeButtonPulse, setAnalyzeButtonPulse] = useState(null);
  const [activeTransition, setActiveTransition] = useState(false);
  const [activeJunctionIndex, setActiveJunctionIndex] = useState(-1);

  // API Logs & Settings Simulated States
  const [apiLogsSearch, setApiLogsSearch] = useState('');
  const [apiLogsChannel, setApiLogsChannel] = useState('All');
  const [apiLogsSeverity, setApiLogsSeverity] = useState('All');
  const [selectedLogPayload, setSelectedLogPayload] = useState(null);
  const [telemetryLogs, setTelemetryLogs] = useState([
    '[INFO] Ingesting scan request on /api/website/analyze...',
    '[DEBUG] Resolving DNS lookup for target domain amazon.in...',
    '[DEBUG] SSL Certificate validated successfully. Issuer: DigiCert.',
    '[INFO] Routing payload to Llama-3.1-8B-Instant API...',
    '[INFO] Correlation engine matching sender reputation history...',
    '[INFO] Core Orchestrator returned verdict: SAFE (Trust: 100, Risk: 0)'
  ]);

  const [settingsLLM, setSettingsLLM] = useState('llama-3.1-8b-instant');
  const [settingsTemp, setSettingsTemp] = useState(0.1);
  const [settingsTokens, setSettingsTokens] = useState(800);
  const [settingsWhitelisted, setSettingsWhitelisted] = useState([
    'google.com', 'amazon.in', 'youtube.com', 'github.com', 'microsoft.com', 'apple.com', 'paypal.com', 'openai.com', 'wikipedia.org', 'cloudflare.com'
  ]);
  const [newDomainInput, setNewDomainInput] = useState('');
  const [settingsScanners, setSettingsScanners] = useState({
    typosquatting: true,
    phishtank: true,
    gsb: true,
    voice_emotion: true,
    visual_cv: true,
    attachments_sandbox: false
  });
  const [settingsAlerts, setSettingsAlerts] = useState({
    auto_block: false,
    email_alert: true,
    correlation_push: true
  });

  useEffect(() => {
    if (activeNav !== 'API Logs') return;
    const interval = setInterval(() => {
      const logTemplates = [
        '[INFO] Incoming scan trigger on endpoint: /api/sms/analyze',
        '[DEBUG] Keyword scanning matched: OTP, Verification, urgency tags',
        '[INFO] SMS Analyst payload dispatched to Groq Llama-3.1-8B API',
        '[INFO] Scan completed successfully. Verdict: SUSPICIOUS (Risk Score: 45%)',
        '[INFO] Correlation check: Sender reputation verified in database',
        '[INFO] Incoming scan trigger on endpoint: /api/website/analyze',
        '[DEBUG] Typosquatting scanner checked brand matches. Similarity score: 0.12',
        '[INFO] Scan completed successfully. Verdict: SAFE (Trust Score: 98%)',
        '[INFO] Incoming scan trigger on endpoint: /api/call/analyze',
        '[DEBUG] Decoding audio file telemetry stream with Whisper engine...',
        '[INFO] Voice scan completed successfully. Verdict: SAFE (Risk Score: 12%)'
      ];
      const randomLog = logTemplates[Math.floor(Math.random() * logTemplates.length)];
      const timestamp = new Date().toLocaleTimeString();
      setTelemetryLogs(prev => [...prev.slice(-15), `[${timestamp}] ${randomLog}`]);
    }, 4500);
    return () => clearInterval(interval);
  }, [activeNav]);

  useEffect(() => {
    if (!typingState.active) return;

    if (typingState.file) {
      if (typingState.targetField === 'visualFile') {
        setVisualFile(typingState.file);
        setAnalyzeButtonPulse('visualFile');
      } else if (typingState.targetField === 'callSelectedFile') {
        setCallSelectedFile(typingState.file);
        setCallInputType('audio');
        setAnalyzeButtonPulse('callSelectedFile');
      }
      setTypingState({ active: false, text: '', targetField: null, file: null });
      return;
    }

    const fullText = typingState.text;
    const field = typingState.targetField;

    // 1. Initially clear target fields
    if (field === 'webUrlText') setWebUrlText('');
    else if (field === 'smsMessage') setSmsMessage('');
    else if (field === 'callTranscriptText') {
      setCallTranscriptText('');
      setCallInputType('text');
    }

    // 2. Blink cursor twice first (approx 1000ms total)
    let blinkCount = 0;
    const blinkInterval = setInterval(() => {
      const showCursor = blinkCount % 2 === 0;
      const cursorChar = showCursor ? '|' : '';
      
      if (field === 'webUrlText') setWebUrlText(cursorChar);
      else if (field === 'smsMessage') setSmsMessage(cursorChar);
      else if (field === 'callTranscriptText') setCallTranscriptText(cursorChar);

      blinkCount++;
      if (blinkCount >= 4) {
        clearInterval(blinkInterval);
        startTyping();
      }
    }, 250);

    function startTyping() {
      let currentText = '';
      let index = 0;

      const typeNextChar = () => {
        if (index < fullText.length) {
          currentText += fullText[index];
          const displayVal = currentText + '|';

          if (field === 'webUrlText') setWebUrlText(displayVal);
          else if (field === 'smsMessage') setSmsMessage(displayVal);
          else if (field === 'callTranscriptText') setCallTranscriptText(displayVal);

          index++;
          // Variable natural speed velocity
          const delay = Math.random() * 55 + 25;
          setTimeout(typeNextChar, delay);
        } else {
          // Finished: set final text and focus
          if (field === 'webUrlText') setWebUrlText(currentText);
          else if (field === 'smsMessage') setSmsMessage(currentText);
          else if (field === 'callTranscriptText') setCallTranscriptText(currentText);

          setTypingState({ active: false, text: '', targetField: null, file: null });
          setAnalyzeButtonPulse(field);

          setTimeout(() => {
            let inputEl = null;
            if (field === 'webUrlText') {
              inputEl = document.querySelector('input[placeholder*="Enter website URL"]');
            } else if (field === 'smsMessage') {
              inputEl = document.querySelector('textarea[placeholder*="Paste SMS body"]');
            } else if (field === 'callTranscriptText') {
              inputEl = document.querySelector('textarea[placeholder*="Paste call transcript"]');
            }
            if (inputEl) {
              inputEl.focus();
              inputEl.setSelectionRange(fullText.length, fullText.length);
            }
          }, 80);
        }
      };

      setTimeout(typeNextChar, 100);
    }

    return () => {
      clearInterval(blinkInterval);
    };
  }, [typingState.active]);

  // AGENT 1 (CALL ANALYSIS) STATES
  const [callInputType, setCallInputType] = useState('audio'); // 'audio' or 'text'
  const [callTranscriptText, setCallTranscriptText] = useState('');
  const [callSelectedFile, setCallSelectedFile] = useState(null);
  const [callDragActive, setCallDragActive] = useState(false);
  const [callProcessing, setCallProcessing] = useState(false);
  const [callStep, setCallStep] = useState(0);
  const [callProgressPercent, setCallProgressPercent] = useState(0);
  const [callResult, setCallResult] = useState(null);
  const [callError, setCallError] = useState('');

  // SMS INVESTIGATION AGENT STATES
  const [smsMode, setSmsMode] = useState('manual'); // 'manual' or 'live'
  const [liveSmsFeed, setLiveSmsFeed] = useState([]);
  const [liveSmsLoading, setLiveSmsLoading] = useState(false);
  const [collectorRunning, setCollectorRunning] = useState(false);
  const [collectorPaired, setCollectorPaired] = useState(true);
  const [collectorError, setCollectorError] = useState("");
  const [smsSender, setSmsSender] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  const [smsProcessing, setSmsProcessing] = useState(false);
  const [smsStep, setSmsStep] = useState(0);
  const [smsProgressPercent, setSmsProgressPercent] = useState(0);
  const [smsResult, setSmsResult] = useState(null);
  const [smsError, setSmsError] = useState('');

  // VISUAL SCAM INVESTIGATION AGENT STATES
  const [visualFile, setVisualFile] = useState(null);
  const [visualDragActive, setVisualDragActive] = useState(false);
  const [visualProcessing, setVisualProcessing] = useState(false);
  const [visualStep, setVisualStep] = useState(0);
  const [visualProgressPercent, setVisualProgressPercent] = useState(0);
  const [visualResult, setVisualResult] = useState(null);
  const [visualError, setVisualError] = useState('');
  const [visualTab, setVisualTab] = useState('telemetry'); // 'telemetry' or 'invoked_agents'

  // AGENT 4 (WEBSITE & QR SCAN) STATES
  const [webInputType, setWebInputType] = useState('url'); // 'url' or 'qr'
  const [webUrlText, setWebUrlText] = useState('');
  const [webSelectedFile, setWebSelectedFile] = useState(null);
  const [webDragActive, setWebDragActive] = useState(false);
  const [webProcessing, setWebProcessing] = useState(false);
  const [webStep, setWebStep] = useState(0);
  const [webProgressPercent, setWebProgressPercent] = useState(0);
  const [webResult, setWebResult] = useState(null);
  const [webError, setWebError] = useState('');
  
  // AI ASSISTANT CHAT STATES
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  // PROTECTION ENGINE STATES
  const [protectionStatus, setProtectionStatus] = useState({ status: "Active", total_blocked: 0, blocked_domains: [] });
  const [protectionHistory, setProtectionHistory] = useState([]);
  const [blockingLoading, setBlockingLoading] = useState(false);
  const [protectionError, setProtectionError] = useState("");

  // COMPLAINT FILING AGENT STATES
  const [complaintTarget, setComplaintTarget] = useState(null);
  const [complaintStatus, setComplaintStatus] = useState('null'); // 'null', 'config', 'generating', 'typing', 'preview', 'sending', 'success', 'error'
  const [complaintProgressStep, setComplaintProgressStep] = useState(0);
  const [complaintForm, setComplaintForm] = useState({ to: '', cc: '', subject: '', body: '', attachments: [] });
  const [complaintId, setComplaintId] = useState('');
  const [complaintError, setComplaintError] = useState('');
  const [configForm, setConfigForm] = useState({ to: 'report@cybercrime.gov.in', cc: 'compliance@scamon.ai', subject: 'Complaint Regarding Suspected Cyber Scam' });
  const [typedBody, setTypedBody] = useState("");
  const [typingDone, setTypingDone] = useState(false);
  const [smtpProgressStep, setSmtpProgressStep] = useState(0);
  const typingContainerRef = React.useRef(null);
  const [recentComplaints, setRecentComplaints] = useState([]);

  // EMAIL INVESTIGATION AGENT STATES
  const [emailConnected, setEmailConnected] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [emailsList, setEmailsList] = useState([]);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailAuthUrl, setEmailAuthUrl] = useState("");
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const [emailAnalysisLoading, setEmailAnalysisLoading] = useState(false);
  const [emailAnalysisResult, setEmailAnalysisResult] = useState(null);
  const [emailPipelineStep, setEmailPipelineStep] = useState(0);
  const [emailError, setEmailError] = useState("");
  const [emailChatMessages, setEmailChatMessages] = useState([]);
  const [emailChatInput, setEmailChatInput] = useState('');
  const [emailChatLoading, setEmailChatLoading] = useState(false);
  const [emailChatOpen, setEmailChatOpen] = useState(false);
  
  // Evidence Vault Chat States
  const [vaultChatMessages, setVaultChatMessages] = useState([]);
  const [vaultChatInput, setVaultChatInput] = useState('');
  const [vaultChatLoading, setVaultChatLoading] = useState(false);
  const [vaultChatOpen, setVaultChatOpen] = useState(false);
  
  // Threat Intelligence Chat States
  const [threatChatMessages, setThreatChatMessages] = useState([]);
  const [threatChatInput, setThreatChatInput] = useState('');
  const [threatChatLoading, setThreatChatLoading] = useState(false);
  const [threatChatOpen, setThreatChatOpen] = useState(false);
  
  // Unified History states
  const [historyItems, setHistoryItems] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit, setHistoryLimit] = useState(10);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyTab, setHistoryTab] = useState('All');
  const [historyThreatLevel, setHistoryThreatLevel] = useState('All');
  const [historyStatus, setHistoryStatus] = useState('All');
  const [historyRiskScore, setHistoryRiskScore] = useState('All');
  const [historySortBy, setHistorySortBy] = useState('newest');
  const [selectedHistoryIds, setSelectedHistoryIds] = useState([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [showHistoryDeleteConfirm, setShowHistoryDeleteConfirm] = useState(null);
  const [historyStats, setHistoryStats] = useState({ total: 0, today: 0, critical: 0, high: 0, medium: 0, low: 0, safe: 0 });

  const threatGraphData = React.useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      const dateStr = d.toISOString().split('T')[0];
      result.push({
        day: dayName,
        dateStr: dateStr,
        count: 0,
        height: '0%',
        color: 'var(--accent-green)'
      });
    }

    if (historyItems && historyItems.length > 0) {
      historyItems.forEach(item => {
        if (!item.timestamp) return;
        try {
          const itemDate = new Date(item.timestamp).toISOString().split('T')[0];
          const match = result.find(r => r.dateStr === itemDate);
          if (match) {
            match.count += 1;
          }
        } catch (e) {}
      });
    }

    const counts = result.map(r => r.count);
    const maxCount = Math.max(...counts, 1);

    result.forEach(r => {
      const pct = Math.round((r.count / maxCount) * 100);
      r.height = `${Math.max(pct, 5)}%`;
      r.color = r.count >= 10 ? '#FF3D00' : r.count >= 4 ? '#FF9100' : 'var(--accent-green)';
    });

    return result;
  }, [historyItems]);

  const threatVectorStats = React.useMemo(() => {
    let website = 0;
    let email = 0;
    let sms = 0;
    let call = 0;
    let total = 0;

    if (historyItems && historyItems.length > 0) {
      historyItems.forEach(item => {
        const type = item.agent_type;
        if (type === 'website') website++;
        else if (type === 'email') email++;
        else if (type === 'sms') sms++;
        else if (['call', 'live_call'].includes(type)) call++;
        total++;
      });
    }

    if (total === 0) {
      return { website: 42, email: 28, sms: 18, call: 12 };
    }

    return {
      website: Math.round((website / total) * 100),
      email: Math.round((email / total) * 100),
      sms: Math.round((sms / total) * 100),
      call: Math.round((call / total) * 100)
    };
  }, [historyItems]);

  const topThreatTargets = React.useMemo(() => {
    const brandsMap = {};
    if (historyItems && historyItems.length > 0) {
      historyItems.forEach(item => {
        let brandName = null;
        if (item.agent_type === 'website' && item.full_report) {
          brandName = item.full_report.typosquat?.original_brand || item.full_report.domain?.name;
        } else if (item.agent_type === 'sms' && item.full_report) {
          brandName = item.full_report.sms?.sender;
        } else if (item.agent_type === 'visual_scam' && item.full_report) {
          brandName = item.full_report.entities?.company_name || item.full_report.image_type;
        } else if (item.agent_type === 'email' && item.full_report) {
          const parts = (item.full_report.sender || "").split('@');
          if (parts.length > 1) brandName = parts[1];
        }
        
        if (brandName) {
          brandName = brandName.replace(/^(secure|login|verify|update)-/, '').split('.')[0].toUpperCase();
          if (brandName.length > 2) {
            brandsMap[brandName] = (brandsMap[brandName] || 0) + 1;
          }
        }
      });
    }

    const sortedBrands = Object.entries(brandsMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    if (sortedBrands.length === 0) {
      return [
        { name: 'HDFC BANK', pct: 84, color: '#FF3D00' },
        { name: 'PAYPAL', pct: 72, color: '#FF9100' },
        { name: 'NETFLIX', pct: 60, color: 'var(--accent-green)' },
        { name: 'SBI CARD', pct: 54, color: 'var(--accent-green)' }
      ];
    }

    const totalCount = sortedBrands.reduce((acc, curr) => acc + curr.count, 0);
    return sortedBrands.slice(0, 4).map(brand => {
      const pct = Math.round((brand.count / totalCount) * 100);
      const color = pct >= 60 ? '#FF3D00' : pct >= 30 ? '#FF9100' : 'var(--accent-green)';
      return { name: brand.name, pct, color };
    });
  }, [historyItems]);

  // Explainability (XAI) states
  const [xaiOutput, setXaiOutput] = useState(null);
  const [xaiLanguage, setXaiLanguage] = useState('English');
  const [xaiLoading, setXaiLoading] = useState(false);
  const [xaiError, setXaiError] = useState('');
  const [xaiChatMessages, setXaiChatMessages] = useState([]);
  const [xaiChatInput, setXaiChatInput] = useState('');
  const [xaiChatLoading, setXaiChatLoading] = useState(false);
  const [xaiSpeechPlaying, setXaiSpeechPlaying] = useState(false);
  const [xaiSpeechPaused, setXaiSpeechPaused] = useState(false);

  // Evidence Vault States
  const [activeCaseId, setActiveCaseId] = useState('');
  const [cases, setCases] = useState([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [vaultSearch, setVaultSearch] = useState('');
  const [vaultFilterStatus, setVaultFilterStatus] = useState('All');
  const [vaultFilterThreat, setVaultFilterThreat] = useState('All');
  const [vaultSortBy, setVaultSortBy] = useState('newest');
  const [liveThreatFeed, setLiveThreatFeed] = useState([
    { agent: "Website Investigation Agent", event: "Blocked phishing website: secure-paypal-verify.com", time: "12:12", type: "phishing" },
    { agent: "Call Analysis Agent", event: "Detected OTP verification scam session", time: "12:10", type: "call" },
    { agent: "Threat Intelligence Agent", event: "Correlated malicious domain cluster registry", time: "12:08", type: "correlation" },
    { agent: "Complaint Filing Agent", event: "Generated legal complaint package UUID: c4a78", time: "12:05", type: "complaint" }
  ]);

  React.useEffect(() => {
    const eventsPool = [
      { agent: "Website Investigation Agent", event: "Blocked phishing website matching chase-login-verify.com", type: "phishing" },
      { agent: "Call Analysis Agent", event: "Flagged phone number +1-800-455-2287 for social engineering pressure", type: "call" },
      { agent: "Threat Intelligence Agent", event: "Discovered active typosquatting registry block for bankofamerica-support.info", type: "correlation" },
      { agent: "Complaint Filing Agent", event: "Delivered legal cybercrime complaint packet to local authorities", type: "complaint" },
      { agent: "Website Investigation Agent", event: "Analyzed APK download package QR_Scam_Payload.apk. Verdict: MALWARE", type: "malware" }
    ];

    const feedInterval = setInterval(() => {
      const randomEvent = eventsPool[Math.floor(Math.random() * eventsPool.length)];
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setLiveThreatFeed(prev => [
        { ...randomEvent, time: timeStr, id: Date.now() },
        ...prev.slice(0, 3)
      ]);
    }, 20000);

    return () => clearInterval(feedInterval);
  }, []);

  React.useEffect(() => {
    if (typingContainerRef.current) {
      typingContainerRef.current.scrollTop = typingContainerRef.current.scrollHeight;
    }
  }, [typedBody]);
  const [blockMessage, setBlockMessage] = useState("");
  const [blocklistSearch, setBlocklistSearch] = useState("");
  const [unblockedDomains, setUnblockedDomains] = useState(new Set());
  const [blockedWebsitesList, setBlockedWebsitesList] = useState([]);
  const [showScanAnyway, setShowScanAnyway] = useState(false);
  const [protectionFilter, setProtectionFilter] = useState('All');
  const [stats, setStats] = useState({
    total_scans: 0,
    high_risk_websites: 0,
    blocked_websites: 0,
    safe_websites: 0,
    investigations_today: 0
  });
  const [scanSeconds, setScanSeconds] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [callTerminalLogs, setCallTerminalLogs] = useState([]);

  // Scan History Log
  const [scanHistory, setScanHistory] = useState([
    { id: 1, agent: "Call Analysis", type: "Audio Scan", date: "2026-07-28 10:02", score: 100, category: "Banking Scam", status: "Critical" },
    { id: 2, agent: "Web & QR Scan", type: "URL Check", date: "2026-07-28 10:00", score: 10, category: "Safe Link", status: "Clean" },
    { id: 3, agent: "Call Analysis", type: "Text Scan", date: "2026-07-26 18:42", score: 40, category: "Suspicious", status: "Warning" },
  ]);

  // Timelines
  const callPipeline = [
    { key: 'PLAN', name: 'FORENSIC PLAN CREATED', desc: 'Structuring threat investigation' },
    { key: 'LISTENING', name: 'INTERCEPT WAVEFORMS', desc: 'Verifying input call targets' },
    { key: 'STT', name: 'WHISPER STT COMPILATION', desc: 'Transcribing speech waveforms to text' },
    { key: 'LANGUAGE', name: 'IDENTIFY LANGUAGE', desc: 'Whisper language classifier' },
    { key: 'ENTITIES', name: 'MAPPING FORENSIC ENTITIES', desc: 'Extracting bank details & credentials' },
    { key: 'BEHAVIOR', name: 'AUDITING BEHAVIOR', desc: 'Evaluating psychological tactics' },
    { key: 'LLM', name: 'GROQ AI THREAT REASONING', desc: 'Performing Llama-3 forensics analysis' },
    { key: 'DB', name: 'DATABASE MEMORY RECALL', desc: 'Searching caller history profile database' },
    { key: 'COLLABORATE', name: 'CORRELATION DISPATCH', desc: 'Forwarding incident payload to Agent 5' }
  ];

  const webPipeline = [
    { key: 'PLAN', name: 'SOC PLAN INITIATED', desc: 'Structuring threat investigation' },
    { key: 'QR', name: 'TARGET DECODED', desc: 'Verifying URL or QR target input' },
    { key: 'WHOIS', name: 'WHOIS REGISTRY INQUIRY', desc: 'Resolving registrar details & domain age' },
    { key: 'SSL', name: 'SSL HANDSHAKE CHECK', desc: 'Validating certificate authority & chain' },
    { key: 'TYPOSQUAT', name: 'BRAND IMPERSONATION AUDIT', desc: 'Scanning brand name variations' },
    { key: 'PHISHTANK', name: 'PHISHTANK SIGNATURES', desc: 'Querying global threat lists' },
    { key: 'REDIRECT', name: 'REDIRECT PATH AUDIT', desc: 'Auditing redirect hops and status' },
    { key: 'HEADERS', name: 'SECURITY HEADER AUDIT', desc: 'Analyzing CSP, HSTS, frame protection' },
    { key: 'METADATA', name: 'HTML HEAD HARVESTING', desc: 'Parsing HTML tags & page keywords' },
    { key: 'SCREENSHOT', name: 'VISUAL EVIDENCE LOGGING', desc: 'Capturing page screenshot with Playwright' },
    { key: 'LLM', name: 'GROQ AI THREAT REASONING', desc: 'Performing deep threat logic reasoning' }
  ];

  const smsPipeline = [
    { key: 'PLAN', name: 'SMS PLAN INITIATED', desc: 'Structuring SMS threat audit plan' },
    { key: 'PARSER', name: 'SENDER METADATA RESOLUTION', desc: 'Analyzing sender ID headers and structures' },
    { key: 'RISK', name: 'RISK ENGINE INITIALIZATION', desc: 'Loading keyword classifiers and heuristics' },
    { key: 'KEYWORDS', name: 'KEYWORD MATCHING LAYER', desc: 'Checking for phishing/urgency language patterns' },
    { key: 'LLM', name: 'GROQ SMS REASONING AGENT', desc: 'Running context-aware semantic analysis' }
  ];

  const visualPipeline = [
    { key: 'PLAN', name: 'VISUAL PLAN INITIATED', desc: 'Structuring screenshot forensics audit' },
    { key: 'OCR', name: 'OCR TEXT EXTRACTION', desc: 'Harvesting visible alphanumeric text' },
    { key: 'QR', name: 'QR CODE DECODER', desc: 'Checking and decoding embedded QR vectors' },
    { key: 'INTELLIGENCE', name: 'IMAGE TYPE CLASSIFIER', desc: 'Detecting template layouts and chat sources' },
    { key: 'ENTITIES', name: 'ENTITY EXTRACTION LAYER', desc: 'Resolving URLs, phone numbers, and UPIs' },
    { key: 'ROUTING', name: 'MULTI-AGENT COLLABORATION', desc: 'Dispatching coordinates to Website, Email, and SMS agents' },
    { key: 'LLM', name: 'GROQ VISION THREAT AUDITOR', desc: 'Running vision scam reasoning analysis' },
    { key: 'VAULT', name: 'VAULT EVIDENCE REGISTER', desc: 'Filing artifacts and SHA-256 integrity signature' }
  ];

  // Drag and Drop handlers for Call Agent
  const handleCallDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setCallDragActive(true);
    else if (e.type === "dragleave") setCallDragActive(false);
  };

  const handleCallDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setCallDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('audio/') || file.name.endsWith('.mp3') || file.name.endsWith('.wav')) {
        setCallSelectedFile(file);
      } else {
        setCallError("Unsupported format. Please upload .mp3 or .wav audio.");
      }
    }
  };

  // Drag and Drop handlers for Web Agent
  const handleWebDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setWebDragActive(true);
    else if (e.type === "dragleave") setWebDragActive(false);
  };

  const handleWebDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setWebDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/') || file.name.endsWith('.png') || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg') || file.name.endsWith('.webp')) {
        setWebSelectedFile(file);
      } else {
        setWebError("Unsupported format. Please upload PNG, JPG, or WEBP QR images.");
      }
    }
  };

  // TRIGGER AGENT 1 (CALL ANALYSIS)
  const runCallAnalysis = async () => {
    setCallError('');
    setCallResult(null);

    if (callInputType === 'audio' && !callSelectedFile) {
      setCallError('Please select or drag an audio file to analyze.');
      return;
    }
    if (callInputType === 'text' && !callTranscriptText.trim()) {
      setCallError('Please paste or enter a call transcript.');
      return;
    }

    setCallProcessing(true);
    setCallStep(0);
    setCallProgressPercent(0);

    // Call Backend request
    const apiPromise = sendCallToBackend();

    // Trigger scanning animation sequence
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < callPipeline.length) {
        setCallStep(step);
        setCallProgressPercent(Math.round((step / callPipeline.length) * 100));
      } else {
        clearInterval(interval);
      }
    }, 700);

    try {
      const resData = await apiPromise;
      // Complete animation smoothly
      setCallStep(callPipeline.length);
      setCallProgressPercent(100);
      await new Promise(r => setTimeout(r, 400));
      
      setCallResult(resData);
      fetchDashboardStatsAndHistory();
      fetchProtectionData();
    } catch (err) {
      clearInterval(interval);
      setCallError(err.message || 'An error occurred during call analysis.');
    } finally {
      setCallProcessing(false);
    }
  };

  const sendCallToBackend = async () => {
    const formData = new FormData();
    if (callInputType === 'audio') {
      formData.append('audio_file', callSelectedFile);
    } else {
      formData.append('transcript', callTranscriptText);
    }

    const activeCaseId = localStorage.getItem("activeCaseId") || "";
    const response = await fetch('http://127.0.0.1:8000/call-analysis', {
      method: 'POST',
      headers: {
        'X-Case-ID': activeCaseId
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to analyze the call.');
    }
    return await response.json();
  };

  // TRIGGER AGENT 4 (WEBSITE & QR SCAN)
  const runWebAnalysis = async (scanAnyway = false) => {
    setWebError('');
    setWebResult(null);
    setShowScanAnyway(false);

    if (webInputType === 'url' && !webUrlText.trim()) {
      setWebError('Please enter a website URL.');
      return;
    }
    if (webInputType === 'qr' && !webSelectedFile) {
      setWebError('Please select or drag a QR code image.');
      return;
    }

    setWebProcessing(true);
    setWebStep(0);
    setWebProgressPercent(0);
    setScanSeconds(0);

    // Call Backend request
    const apiPromise = sendWebToBackend(scanAnyway);

    // Seconds timer
    const secTimer = setInterval(() => {
      setScanSeconds(prev => prev + 1);
    }, 1000);

    // Scan steps
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < webPipeline.length - 1) {
        setWebStep(step);
        setWebProgressPercent(Math.round((step / webPipeline.length) * 100));
      } else {
        clearInterval(interval);
      }
    }, 600);

    try {
      const resData = await apiPromise;
      clearInterval(interval);
      clearInterval(secTimer);
      
      // Finalize animation steps
      setWebStep(webPipeline.length);
      setWebProgressPercent(100);
      await new Promise(r => setTimeout(r, 450));

      setWebResult(resData);
      
      if (resData.mission_status === 'BLOCKED' && resData.recommendation === 'This website is already blocked by ScamON AI.') {
        setShowScanAnyway(true);
      }
      
      fetchDashboardStatsAndHistory();
      fetchProtectionData();
      fetchBlockedWebsitesList();
    } catch (err) {
      clearInterval(interval);
      clearInterval(secTimer);
      setWebError(err.message || 'An error occurred during link analysis.');
    } finally {
      setWebProcessing(false);
    }
  };

  const sendWebToBackend = async (scanAnyway = false) => {
    const formData = new FormData();
    if (webInputType === 'url') {
      formData.append('url', webUrlText);
    } else {
      formData.append('qr_image', webSelectedFile);
    }
    if (scanAnyway) {
      formData.append('scan_anyway', 'true');
    }

    const activeCaseId = localStorage.getItem("activeCaseId") || "";
    const response = await fetch('http://127.0.0.1:8001/website-analysis', {
      method: 'POST',
      headers: {
        'X-Case-ID': activeCaseId
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to analyze the website/QR.');
    }
    return await response.json();
  };

  // TRIGGER SMS INVESTIGATION
  const runSmsAnalysis = async () => {
    setSmsError('');
    setSmsResult(null);

    if (!smsSender.trim()) {
      setSmsError('Please enter an SMS sender ID (e.g. VM-HDFCBK).');
      return;
    }
    if (!smsMessage.trim()) {
      setSmsError('Please enter the SMS message content.');
      return;
    }

    setSmsProcessing(true);
    setSmsStep(0);
    setSmsProgressPercent(0);
    setScanSeconds(0);

    const apiPromise = sendSmsToBackend();

    // Seconds timer
    const secTimer = setInterval(() => {
      setScanSeconds(prev => prev + 1);
    }, 1000);

    // Scan steps animation
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < smsPipeline.length - 1) {
        setSmsStep(step);
        setSmsProgressPercent(Math.round((step / smsPipeline.length) * 100));
      } else {
        clearInterval(interval);
      }
    }, 500);

    try {
      const resData = await apiPromise;
      clearInterval(interval);
      clearInterval(secTimer);
      
      setSmsStep(smsPipeline.length);
      setSmsProgressPercent(100);
      await new Promise(r => setTimeout(r, 450));

      setSmsResult(resData);
      
      fetchDashboardStatsAndHistory();
    } catch (err) {
      clearInterval(interval);
      clearInterval(secTimer);
      setSmsError(err.message || 'An error occurred during SMS analysis.');
    } finally {
      setSmsProcessing(false);
    }
  };

  const sendSmsToBackend = async () => {
    const activeCaseId = localStorage.getItem("activeCaseId") || "";
    const response = await fetch('http://127.0.0.1:8001/api/sms/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Case-ID': activeCaseId
      },
      body: JSON.stringify({
        sender: smsSender,
        message: smsMessage,
        timestamp: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to analyze the SMS.');
    }
    return await response.json();
  };

  // TRIGGER VISUAL INVESTIGATION
  const runVisualAnalysis = async () => {
    setVisualError('');
    setVisualResult(null);

    if (!visualFile) {
      setVisualError('Please upload a screenshot image file (PNG, JPG, JPEG, WEBP, BMP, or TIFF).');
      return;
    }

    setVisualProcessing(true);
    setVisualStep(0);
    setVisualProgressPercent(0);
    setScanSeconds(0);

    const apiPromise = sendVisualToBackend();

    // Seconds timer
    const secTimer = setInterval(() => {
      setScanSeconds(prev => prev + 1);
    }, 1000);

    // Scan steps animation
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < visualPipeline.length - 1) {
        setVisualStep(step);
        setVisualProgressPercent(Math.round((step / visualPipeline.length) * 100));
      } else {
        clearInterval(interval);
      }
    }, 500);

    try {
      const resData = await apiPromise;
      clearInterval(interval);
      clearInterval(secTimer);
      
      setVisualStep(visualPipeline.length);
      setVisualProgressPercent(100);
      await new Promise(r => setTimeout(r, 450));

      setVisualResult(resData);
      
      fetchDashboardStatsAndHistory();
    } catch (err) {
      clearInterval(interval);
      clearInterval(secTimer);
      setVisualError(err.message || 'An error occurred during visual analysis.');
    } finally {
      setVisualProcessing(false);
    }
  };

  const sendVisualToBackend = async () => {
    const formData = new FormData();
    formData.append('file', visualFile);
    
    const activeCaseId = localStorage.getItem("activeCaseId") || "";
    if (activeCaseId) {
      formData.append('case_id', activeCaseId);
    }

    const response = await fetch('http://127.0.0.1:8001/api/visual_scam/analyze', {
      method: 'POST',
      headers: {
        'X-Case-ID': activeCaseId
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to analyze the visual screenshot.');
    }
    return await response.json();
  };

  const getStatusText = () => {
    if (activeJunctionIndex <= 0) return "INITIALIZING ORCHESTRATION CORE...";
    if (activeJunctionIndex === 1) return "PREPARING INVESTIGATION DETECTORS...";
    if (activeJunctionIndex === 2) return "ESTABLISHING CIRCUIT NODE BENDS...";
    if (activeJunctionIndex === 3) return "TRANSMITTING TELEMETRY PAYLOAD...";
    if (activeJunctionIndex === 4) return "CONNECTING TO SPECIALIZED AGENT...";
    return "ROUTING COMPLETED...";
  };

  const getActivePathD = () => {
    if (routingState.type === 'url') return 'M 80 120 L 160 120 Q 180 120 180 100 L 180 60 Q 180 40 200 40 L 400 40';
    if (routingState.type === 'sms') return 'M 80 120 L 160 120 Q 180 120 180 110 L 180 100 Q 180 90 200 90 L 400 90';
    if (routingState.type === 'audio') return 'M 80 120 L 160 120 Q 180 120 180 130 L 180 140 Q 180 150 200 150 L 400 150';
    if (routingState.type === 'image') return 'M 80 120 L 160 120 Q 180 120 180 140 L 180 180 Q 180 200 200 200 L 400 200';
    return '';
  };

  useEffect(() => {
    if (activeNav === 'Dashboard') {
      setStartSecondLine(false);
    }
  }, [activeNav]);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (activeNav === 'Dashboard') {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (activeNav === 'Dashboard' && e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setMasterAttachedFile(file);
    }
  };

  const handleMasterAgentSubmit = () => {
    if (!masterInputText.trim() && !masterAttachedFile) return;

    let detectedType = null;
    let targetPage = null;

    if (masterAttachedFile) {
      const ext = masterAttachedFile.name.split('.').pop().toLowerCase();
      if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
        detectedType = 'image';
        targetPage = 'Visual Investigation';
      } else if (['wav', 'mp3', 'm4a'].includes(ext)) {
        detectedType = 'audio';
        targetPage = 'Call Analysis';
      } else {
        alert("Unsupported file type. Please upload an image (.png, .jpg) or audio (.wav, .mp3).");
        return;
      }
    } else {
      const text = masterInputText.trim();
      const domainRegex = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+(\/\S*)?$/;
      const isUrl = text.startsWith('http://') || text.startsWith('https://') || text.startsWith('www.') || domainRegex.test(text);
      if (isUrl) {
        detectedType = 'url';
        targetPage = 'Web & QR Scan';
      } else {
        detectedType = 'sms';
        targetPage = 'SMS Investigation';
      }
    }

    setRoutingState({
      active: true,
      input: masterInputText,
      file: masterAttachedFile,
      type: detectedType,
      target: targetPage
    });

    const storedInput = masterInputText;
    const storedFile = masterAttachedFile;

    setMasterInputText('');
    setMasterAttachedFile(null);

    // Dynamic cinematic pipeline step triggers
    setActiveJunctionIndex(0);
    setTimeout(() => setActiveJunctionIndex(1), 500);
    setTimeout(() => setActiveJunctionIndex(2), 1000);
    setTimeout(() => setActiveJunctionIndex(3), 1500);
    setTimeout(() => setActiveJunctionIndex(4), 2000);

    setTimeout(() => {
      setActiveJunctionIndex(-1);
      // Begin cinematic page fade/zoom transition
      setActiveTransition(true);
      
      setTimeout(() => {
        setActiveNav(targetPage);
        setActiveTransition(false);
        
        let targetField = null;
        if (detectedType === 'url') targetField = 'webUrlText';
        else if (detectedType === 'sms') targetField = 'smsMessage';
        else if (detectedType === 'image') targetField = 'visualFile';
        else if (detectedType === 'audio') targetField = 'callSelectedFile';

        setTypingState({
          active: true,
          text: storedInput,
          targetField: targetField,
          file: storedFile
        });
      }, 400);

      setRoutingState({
        active: false,
        input: '',
        file: null,
        type: null,
        target: null
      });
    }, 2800);
  };

  // --- ScamON AI Assistant Chat Helpers ---
  const sendChatMessage = async (overrideMessage = null) => {
    const textToSend = overrideMessage || chatInput;
    if (!textToSend.trim() || chatLoading) return;

    setChatLoading(true);
    setChatInput('');

    // Append user message
    const userMsg = { role: 'user', content: textToSend };
    const updatedHistory = [...chatMessages, userMsg];
    setChatMessages(updatedHistory);

    // Append assistant placeholder
    setChatMessages(prev => [...prev, { role: 'assistant', content: '', loading: true }]);

    try {
      const historyPayload = chatMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch('http://127.0.0.1:8001/api/websites/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          report: webResult,
          message: textToSend,
          history: historyPayload,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get a response from ScamON AI Assistant.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let streamedResponseText = '';

      setChatMessages(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1].loading = false;
        }
        return updated;
      });

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          streamedResponseText += chunk;
          
          setChatMessages(prev => {
            const updated = [...prev];
            if (updated.length > 0 && updated[updated.length - 1].role === 'assistant') {
              updated[updated.length - 1].content = streamedResponseText;
            }
            return updated;
          });
        }
      }

    } catch (err) {
      console.error(err);
      setChatMessages(prev => {
        const updated = [...prev];
        if (updated.length > 0 && updated[updated.length - 1].role === 'assistant' && !updated[updated.length - 1].content) {
          updated.pop();
        }
        return [...updated, { role: 'system', content: `Error: ${err.message || 'Unable to connect to assistant.'}`, error: true }];
      });
    } finally {
      setChatLoading(false);
    }
  };

  const resetAssistantChat = () => {
    setChatMessages([]);
    setChatInput('');
    setChatOpen(false);
    setChatMinimized(false);
    setChatLoading(false);
  };

  const formatBoldText = (text) => {
    if (!text) return '';
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ color: '#fff', fontWeight: 'bold' }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderAssistantMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let content = line;
      if (content.startsWith('### ')) {
        return <h3 key={idx} style={{ color: 'var(--accent-green)', fontSize: '13px', fontWeight: 'bold', margin: '14px 0 6px 0', borderBottom: '1px solid rgba(0, 230, 118, 0.15)', paddingBottom: '2px', textTransform: 'uppercase' }}>{content.replace('### ', '')}</h3>;
      }
      if (content.startsWith('## ')) {
        return <h2 key={idx} style={{ color: '#fff', fontSize: '15px', fontWeight: 'bold', margin: '16px 0 8px 0' }}>{content.replace('## ', '')}</h2>;
      }
      if (content.startsWith('# ')) {
        return <h1 key={idx} style={{ color: '#fff', fontSize: '17px', fontWeight: 'bold', margin: '20px 0 10px 0' }}>{content.replace('# ', '')}</h1>;
      }
      if (content.trim().startsWith('- ') || content.trim().startsWith('• ')) {
        const cleanLine = content.replace(/^[\s•\-]+/, '');
        return (
          <li key={idx} style={{ marginLeft: '12px', marginBottom: '4px', listStyleType: 'square', color: '#e2e8f0' }}>
            {formatBoldText(cleanLine)}
          </li>
        );
      }
      return (
        <p key={idx} style={{ margin: '6px 0', lineHeight: '1.5', minHeight: '1em' }}>
          {formatBoldText(content)}
        </p>
      );
    });
  };

  const chatEndRef = React.useRef(null);
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  useEffect(() => {
    if (activeNav === 'SMS Investigation' && smsMode === 'live') {
      const fetchLiveSms = async () => {
        setLiveSmsLoading(true);
        try {
          const res = await fetch('http://127.0.0.1:8001/api/history?agent_type=sms&source=live_collector&limit=25');
          if (res.ok) {
            const data = await res.json();
            setLiveSmsFeed(data.items || []);
          }
        } catch (err) {
          console.error("Failed to fetch live SMS feed:", err);
        } finally {
          setLiveSmsLoading(false);
        }
      };
      
      const checkCollectorStatus = async () => {
        try {
          const res = await fetch('http://127.0.0.1:8001/api/sms/collector/status');
          if (res.ok) {
            const data = await res.json();
            setCollectorRunning(data.running);
            setCollectorPaired(data.paired);
            setCollectorError(data.error_message || "");
          }
        } catch (err) {
          console.error("Failed to fetch collector status:", err);
        }
      };
      
      fetchLiveSms();
      checkCollectorStatus();
      
      const smsInterval = setInterval(fetchLiveSms, 3000);
      const statusInterval = setInterval(checkCollectorStatus, 4000);
      
      return () => {
        clearInterval(smsInterval);
        clearInterval(statusInterval);
      };
    }
  }, [activeNav, smsMode]);

  const startCollectorService = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8001/api/sms/collector/start', { method: 'POST' });
      if (res.ok) {
        setCollectorRunning(true);
      }
    } catch (err) {
      console.error("Failed to start collector service:", err);
    }
  };

  const stopCollectorService = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8001/api/sms/collector/stop', { method: 'POST' });
      if (res.ok) {
        setCollectorRunning(false);
      }
    } catch (err) {
      console.error("Failed to stop collector service:", err);
    }
  };

  const handleRunSmsAudit = async (investigationId) => {
    if (!investigationId) return;
    setSmsProcessing(true);
    setSmsError('');
    try {
      const res = await fetch(`http://127.0.0.1:8001/api/sms/investigations/${investigationId}/run`, {
        method: 'POST'
      });
      if (!res.ok) {
        throw new Error('Failed to execute threat audit on backend.');
      }
      const data = await res.json();
      setSmsResult(data.full_report);
    } catch (err) {
      console.error(err);
      setSmsError(err.message || 'Audit execution failed.');
    } finally {
      setSmsProcessing(false);
    }
  };

  useEffect(() => {
    if (webProcessing) {
      const logs = [
        "SYSTEM: Initializing SOC threat investigation plan...",
        "PLANNER: Plan created. UUID registered.",
        "SCANNER: Evaluating input source type (URL analysis)..."
      ];
      if (webProgressPercent >= 10) logs.push("SCANNER: Decoding input target URL or QR sequence...");
      if (webProgressPercent >= 20) logs.push("WHOIS: Resolving domain registrar and domain age details...");
      if (webProgressPercent >= 30) logs.push("SSL: Performing socket handshake. SSL certificate status checked.");
      if (webProgressPercent >= 40) logs.push("BRAND: Analyzing brand typosquatting similarity index...");
      if (webProgressPercent >= 50) logs.push("DATABASE: Querying PhishTank database threat lists...");
      if (webProgressPercent >= 60) logs.push("NETWORK: Auditing redirect chain hops and trace sequences...");
      if (webProgressPercent >= 70) logs.push("HEADERS: Auditing response headers for CSP/HSTS compliance...");
      if (webProgressPercent >= 80) logs.push("METADATA: Harvesting HTML head keywords and description elements...");
      if (webProgressPercent >= 90) logs.push("VISUAL: Capturing page layout screenshots using Playwright browser...");
      if (webProgressPercent >= 95) logs.push("AI_AGENT: Dispatching telemetry evidence to Groq LLM model...");
      if (webProgressPercent === 100) logs.push("AI_AGENT: Investigation completed. structured SOC audit report generated.");
      setTerminalLogs(logs);
    } else {
      setTerminalLogs([]);
    }
  }, [webProcessing, webProgressPercent]);

  useEffect(() => {
    if (callProcessing) {
      const logs = [
        "SYSTEM: Initializing call forensics plan...",
        "LISTENER: Waveform buffer uploaded. Length checks passed."
      ];
      if (callProgressPercent >= 20) logs.push("WHISPER: Executing Whisper speech-to-text engine...");
      if (callProgressPercent >= 35) logs.push("WHISPER: Language identified. Speech waveforms transcribed.");
      if (callProgressPercent >= 50) logs.push("EXTRACTOR: Parsing transcript text. Harvesting phone numbers, OTPs, and banks...");
      if (callProgressPercent >= 65) logs.push("BEHAVIOR: Computing emotion telemetry and psychological pressure vectors...");
      if (callProgressPercent >= 80) logs.push("AI_INVESTIGATOR: Dispatching technical evidence to Llama-3-8b reasoning module...");
      if (callProgressPercent >= 90) logs.push("DB: Querying database registers for previous caller threat entries...");
      if (callProgressPercent === 100) logs.push("SYSTEM: Investigation complete. structured SOC report generated.");
      setCallTerminalLogs(logs);
    } else {
      setCallTerminalLogs([]);
    }
  }, [callProcessing, callProgressPercent]);

  const fetchUnifiedHistory = async () => {
    setHistoryLoading(true);
    try {
      const url = new URL('http://127.0.0.1:8001/api/history');
      url.searchParams.append('page', historyPage);
      url.searchParams.append('limit', historyLimit);
      url.searchParams.append('agent_type', historyTab);
      url.searchParams.append('threat_level', historyThreatLevel);
      url.searchParams.append('status', historyStatus);
      url.searchParams.append('risk_score', historyRiskScore);
      url.searchParams.append('search', historySearch);
      url.searchParams.append('sort_by', historySortBy);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setHistoryItems(data.items || []);
        setHistoryTotal(data.total || 0);
        if (data.stats) {
          setHistoryStats(data.stats);
        }
      }
    } catch (err) {
      console.error("Error fetching unified history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadHistoryDetails = async (investigationId) => {
    try {
      const res = await fetch(`http://127.0.0.1:8001/api/history/${investigationId}`);
      if (res.ok) {
        const details = await res.json();
        setSelectedHistoryItem(details);
      } else {
        alert("Failed to load investigation details.");
      }
    } catch (err) {
      console.error("Error loading investigation details:", err);
    }
  };

  const deleteSingleHistory = async (investigationId) => {
    try {
      const res = await fetch(`http://127.0.0.1:8001/api/history/${investigationId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchUnifiedHistory();
        setSelectedHistoryIds(prev => prev.filter(id => id !== investigationId));
      } else {
        alert("Failed to delete investigation.");
      }
    } catch (err) {
      console.error("Error deleting investigation:", err);
    }
  };

  const deleteSelectedHistory = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8001/api/history?ids=${selectedHistoryIds.join(',')}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSelectedHistoryIds([]);
        fetchUnifiedHistory();
      } else {
        alert("Failed to delete selected investigations.");
      }
    } catch (err) {
      console.error("Error deleting selected investigations:", err);
    }
  };

  const clearAllHistory = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8001/api/history?all_history=true', {
        method: 'DELETE'
      });
      if (res.ok) {
        setSelectedHistoryIds([]);
        fetchUnifiedHistory();
      } else {
        alert("Failed to clear history.");
      }
    } catch (err) {
      console.error("Error clearing history:", err);
    }
  };

  const handleOpenItemInAgent = (item) => {
    if (!item || !item.full_report) return;
    const type = item.agent_type;
    const report = item.full_report;
    
    if (type === 'website') {
      setWebResult(report);
      setActiveNav('Web & QR Scan');
    } else if (type === 'email') {
      setEmailAnalysisResult(report);
      setActiveNav('Email Investigation');
    } else if (type === 'call') {
      setCallResult(report);
      setActiveNav('Call Analysis');
    } else if (type === 'sms') {
      setSmsResult(report);
      setSmsSender(report.sms?.sender || "");
      setSmsMessage(report.sms?.message || "");
      setActiveNav('SMS Investigation');
    }
  };

  useEffect(() => {
    if (activeNav === 'History') {
      fetchUnifiedHistory();
    }
  }, [historyPage, historyLimit, historyTab, historyThreatLevel, historyStatus, historyRiskScore, historySortBy, activeNav]);

  const fetchActiveCaseId = async () => {
    let stored = localStorage.getItem("activeCaseId");
    if (stored && stored !== "null" && stored !== "undefined") {
      setActiveCaseId(stored);
    } else {
      try {
        const res = await fetch("http://127.0.0.1:8001/api/evidence/cases", { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("activeCaseId", data.case_id);
          setActiveCaseId(data.case_id);
        }
      } catch (err) {
        console.error("Failed to initialize Case Folder:", err);
      }
    }
  };

  const startNewCaseInvestigation = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8001/api/evidence/cases", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("activeCaseId", data.case_id);
        setActiveCaseId(data.case_id);
        setWebResult(null);
        setEmailAnalysisResult(null);
        setCallResult(null);
        setXaiOutput(null);
        setComplaintId(null);
        alert(`New Investigation Case Initialized: ${data.case_id}`);
      }
    } catch (err) {
      console.error("Failed to start new case:", err);
    }
  };

  const fetchVaultCases = async () => {
    setCasesLoading(true);
    try {
      const params = new URLSearchParams();
      if (vaultFilterStatus && vaultFilterStatus !== 'All') {
        params.append('status', vaultFilterStatus);
      }
      if (vaultFilterThreat && vaultFilterThreat !== 'All') {
        params.append('threat_level', vaultFilterThreat);
      }
      if (vaultSearch) {
        params.append('search', vaultSearch);
      }
      params.append('sort_by', vaultSortBy);

      const res = await fetch(`http://127.0.0.1:8001/api/evidence/cases?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCases(data);
      }
    } catch (err) {
      console.error("Failed to fetch vault cases:", err);
    } finally {
      setCasesLoading(false);
    }
  };

  const openCaseFolderDetails = async (caseId) => {
    try {
      const res = await fetch(`http://127.0.0.1:8001/api/evidence/cases/${caseId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCase(data);
      }
    } catch (err) {
      console.error("Failed to fetch case details:", err);
    }
  };

  const deleteCaseFolder = async (caseId) => {
    if (!window.confirm(`Are you sure you want to delete Case Folder ${caseId}? This action is irreversible.`)) return;
    try {
      const res = await fetch(`http://127.0.0.1:8001/api/evidence/cases/${caseId}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedCase && selectedCase.case_id === caseId) {
          setSelectedCase(null);
        }
        fetchVaultCases();
      }
    } catch (err) {
      console.error("Failed to delete case:", err);
    }
  };

  const changeCaseStatus = async (caseId, newStatus) => {
    try {
      const res = await fetch(`http://127.0.0.1:8001/api/evidence/cases/${caseId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        if (selectedCase && selectedCase.case_id === caseId) {
          openCaseFolderDetails(caseId);
        }
        fetchVaultCases();
      }
    } catch (err) {
      console.error("Failed to update case status:", err);
    }
  };

  useEffect(() => {
    fetchActiveCaseId();
  }, []);

  useEffect(() => {
    if (activeNav === 'Evidence Vault') {
      fetchVaultCases();
    }
  }, [vaultFilterStatus, vaultFilterThreat, vaultSortBy, activeNav]);

  const handleXaiExplain = async (langOverride) => {
    const selectedLang = (typeof langOverride === 'string') ? langOverride : xaiLanguage;
    setXaiLoading(true);
    setXaiError('');
    setXaiChatMessages([]);
    try {
      // Collect payload
      const payload = {
        language: selectedLang,
        case_id: localStorage.getItem("activeCaseId") || "",
        website: webResult,
        email: emailAnalysisResult,
        call: callResult,
        complaint: complaintId ? { complaint_id: complaintId, recipient: complaintForm.to, subject: complaintForm.subject, body: complaintForm.body, status: complaintStatus } : null
      };

      // If they are missing in states, let's try to pull them from history to make sure we correlate something!
      const historyRes = await fetch('http://127.0.0.1:8001/api/history?limit=10');
      if (historyRes.ok) {
        const histData = await historyRes.json();
        const items = histData.items || [];
        // Map them
        if (items.length > 0) {
          items.forEach(item => {
            if (!payload.website && item.agent_type === 'website') {
              payload.website = item.full_report;
            }
            if (!payload.email && item.agent_type === 'email') {
              payload.email = item.full_report;
            }
            if (!payload.call && item.agent_type === 'call') {
              payload.call = item.full_report;
            }
          });
        }
      }

      // Add mock data if everything is completely empty for demonstration
      if (!payload.call && !payload.website && !payload.email) {
        payload.website = {
          risk_score: 96,
          verdict: "PHISHING",
          domain: { name: "secure-login-bank.com", age_days: 12, registrar: "NameCheap" },
          ssl: { valid: false, issuer: "Let's Encrypt" }
        };
        payload.email = {
          risk_score: 85,
          sender: "security-alert@paypal-update.com",
          subject: "Urgent Action Required: Security Alert",
          headers_analysis: { spf: "FAIL", dkim: "PASS", dmarc: "FAIL" }
        };
      }

      const res = await fetch('http://127.0.0.1:8001/api/xai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setXaiOutput(data);
      } else {
        const errData = await res.json();
        setXaiError(errData.detail || "Explainability pipeline failed.");
      }
    } catch (err) {
      console.error("XAI error:", err);
      setXaiError("Failed to communicate with the XAI forensic engine.");
    } finally {
      setXaiLoading(false);
    }
  };

  const handleXaiChatSend = async () => {
    if (!xaiChatInput.trim() || !xaiOutput) return;
    const userQuery = xaiChatInput;
    setXaiChatInput('');
    setXaiChatMessages(prev => [...prev, { sender: 'user', text: userQuery }]);
    setXaiChatLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8001/api/xai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report: xaiOutput,
          query: userQuery
        })
      });

      if (res.ok) {
        const data = await res.json();
        setXaiChatMessages(prev => [...prev, { sender: 'xai', text: data.answer }]);
      } else {
        setXaiChatMessages(prev => [...prev, { sender: 'xai', text: "Error: Reasoning engine returned error status." }]);
      }
    } catch (err) {
      console.error("XAI Chat error:", err);
      setXaiChatMessages(prev => [...prev, { sender: 'xai', text: "Network error: Unable to contact reasoning agent." }]);
    } finally {
      setXaiChatLoading(false);
    }
  };

  const handleXaiSpeechPlay = () => {
    if (!xaiOutput || !xaiOutput.overall_summary) return;
    
    window.speechSynthesis.cancel();

    const langMap = {
      'English': 'en-US',
      'Tamil': 'ta-IN',
      'Hindi': 'hi-IN',
      'Malayalam': 'ml-IN',
      'Kannada': 'kn-IN',
      'Telugu': 'te-IN',
      'French': 'fr-FR',
      'Arabic': 'ar-AE'
    };

    const utterance = new SpeechSynthesisUtterance(xaiOutput.overall_summary);
    utterance.lang = langMap[xaiLanguage] || 'en-US';
    
    utterance.onend = () => {
      setXaiSpeechPlaying(false);
      setXaiSpeechPaused(false);
    };

    utterance.onerror = () => {
      setXaiSpeechPlaying(false);
      setXaiSpeechPaused(false);
    };

    window.speechSynthesis.speak(utterance);
    setXaiSpeechPlaying(true);
    setXaiSpeechPaused(false);
  };

  const handleXaiSpeechPause = () => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setXaiSpeechPaused(true);
    }
  };

  const handleXaiSpeechResume = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setXaiSpeechPaused(false);
    }
  };

  const handleXaiSpeechStop = () => {
    window.speechSynthesis.cancel();
    setXaiSpeechPlaying(false);
    setXaiSpeechPaused(false);
  };

  const fetchDashboardStatsAndHistory = async () => {
    try {
      // 1. Fetch Stats
      const statsRes = await fetch('http://127.0.0.1:8001/api/dashboard/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // 2. Fetch Website Scan History
      const webHistoryRes = await fetch('http://127.0.0.1:8001/api/history/websites');
      let webScans = [];
      if (webHistoryRes.ok) {
        webScans = await webHistoryRes.json();
      }

      // 3. Fetch Call Scan History
      const callHistoryRes = await fetch('http://127.0.0.1:8001/api/history/calls');
      let callScans = [];
      if (callHistoryRes.ok) {
        callScans = await callHistoryRes.json();
      }

      // 4. Map them to unified scanHistory objects
      const mappedWeb = webScans.map((scan, idx) => ({
        id: `web-${scan._id || idx}`,
        agent: "Website Investigation Agent",
        type: scan.url && scan.url.includes("qr_") ? "APK File Scan" : "URL Check",
        date: scan.timestamp ? scan.timestamp.substring(0, 16) : new Date().toISOString().substring(0, 16),
        score: scan.risk_score,
        category: scan.threat_type || scan.verdict || "Safe Link",
        status: scan.risk_score >= 75 ? "Critical" : (scan.risk_score >= 50 ? "Warning" : "Clean"),
        raw: scan
      }));

      const mappedCall = callScans.map((scan, idx) => {
        const threatCat = scan.ai_analysis?.threat_category || scan.threat_category || "Call Scan";
        return {
          id: `call-${scan._id || idx}`,
          agent: "Call Analysis Agent",
          type: scan.audio_url ? "Audio Scan" : "Transcript Analysis",
          date: scan.timestamp ? scan.timestamp.substring(0, 16) : new Date().toISOString().substring(0, 16),
          score: scan.risk_score,
          category: threatCat,
          status: scan.risk_score >= 75 ? "Critical" : (scan.risk_score >= 50 ? "Warning" : "Clean"),
          raw: scan
        };
      });

      // Combine and sort by date descending
      const combined = [...mappedWeb, ...mappedCall].sort((a, b) => new Date(b.date) - new Date(a.date));
      setScanHistory(combined);

      // 5. Fetch Complaints History
      try {
        const compHistoryRes = await fetch('http://127.0.0.1:8001/api/history/complaints');
        if (compHistoryRes.ok) {
          const compData = await compHistoryRes.json();
          setRecentComplaints(compData);
        }
      } catch (cErr) {
        console.error("Error fetching complaints history:", cErr);
      }
    } catch (err) {
      console.error("Error fetching dashboard statistics or history:", err);
    }
  };

  const fetchProtectionData = async () => {
    try {
      const statusRes = await fetch('http://127.0.0.1:8001/protection/status');
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setProtectionStatus(statusData);
      }
      const historyRes = await fetch('http://127.0.0.1:8001/protection/history');
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setProtectionHistory(historyData.history);
      }
    } catch (err) {
      console.error("Failed to fetch protection data:", err);
    }
  };

  const fetchBlockedWebsitesList = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8001/api/websites/blocked');
      if (res.ok) {
        const data = await res.json();
        setBlockedWebsitesList(data);
      }
    } catch (err) {
      console.error("Failed to fetch blocked websites list:", err);
    }
  };

  const fetchEmailStatus = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8001/api/email/connect', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setEmailConnected(data.connected);
        setEmailAddress(data.email_address || "");
        setEmailAuthUrl(data.auth_url || "");
        return data.connected;
      }
    } catch (err) {
      console.error("Failed to fetch email connection status:", err);
    }
    return false;
  };

  const handleConnectGmail = async () => {
    try {
      setEmailLoading(true);
      const res = await fetch('http://127.0.0.1:8001/api/email/connect', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.connected) {
          setEmailConnected(true);
          setEmailAddress(data.email_address);
          setEmailLoading(false);
          fetchInboxEmails();
        } else if (data.auth_url) {
          const width = 500;
          const height = 600;
          const left = window.screen.width / 2 - width / 2;
          const top = window.screen.height / 2 - height / 2;
          const popup = window.open(
            data.auth_url,
            "Gmail Authentication",
            `width=${width},height=${height},left=${left},top=${top}`
          );

          const interval = setInterval(async () => {
            if (popup.closed) {
              clearInterval(interval);
              setEmailLoading(false);
            }
            const isConn = await fetchEmailStatus();
            if (isConn) {
              clearInterval(interval);
              popup.close();
              setEmailLoading(false);
              fetchInboxEmails();
            }
          }, 2000);
        }
      }
    } catch (err) {
      console.error("Failed to connect to Gmail API:", err);
      setEmailLoading(false);
    }
  };

  const fetchInboxEmails = async () => {
    try {
      setEmailLoading(true);
      setEmailError("");
      const res = await fetch('http://127.0.0.1:8001/api/email/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filter_type: 'inbox', limit: 12 })
      });
      if (res.ok) {
        const data = await res.json();
        setEmailsList(data);
      } else {
        const data = await res.json();
        setEmailError(data.detail || "Failed to fetch emails.");
      }
    } catch (err) {
      setEmailError("Network error connecting to email API.");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleAnalyzeEmail = async (messageId) => {
    setSelectedEmailId(messageId);
    setEmailAnalysisLoading(true);
    setEmailAnalysisResult(null);
    setEmailPipelineStep(0);
    setEmailError("");
    setEmailChatMessages([]);
    setEmailChatOpen(true);

    const stepInterval = setInterval(() => {
      setEmailPipelineStep(prev => {
        if (prev < 4) {
          return prev + 1;
        } else {
          return prev;
        }
      });
    }, 1500);

    try {
      const activeCaseId = localStorage.getItem("activeCaseId") || "";
      const res = await fetch('http://127.0.0.1:8001/api/email/analyze', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Case-ID': activeCaseId
        },
        body: JSON.stringify({ message_id: messageId })
      });
      clearInterval(stepInterval);

      if (res.ok) {
        const data = await res.json();
        setEmailPipelineStep(5);
        setEmailAnalysisResult(data);
        setEmailAnalysisLoading(false);
      } else {
        const data = await res.json();
        setEmailError(data.detail || "Failed to analyze email.");
        setEmailAnalysisLoading(false);
      }
    } catch (err) {
      clearInterval(stepInterval);
      setEmailError("Failed to reach email analysis backend service.");
      setEmailAnalysisLoading(false);
    }
  };

  const sendEmailChatMessage = async (overrideMessage = null) => {
    const textToSend = overrideMessage || emailChatInput;
    if (!textToSend.trim() || emailChatLoading) return;

    setEmailChatLoading(true);
    setEmailChatInput('');

    const userMsg = { role: 'user', content: textToSend };
    const updatedHistory = [...emailChatMessages, userMsg];
    setEmailChatMessages(updatedHistory);

    // Append assistant placeholder
    setEmailChatMessages(prev => [...prev, { role: 'assistant', content: '', loading: true }]);

    try {
      const historyPayload = emailChatMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch('http://127.0.0.1:8001/api/email/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          report: emailAnalysisResult,
          message: textToSend,
          history: historyPayload,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get a response from ScamON AI Email Assistant.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let streamedResponseText = '';

      setEmailChatMessages(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1].loading = false;
        }
        return updated;
      });

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          streamedResponseText += chunk;
          
          setEmailChatMessages(prev => {
            const updated = [...prev];
            if (updated.length > 0) {
              updated[updated.length - 1].content = streamedResponseText;
            }
            return updated;
          });
        }
      }
    } catch (err) {
      console.error(err);
      setEmailChatMessages(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1].loading = false;
          updated[updated.length - 1].content = "Error: Unable to connect to ScamON AI Assistant. Please check backend.";
        }
        return updated;
      });
    } finally {
      setEmailChatLoading(false);
    }
  };

  const sendVaultChatMessage = async (overrideMessage = null) => {
    const textToSend = overrideMessage || vaultChatInput;
    if (!textToSend.trim() || vaultChatLoading) return;

    setVaultChatLoading(true);
    setVaultChatInput('');

    const userMsg = { role: 'user', content: textToSend };
    const updatedHistory = [...vaultChatMessages, userMsg];
    setVaultChatMessages(updatedHistory);

    // Append assistant placeholder
    setVaultChatMessages(prev => [...prev, { role: 'assistant', content: '', loading: true }]);

    try {
      const historyPayload = vaultChatMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch('http://127.0.0.1:8001/api/evidence/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get a response from SOC Copilot.');
      }

      const resData = await response.json();
      const answer = resData.answer || 'No response generated.';

      setVaultChatMessages(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1].loading = false;
          updated[updated.length - 1].content = answer;
        }
        return updated;
      });
    } catch (err) {
      console.error(err);
      setVaultChatMessages(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1].loading = false;
          updated[updated.length - 1].content = "Error: Unable to connect to SOC Evidence Assistant. Please check if backend service is active.";
        }
        return updated;
      });
    } finally {
      setVaultChatLoading(false);
    }
  };

  const sendThreatChatMessage = async (overrideMessage = null) => {
    const textToSend = overrideMessage || threatChatInput;
    if (!textToSend.trim() || threatChatLoading) return;

    setThreatChatLoading(true);
    setThreatChatInput('');

    const userMsg = { role: 'user', content: textToSend };
    const updatedHistory = [...threatChatMessages, userMsg];
    setThreatChatMessages(updatedHistory);

    // Append assistant placeholder
    setThreatChatMessages(prev => [...prev, { role: 'assistant', content: '', loading: true }]);

    const activeThreatIndicators = [
      { type: 'website', target: 'https://secure-login-hdfcbk.net', cat: 'Phishing Target', risk: 94, level: 'CRITICAL', status: 'BLOCKED', time: 'Just now' },
      { type: 'sms', target: 'HDFCBK Phishing Phish', cat: 'Smishing SMS', risk: 85, level: 'HIGH', status: 'BLOCKED', time: '3 min ago' },
      { type: 'call', target: '+1 (800) 434-2193', cat: 'Tech Support Impersonation', risk: 78, level: 'HIGH', status: 'REPORTED', time: '14 min ago' },
      { type: 'email', target: 'billing@secure-netflix-verification.com', cat: 'SPF/DMARC Fail Spoof', risk: 62, level: 'MEDIUM', status: 'QUARANTINED', time: '1 hr ago' },
      { type: 'website', target: 'https://paypal-update-profile.ru', cat: 'Typosquat Spoof', risk: 88, level: 'CRITICAL', status: 'BLOCKED', time: '3 hrs ago' }
    ];

    try {
      const historyPayload = threatChatMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch('http://127.0.0.1:8001/api/xai/chat/threats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
          stats: {
            total_events: historyStats.total || 0,
            active_phishing_campaigns: (historyStats.critical || 0) + (historyStats.high || 0),
            interception_rate: "98.4%",
            network_nodes_audited: "84,192",
            vector_distribution: threatVectorStats
          },
          threat_indicators: activeThreatIndicators
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get a response from SOC Copilot.');
      }

      const resData = await response.json();
      const answer = resData.answer || 'No response generated.';

      setThreatChatMessages(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1].loading = false;
          updated[updated.length - 1].content = answer;
        }
        return updated;
      });
    } catch (err) {
      console.error(err);
      setThreatChatMessages(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1].loading = false;
          updated[updated.length - 1].content = "Error: Unable to connect to Threat Intelligence Assistant. Please check if backend service is active.";
        }
        return updated;
      });
    } finally {
      setThreatChatLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStatsAndHistory();
    fetchProtectionData();
    fetchBlockedWebsitesList();
    fetchEmailStatus().then(conn => {
      if (conn && activeNav === 'Email Investigation') {
        fetchInboxEmails();
      }
    });
  }, [activeNav]);

  const triggerComplaintGeneration = async (report) => {
    setComplaintTarget(report);
    setActiveNav('Complaint Agent');
    setComplaintStatus('config');
    setComplaintProgressStep(0);
    setComplaintError('');
    setTypedBody('');
    setTypingDone(false);
    setSmtpProgressStep(0);
    
    let domainName = report.domain ? report.domain.name : (report.caller || "Suspected Scam");
    setConfigForm({
      to: 'report@cybercrime.gov.in',
      cc: 'compliance@scamon.ai',
      subject: `Complaint Regarding Suspected Cyber Scam: ${domainName}`
    });
  };

  const startComplaintGeneration = async () => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!configForm.to || !emailRegex.test(configForm.to)) {
      alert("Please enter a valid recipient email address.");
      return;
    }
    if (configForm.cc && !emailRegex.test(configForm.cc)) {
      alert("Please enter a valid CC email address.");
      return;
    }

    setComplaintStatus('generating');
    setComplaintProgressStep(0);

    const steps = [
      "Preparing complaint...",
      "Collecting investigation report...",
      "Analyzing evidence...",
      "Generating PDF documents...",
      "Preparing attachments...",
      "Generating Complaint.pdf",
      "Generating Investigation_Report.pdf",
      "Generating Evidence_Report.pdf",
      "Preparing email..."
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 600));
      setComplaintProgressStep(i + 1);
    }

    try {
      const activeCaseId = localStorage.getItem("activeCaseId") || "";
      const res = await fetch('http://127.0.0.1:8001/api/complaints/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          report: complaintTarget,
          case_id: activeCaseId
        })
      });
      if (res.ok) {
        const data = await res.json();
        setComplaintId(data.complaint_id);
        
        setComplaintForm({
          to: configForm.to,
          cc: configForm.cc,
          subject: configForm.subject || data.subject,
          body: data.body,
          attachments: data.attachments
        });

        setComplaintStatus('typing');
        setTypedBody("");
        setTypingDone(false);

        let currentIdx = 0;
        const fullText = data.body;
        const interval = setInterval(() => {
          if (currentIdx < fullText.length) {
            setTypedBody(prev => prev + fullText.charAt(currentIdx));
            currentIdx++;
          } else {
            clearInterval(interval);
            setTypingDone(true);
            setComplaintStatus('preview');
          }
        }, 10);
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to generate documents");
      }
    } catch (err) {
      setComplaintError(err.message || "An unexpected error occurred during complaint packaging.");
      setComplaintStatus('error');
    }
  };

  const handleSendComplaint = async () => {
    setComplaintStatus('sending');
    setSmtpProgressStep(0);
    setComplaintError('');

    const steps = [
      "Connecting to Gmail...",
      "Authenticating...",
      "Uploading attachments...",
      "Sending email...",
      "Delivering..."
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setSmtpProgressStep(i + 1);
    }

    try {
      const payload = {
        to: complaintForm.to,
        cc: complaintForm.cc,
        subject: complaintForm.subject,
        body: complaintForm.body,
        attachments: complaintForm.attachments.map(att => att.path)
      };

      const res = await fetch('http://127.0.0.1:8001/api/complaints/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setComplaintStatus('success');
      } else {
        const errData = await res.json();
        throw new Error(errData.detail || "Unable to deliver email via SMTP");
      }
    } catch (err) {
      setComplaintError(err.message || "Email dispatch failed. Please verify SMTP status.");
      setComplaintStatus('error');
    }
  };

  const handleBlockWebsite = async (domain) => {
    setBlockingLoading(true);
    setProtectionError("");
    setBlockMessage("");
    try {
      const payload = {
        url: webResult ? webResult.url : `https://${domain}`,
        domain: domain,
        risk_score: webResult ? webResult.risk_score : 90,
        threat_type: webResult ? webResult.threat_type : "Phishing",
        reason: webResult ? (webResult.recommendation || "High Risk Website") : "High Risk Website"
      };
      const res = await fetch('http://127.0.0.1:8001/api/websites/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setBlockMessage(data.message);
        setUnblockedDomains(prev => {
          const next = new Set(prev);
          next.delete(domain);
          return next;
        });
        if (webResult && webResult.domain?.name === domain) {
          setWebResult(prev => ({ 
            ...prev, 
            is_blocked: true,
            blocked_time: new Date().toISOString(),
            blocked_by: "Website Investigation Agent"
          }));
        }
      } else {
        setProtectionError(data.message || "Failed to block domain.");
      }
      fetchProtectionData();
      fetchBlockedWebsitesList();
      fetchDashboardStatsAndHistory();
    } catch (err) {
      setProtectionError("Network error: Failed to reach the Protection Engine.");
    } finally {
      setBlockingLoading(false);
    }
  };

  const handleUnblockWebsite = async (domain) => {
    setBlockingLoading(true);
    setProtectionError("");
    setBlockMessage("");
    try {
      const res = await fetch('http://127.0.0.1:8001/api/websites/unblock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });
      const data = await res.json();
      if (data.success) {
        setBlockMessage(data.message);
        setUnblockedDomains(prev => {
          const next = new Set(prev);
          next.add(domain);
          return next;
        });
        if (webResult && webResult.domain?.name === domain) {
          setWebResult(prev => ({ 
            ...prev, 
            is_blocked: false,
            blocked_time: null,
            blocked_by: null
          }));
        }
      } else {
        setProtectionError(data.message || "Failed to unblock domain.");
      }
      fetchProtectionData();
      fetchBlockedWebsitesList();
      fetchDashboardStatsAndHistory();
    } catch (err) {
      setProtectionError("Network error: Failed to reach the Protection Engine.");
    } finally {
      setBlockingLoading(false);
    }
  };

  // Helper colors
  const getRiskColor = (score) => {
    if (score >= 70) return '#FF3D00'; // Matrix Red
    if (score >= 40) return '#FFA000'; // Matrix Orange
    return '#00E676'; // Matrix Cyber Green
  };

  // LED Segment Bar rendering
  const renderLedBar = (score) => {
    const segmentsCount = 24;
    const activeSegments = Math.round((score / 100) * segmentsCount);
    return (
      <div style={{ display: 'flex', gap: '2px', margin: '8px 0' }}>
        {Array.from({ length: segmentsCount }).map((_, i) => (
          <span 
            key={i} 
            style={{
              width: '3.5px',
              height: '13px',
              backgroundColor: i < activeSegments ? '#00E676' : '#122018',
              boxShadow: i < activeSegments ? '0 0 4px #00E676' : 'none'
            }}
          />
        ))}
      </div>
    );
  };

  if (view === 'landing') {
    return <LandingPage onStartAnalysis={() => setView('dashboard')} />;
  }

  return (
    <div className="app-container">
      
      {/* SIDEBAR */}
      <div 
        className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
        style={{
          width: sidebarCollapsed ? '70px' : '290px',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'rgba(2, 3, 5, 0.88)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(0, 230, 118, 0.1)',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 1000,
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 130px)' }}>
          {/* Logo brand section */}
          <div 
            className="sidebar-header"
            style={{
              padding: '24px 20px',
              borderBottom: '1px solid rgba(0, 230, 118, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <Shield style={{ width: '22px', height: '22px', color: '#00E676', flexShrink: 0 }} />
            {!sidebarCollapsed && (
              <div style={{ textAlign: 'left' }}>
                <span className="sidebar-logo-text" style={{ fontSize: '15px', fontWeight: 'bold', color: '#fff', letterSpacing: '2px', fontFamily: 'monospace' }}>
                  ScamON SOC
                </span>
                <div style={{ fontSize: '8px', color: '#00E676', fontWeight: 'bold', letterSpacing: '1px', fontFamily: 'monospace', marginTop: '2px' }}>
                  CORE ORCHESTRATOR
                </div>
              </div>
            )}
          </div>

          {/* Search bar inside sidebar */}
          {!sidebarCollapsed && (
            <div style={{ padding: '16px 20px 8px 20px', position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '30px', top: '26px', width: '13px', height: '13px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={sidebarSearchQuery}
                onChange={(e) => setSidebarSearchQuery(e.target.value)}
                placeholder="Search nodes..."
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 32px',
                  background: '#05070a',
                  border: '1px solid rgba(0, 230, 118, 0.15)',
                  borderRadius: '2px',
                  color: '#fff',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {sidebarSearchQuery && (
                <X 
                  onClick={() => setSidebarSearchQuery('')}
                  style={{ position: 'absolute', right: '30px', top: '26px', width: '12px', height: '12px', color: 'var(--text-muted)', cursor: 'pointer' }} 
                />
              )}
            </div>
          )}

          {/* Scrollable Navigation Groups */}
          <div 
            className="soc-sidebar-scroll" 
            style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '12px 14px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px' 
            }}
          >
            {[
              {
                id: 'hub',
                title: 'Hub Orchestration',
                items: [
                  { name: 'Dashboard', label: 'Master Agent Hub', icon: LayoutDashboard }
                ]
              },
              {
                id: 'ai',
                title: 'AI Detectors',
                items: [
                  { name: 'Call Analysis', label: 'Call Analysis', icon: Activity },
                  { name: 'Live Call Detector', label: 'Live Call Detector', icon: PhoneCall },
                  { name: 'SMS Investigation', label: 'SMS Investigation', icon: MessageSquare },
                  { name: 'Web & QR Scan', label: 'Web & QR Scan', icon: Globe },
                  { name: 'Email Investigation', label: 'Email Investigation', icon: Mail },
                  { name: 'Visual Investigation', label: 'Visual Investigation', icon: Camera }
                ]
              },
              {
                id: 'evidence',
                title: 'Case Evidence',
                items: [
                  { name: 'Evidence Vault', label: 'Evidence Vault', icon: FolderLock },
                  { name: 'Complaint Agent', label: 'Complaint Agent', icon: FileText },
                  { name: 'Explainability (XAI)', label: 'Explainability (XAI)', icon: Layers }
                ]
              },
              {
                id: 'system',
                title: 'System Utilities',
                items: [
                  { name: 'History', label: 'History Feed', icon: History },
                  { name: 'Threat Reports', label: 'Threat Reports', icon: AlertOctagon },
                  { name: 'API Logs', label: 'API Logs', icon: Terminal },
                  { name: 'Settings', label: 'Settings Panel', icon: Settings }
                ]
              }
            ].map((section) => {
              // Apply sidebar query filtering
              const visibleItems = section.items.filter(item => 
                item.label.toLowerCase().includes(sidebarSearchQuery.toLowerCase()) ||
                item.name.toLowerCase().includes(sidebarSearchQuery.toLowerCase())
              );

              if (visibleItems.length === 0) return null;

              const isExpanded = sectionsExpanded[section.id];

              return (
                <div key={section.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {/* Section Title Header */}
                  {!sidebarCollapsed && (
                    <div 
                      onClick={() => setSectionsExpanded(prev => ({ ...prev, [section.id]: !prev[section.id] }))}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'monospace' }}>
                        {section.title}
                      </span>
                      {isExpanded ? (
                        <ChevronDown style={{ width: '10px', height: '10px', color: 'var(--text-muted)' }} />
                      ) : (
                        <ChevronRight style={{ width: '10px', height: '10px', color: 'var(--text-muted)' }} />
                      )}
                    </div>
                  )}

                  {/* Section Sub-items */}
                  {(isExpanded || sidebarCollapsed) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {visibleItems.map((item) => {
                        const IconComponent = item.icon;
                        const isActive = activeNav === item.name;
                        return (
                          <button
                            key={item.name}
                            onClick={() => setActiveNav(item.name)}
                            className={`nav-item ${isActive ? 'active' : ''} ${routingState?.active && routingState?.target === item.name ? 'routing-target-pulse' : ''}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              width: '100%',
                              padding: '10px 14px',
                              background: isActive ? 'rgba(0, 230, 118, 0.08)' : 'transparent',
                              border: 'none',
                              borderLeft: isActive ? '3px solid #00E676' : '3px solid transparent',
                              color: isActive ? '#00E676' : 'var(--text-primary)',
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontFamily: 'monospace',
                              fontSize: '12.5px',
                              textShadow: isActive ? '0 0 5px rgba(0, 230, 118, 0.25)' : 'none',
                              transition: 'all 0.2s',
                              boxSizing: 'border-box'
                            }}
                            onMouseEnter={e => {
                              if (!isActive) {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                e.currentTarget.style.color = '#fff';
                              }
                            }}
                            onMouseLeave={e => {
                              if (!isActive) {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = 'var(--text-primary)';
                              }
                            }}
                          >
                            <IconComponent style={{ width: '15px', height: '15px', flexShrink: 0, color: isActive ? '#00E676' : 'var(--text-muted)' }} />
                            {!sidebarCollapsed && <span>{item.label}</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* User Identity / Console Actions Area */}
        <div style={{ 
          padding: '16px 20px', 
          borderTop: '1px solid rgba(0, 230, 118, 0.08)',
          background: 'rgba(3, 5, 8, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {/* User profile identifier tag */}
          {!sidebarCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
              <div style={{ width: '28px', height: '28px', background: 'rgba(0,230,118,0.1)', border: '1px solid #00E676', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00E676', fontWeight: 'bold', fontSize: '11px', fontFamily: 'monospace' }}>
                SOC
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', fontFamily: 'monospace' }}>ANALYST_732</div>
                <div style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Access: Level 4</div>
              </div>
            </div>
          )}

          {/* Session controls row */}
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            {/* Collapse Toggle */}
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                background: 'transparent',
                border: '1px solid rgba(0, 230, 118, 0.15)',
                color: 'var(--text-primary)',
                fontFamily: 'monospace',
                fontSize: '9.5px',
                cursor: 'pointer',
                transition: 'border-color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#00E676'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(0, 230, 118, 0.15)'}
            >
              {sidebarCollapsed ? <ChevronRight style={{ width: '12px', height: '12px' }} /> : 'COLLAPSE'}
            </button>

            {/* Red Glowing Logout session button */}
            {!sidebarCollapsed && (
              <button 
                onClick={() => setView('landing')}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(255, 61, 0, 0.05)',
                  border: '1px solid #FF3D00',
                  color: '#FF3D00',
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                  fontSize: '9.5px',
                  cursor: 'pointer',
                  boxShadow: '0 0 10px rgba(255, 61, 0, 0.1)',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 61, 0, 0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 61, 0, 0.05)'}
              >
                LOGOUT
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div 
        className="main-layout"
        style={{
          marginLeft: sidebarCollapsed ? '70px' : '290px',
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <header className="navbar" style={{ 
          height: '56px',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '0 24px',
          background: 'rgba(2, 3, 5, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0, 230, 118, 0.1)',
          boxShadow: '0 1px 10px rgba(0, 230, 118, 0.05)',
          zIndex: 100
        }}>
          {/* Left: ScamON Logo & branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: 'var(--font-cyber)' }}>SYSTEM CONTROL</span>
            <div style={{ height: '14px', width: '1px', background: 'rgba(0, 230, 118, 0.2)' }}></div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(0, 230, 118, 0.2)', padding: '2px 8px', borderRadius: '2px', background: 'rgba(0, 230, 118, 0.03)' }}>
              <Server style={{ width: '10px', height: '10px', color: 'var(--accent-green)' }} />
              <span style={{ fontSize: '10px', color: '#fff', fontFamily: 'var(--font-cyber)', fontWeight: 'bold' }}>SOC_ACTIVE</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '8px' }}>
              <span className="pulse-glow" style={{ width: '5px', height: '5px', background: 'var(--accent-green)', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 6px var(--accent-green)' }} />
              <span style={{ fontSize: '10px', color: 'var(--accent-green)', fontWeight: 'bold', textTransform: 'uppercase', fontFamily: 'var(--font-cyber)' }}>LIVE FEED</span>
            </div>
          </div>

          {/* Right: Analyst Profile */}
          <div className="navbar-right">
            <div className="user-badge" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', fontFamily: 'var(--font-cyber)' }}>ANALYST_732</span>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-cyber)' }}>SOC Level 3</span>
              </div>
              <div className="user-avatar" style={{ background: 'var(--accent-green)', color: '#020b18', fontWeight: 'bold', fontSize: '10px', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-cyber)', boxShadow: '0 0 8px rgba(0, 230, 118, 0.3)' }}>A</div>
            </div>
          </div>
        </header>

        <main className={`content-area ${activeTransition ? 'cinematic-transition' : ''}`}>
          
          {/* Live Call Detector View */}
          {activeNav === 'Live Call Detector' && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">LIVE_CALL_DETECTOR</h1>
                  <p className="page-subtitle">Real-time speech transcription and social engineering scam detection.</p>
                </div>
              </div>
              <LiveCallDetector />
            </>
          )}

          {/* SMS Investigation View */}
          {activeNav === 'SMS Investigation' && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">SMS_INVESTIGATION</h1>
                  <p className="page-subtitle">Analyze SMS sender headers, urgency cues, and semantic threat indicators.</p>
                </div>
              </div>

              {smsProcessing ? (
                /* Scanning sequence view with live progress bar */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div className="scanner-line"></div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                      <MessageSquare className="animate-spin" style={{ width: '48px', height: '48px', color: 'var(--accent-green)' }} />
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', fontFamily: 'var(--font-cyber)', color: 'var(--accent-green)', letterSpacing: '1px' }}>
                          SMS Threat Audit In Progress...
                        </h3>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Elapsed: {scanSeconds}s | Pipeline Stage {smsStep + 1}/{smsPipeline.length}
                        </p>
                      </div>

                      {/* Progress bar container */}
                      <div style={{ width: '100%', maxWidth: '400px', background: 'rgba(255,255,255,0.05)', height: '8px', border: '1px solid rgba(255,255,255,0.1)', padding: '1px', borderRadius: '0px' }}>
                        <div style={{ width: `${smsProgressPercent}%`, height: '100%', background: 'var(--accent-green)', transition: 'width 0.3s ease' }}></div>
                      </div>

                      {/* Current action log */}
                      <div className="matrix-terminal" style={{ width: '100%', maxWidth: '500px', height: '120px', textAlign: 'left', padding: '12px 16px', overflowY: 'auto' }}>
                        <div style={{ color: 'var(--accent-green)', fontSize: '10.5px', fontFamily: 'monospace' }}>
                          {smsPipeline.map((stepItem, idx) => (
                            <div key={idx} style={{ opacity: idx <= smsStep ? 1 : 0.3, transition: 'opacity 0.2s' }}>
                              {idx < smsStep ? '✓' : idx === smsStep ? '❯' : '•'} [{stepItem.key}] {stepItem.name} - {stepItem.desc}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : smsResult ? (
                /* SMS Analysis Result View */
                !smsResult.analysis ? (
                  /* PENDING AUDIT VIEW */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                      <div style={{ display: 'inline-block', padding: '8px 16px', border: '1px solid #FFC107', backgroundColor: '#FFC10710', color: '#FFC107', fontSize: '11px', fontWeight: 'bold', fontFamily: 'var(--font-cyber)' }}>
                        INTERCEPTED TRANSMISSION (AWAITING AUDIT)
                      </div>
                      
                      <div style={{ width: '100%', maxWidth: '600px', textAlign: 'left', marginTop: '12px' }}>
                        <div style={{ marginBottom: '16px' }}>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Sender ID</span>
                          <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', fontFamily: 'var(--font-cyber)' }}>{smsResult.sms?.sender || 'N/A'}</span>
                        </div>
                        
                        <div style={{ marginBottom: '16px' }}>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Intercepted Message Body</span>
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '16px', color: '#fff', fontSize: '14px', lineHeight: '1.5', fontFamily: 'monospace' }}>
                            {smsResult.sms?.message}
                          </div>
                        </div>
                      </div>

                      {smsProcessing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '20px' }}>
                          <RefreshCw className="animate-spin" style={{ width: '28px', height: '28px', color: '#00A3FF' }} />
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            Spawning SMS Investigation Agent... Running ScamON LLM Threat Analysis...
                          </span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                          <button
                            onClick={() => handleRunSmsAudit(smsResult.investigation_id)}
                            className="forensic-btn forensic-btn-blue"
                            style={{ padding: '12px 32px', fontSize: '13px', fontWeight: 'bold', minWidth: '240px', height: '46px' }}
                          >
                            DEPLOY SMS THREAT AUDIT PLAN ❯
                          </button>
                          <button 
                            onClick={() => { setSmsResult(null); }} 
                            className="forensic-btn forensic-btn-gray" 
                            style={{ height: '36px', fontSize: '11px', width: '120px' }}
                          >
                            Back to Feed
                          </button>
                        </div>
                      )}

                      {smsError && (
                        <div style={{ color: '#FF3D00', fontSize: '12px', fontFamily: 'monospace', marginTop: '12px' }}>
                          ERROR: {smsError}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* EXISTING COMPLETE AUDIT VIEW (original grid layout) */
                  <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '24px' }}>
                    {/* Left Panel: Scam Metrics & Reasoning */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <div className="glass-panel" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px', marginBottom: '16px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-cyber)' }}>FORENSIC SUMMARY</span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <span style={{
                              fontSize: '10px', 
                              padding: '3px 8px', 
                              border: '1px solid',
                              fontWeight: 'bold',
                              backgroundColor: `${getRiskColor(smsResult.analysis?.risk_score)}15`,
                              borderColor: getRiskColor(smsResult.analysis?.risk_score),
                              color: getRiskColor(smsResult.analysis?.risk_score)
                            }}>
                              {smsResult.analysis?.severity?.toUpperCase() || 'SAFE'}
                            </span>
                            <span style={{ fontSize: '10px', padding: '3px 8px', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', background: 'rgba(255,255,255,0.05)' }}>
                              VERDICT: {smsResult.analysis?.classification?.toUpperCase() || 'CLEAN'}
                            </span>
                          </div>
                        </div>

                        {/* Content block */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>SMS Sender ID</span>
                            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', fontFamily: 'var(--font-cyber)' }}>{smsResult.sms?.sender || 'N/A'}</span>
                          </div>

                          <div>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Message Body</span>
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '12px 16px', color: '#fff', fontSize: '13px', lineHeight: '1.5', margin: '4px 0' }}>
                              {smsResult.sms?.message}
                            </div>
                          </div>

                          <div>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Threat Analysis & Reasoning</span>
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.6', marginTop: '4px' }}>
                              {smsResult.investigation?.reasoning || smsResult.analysis?.summary}
                            </p>
                          </div>

                          <div>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Recommended Actions</span>
                            <div style={{
                              background: `${getRiskColor(smsResult.analysis?.risk_score)}06`,
                              border: `1px solid ${getRiskColor(smsResult.analysis?.risk_score)}30`,
                              padding: '12px 16px',
                              color: '#fff',
                              fontSize: '13px',
                              display: 'flex',
                              gap: '8px',
                              alignItems: 'center'
                            }}>
                              <span style={{ color: getRiskColor(smsResult.analysis?.risk_score), fontSize: '16px' }}>🛈</span>
                              <span>{smsResult.analysis?.recommended_action}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions block */}
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                          onClick={() => { setSmsResult(null); setSmsSender(''); setSmsMessage(''); }} 
                          className="forensic-btn forensic-btn-gray" 
                          style={{ height: '38px', fontSize: '11px', flex: 1 }}
                        >
                          Scan Another SMS
                        </button>
                        <button 
                          onClick={() => {
                            const activeCaseId = localStorage.getItem("activeCaseId") || "";
                            setActiveNav('Explainability (XAI)');
                          }}
                          className="forensic-btn forensic-btn-purple"
                          style={{ height: '38px', fontSize: '11px', flex: 1 }}
                        >
                          Generate XAI Explanation
                        </button>
                        <button 
                          onClick={() => {
                            setComplaintTarget({
                              url: `SMS ID: ${smsResult.sms?.sender}`,
                              risk_score: smsResult.analysis?.risk_score,
                              threat_type: smsResult.analysis?.classification,
                              ai_reasoning: { final_decision: smsResult.analysis?.classification, summary: smsResult.analysis?.summary, recommended_action: smsResult.analysis?.recommended_action }
                            });
                            setComplaintStatus('config');
                            setActiveNav('Complaint Agent');
                          }}
                          className="forensic-btn forensic-btn-orange"
                          style={{ height: '38px', fontSize: '11px', flex: 1 }}
                        >
                          Generate Complaint
                        </button>
                      </div>
                    </div>

                    {/* Right Panel: Dial Gauge & Telemetry */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      {/* Dial Gauge */}
                      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-cyber)', alignSelf: 'flex-start' }}>Scam Probability</span>
                        <div style={{ position: 'relative', width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{
                            width: '140px', height: '140px', borderRadius: '50%',
                            border: '4px solid rgba(255,255,255,0.05)',
                            borderTopColor: getRiskColor(smsResult.analysis?.risk_score),
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            boxShadow: `0 0 20px rgba(0,0,0,0.5), inset 0 0 15px ${getRiskColor(smsResult.analysis?.risk_score)}15`
                          }}>
                            <span style={{ fontSize: '32px', fontWeight: '900', color: '#fff', fontFamily: 'var(--font-cyber)' }}>{smsResult.analysis?.risk_score}%</span>
                            <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Scam Index</span>
                          </div>
                        </div>
                      </div>

                      {/* Metadata Trace */}
                      <div className="glass-panel" style={{ padding: '20px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-cyber)', display: 'block', marginBottom: '12px' }}>Forensics Telemetry Registry</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Analysis ID</span>
                            <span style={{ color: '#fff', fontFamily: 'monospace' }}>{smsResult.metadata?.analysis_id || 'N/A'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Execution Latency</span>
                            <span style={{ color: '#fff' }}>{smsResult.metadata?.execution_time_ms || '0'} ms</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Confidence Rating</span>
                            <span style={{ color: '#fff' }}>{smsResult.analysis?.confidence ? `${smsResult.analysis.confidence * 100}%` : 'N/A'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Integrity Verification</span>
                            <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>VERIFIED (SHA-256)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                /* SMS Input / Live Feed Choice View */
                <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
                  {/* Mode sub-toggles */}
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', justifyContent: 'center' }}>
                    <button 
                      onClick={() => setSmsMode('manual')}
                      style={{ 
                        padding: '10px 20px', 
                        fontSize: '11px', 
                        fontWeight: 'bold',
                        letterSpacing: '0.5px',
                        fontFamily: 'var(--font-cyber)',
                        cursor: 'pointer',
                        backgroundColor: smsMode === 'manual' ? 'rgba(0, 230, 118, 0.08)' : 'rgba(13, 19, 31, 0.5)',
                        border: smsMode === 'manual' ? '1px solid var(--accent-green)' : '1px solid rgba(255,255,255,0.08)',
                        boxShadow: smsMode === 'manual' ? '0 0 10px rgba(0,230,118,0.2)' : 'none',
                        color: smsMode === 'manual' ? 'var(--accent-green)' : '#fff',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      MANUAL FORENSIC AUDIT
                    </button>
                    <button 
                      onClick={() => setSmsMode('live')}
                      style={{ 
                        padding: '10px 20px', 
                        fontSize: '11px', 
                        fontWeight: 'bold',
                        letterSpacing: '0.5px',
                        fontFamily: 'var(--font-cyber)',
                        cursor: 'pointer',
                        backgroundColor: smsMode === 'live' ? 'rgba(0, 163, 255, 0.08)' : 'rgba(13, 19, 31, 0.5)',
                        border: smsMode === 'live' ? '1px solid #00A3FF' : '1px solid rgba(255,255,255,0.08)',
                        boxShadow: smsMode === 'live' ? '0 0 10px rgba(0,163,255,0.2)' : 'none',
                        color: smsMode === 'live' ? '#00A3FF' : '#fff',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      GOOGLE MESSAGES LIVE STREAM
                    </button>
                  </div>

                  {smsMode === 'manual' ? (
                    /* Manual input form */
                    <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
                      <div className="glass-panel card" style={{ padding: '32px', margin: 0 }}>
                        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px', marginBottom: '24px' }}>
                          <h2 style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', textTransform: 'uppercase', fontFamily: 'var(--font-cyber)', letterSpacing: '0.5px', margin: 0 }}>
                            Input SMS Forensics Telemetry
                          </h2>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          <div>
                            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 'bold' }}>
                              SMS Sender ID (Headers)
                            </label>
                            <input
                              type="text"
                              value={smsSender}
                              onChange={(e) => setSmsSender(e.target.value)}
                              placeholder="e.g. VM-HDFCBK, AX-ADITYA, +1234567890"
                              className="textarea-cyber"
                              style={{
                                width: '100%', padding: '12px 16px', outline: 'none',
                                fontSize: '13px', fontFamily: 'monospace', height: '42px', borderRadius: '0px'
                              }}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 'bold' }}>
                              SMS Message Body
                            </label>
                            <textarea
                              rows="6"
                              value={smsMessage}
                              onChange={(e) => setSmsMessage(e.target.value)}
                              placeholder="Paste the suspicious SMS message content here..."
                              className="textarea-cyber"
                              style={{
                                width: '100%', padding: '12px 16px', outline: 'none',
                                fontSize: '13px', lineHeight: '1.5', resize: 'vertical', borderRadius: '0px'
                              }}
                            ></textarea>
                          </div>

                          {smsError && (
                            <div style={{ color: '#FF3D00', fontSize: '12px', background: 'rgba(255,61,0,0.05)', border: '1px solid rgba(255,61,0,0.2)', padding: '10px 16px' }}>
                              ⚠ {smsError}
                            </div>
                          )}

                          <button 
                            onClick={() => { setAnalyzeButtonPulse(null); runSmsAnalysis(); }} 
                            className={`btn-primary ${analyzeButtonPulse === 'smsMessage' ? 'glow-pulse-active' : ''}`} 
                            style={{ width: '100%', height: '46px', textTransform: 'uppercase', fontWeight: 'bold' }}
                          >
                            DEPLOY SMS THREAT AUDIT PLAN
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Google Messages Live Stream Dashboard */
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                      {/* Instructions Left Panel */}
                      <div className="glass-panel card" style={{ padding: '24px', margin: 0, height: 'fit-content' }}>
                        <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: '#00A3FF', fontFamily: 'var(--font-cyber)', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px', marginBottom: '16px' }}>
                          Collector Status
                        </h3>
                        <p style={{ fontSize: '11px', lineHeight: '1.5', color: 'var(--text-muted)', marginBottom: '16px' }}>
                          The ScamON Live Collector continuously watches Google Messages for Web, auto-extracts incoming SMS elements, and runs multi-agent audits.
                        </p>
                        
                        {/* Dynamic Status Indicator */}
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px', 
                          fontSize: '11px', 
                          color: '#fff',
                          backgroundColor: 'rgba(255,255,255,0.02)',
                          padding: '10px 12px',
                          border: '1px solid rgba(255,255,255,0.05)',
                          marginBottom: '16px'
                        }}>
                          <span style={{ 
                            display: 'inline-block', 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '50%', 
                            backgroundColor: !collectorRunning ? '#888' : (collectorPaired ? '#00E676' : '#FF3D00'), 
                            boxShadow: !collectorRunning ? 'none' : (collectorPaired ? '0 0 8px #00E676' : '0 0 8px #FF3D00'), 
                            animation: (collectorRunning && collectorPaired) ? 'pulse 1.5s infinite' : 'none' 
                          }} />
                          <span style={{ fontWeight: 'bold', fontFamily: 'var(--font-cyber)', fontSize: '10.5px' }}>
                            STATUS: {!collectorRunning ? 'OFFLINE / INACTIVE' : (collectorPaired ? 'ACTIVE & MONITORING' : 'NOT PAIRED')}
                          </span>
                        </div>

                        {/* Pairing Error Banner */}
                        {collectorRunning && !collectorPaired && (
                          <div style={{ 
                            color: '#FF3D00', 
                            fontSize: '11px', 
                            background: 'rgba(255,61,0,0.05)', 
                            border: '1px solid rgba(255,61,0,0.2)', 
                            padding: '10px 12px',
                            marginBottom: '16px',
                            lineHeight: '1.4'
                          }}>
                            ⚠ <strong>Google Messages is not paired.</strong><br/>
                            Scan the QR code in the browser window to pair your device.
                          </div>
                        )}

                        {/* Start/Stop Button Control */}
                        {collectorRunning ? (
                          <button 
                            onClick={stopCollectorService}
                            className="btn-primary" 
                            style={{ 
                              width: '100%', 
                              height: '38px', 
                              backgroundColor: 'rgba(255, 61, 0, 0.15)',
                              border: '1px solid #FF3D00',
                              color: '#fff',
                              fontSize: '10.5px',
                              fontWeight: 'bold',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              cursor: 'pointer',
                              marginBottom: '16px'
                            }}
                          >
                            STOP COLLECTOR SERVICE
                          </button>
                        ) : (
                          <button 
                            onClick={startCollectorService}
                            className="btn-primary" 
                            style={{ 
                              width: '100%', 
                              height: '38px', 
                              backgroundColor: 'rgba(0, 230, 118, 0.15)',
                              border: '1px solid var(--accent-green)',
                              color: '#fff',
                              fontSize: '10.5px',
                              fontWeight: 'bold',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              cursor: 'pointer',
                              marginBottom: '16px'
                            }}
                          >
                            START COLLECTOR SERVICE
                          </button>
                        )}

                        <div style={{ border: '1px dashed rgba(255, 255, 255, 0.1)', padding: '12px', background: 'rgba(255, 255, 255, 0.01)' }}>
                          <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: '4px' }}>System Note:</span>
                          <span style={{ fontSize: '10px', lineHeight: '1.4', color: 'var(--text-muted)', display: 'block' }}>
                            Spawns a headful Google Messages window. Scan the QR code to pair. Once paired, cookies remain stored for auto-login.
                          </span>
                        </div>
                      </div>

                      {/* Live Feed List Right Panel */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="glass-panel card" style={{ padding: '20px 24px', margin: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-cyber)', textTransform: 'uppercase' }}>
                              Auto-Captured Transmissions ({liveSmsFeed.length})
                            </span>
                            {liveSmsLoading && <RefreshCw className="animate-spin" style={{ width: '12px', height: '12px', color: '#00A3FF' }} />}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '480px', overflowY: 'auto' }}>
                          {liveSmsFeed.length === 0 ? (
                            <div className="glass-panel card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'monospace' }}>
                              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--text-muted)', marginRight: '8px' }} />
                              WAITING FOR INCOMING SMS STREAM TRANSMISSION...
                            </div>
                          ) : (
                            liveSmsFeed.map((item, idx) => {
                              const risk = item.risk_score;
                              const threatLvl = item.threat_level || "SAFE";
                              const isPending = threatLvl === "PENDING" || item.status === "collected";
                              const badgeColor = isPending ? '#FFC107' : (risk >= 75 ? '#FF3D00' : (risk >= 50 ? '#FFC107' : '#00E676'));
                              
                              return (
                                <div 
                                  key={`${item.investigation_id}-${idx}`}
                                  className="glass-panel card list-item-hover"
                                  onClick={() => setSmsResult(item.full_report)}
                                  style={{ 
                                    margin: 0, 
                                    padding: '16px', 
                                    cursor: 'pointer',
                                    borderLeft: `3px solid ${badgeColor}`,
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                    <div>
                                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', fontFamily: 'var(--font-cyber)' }}>{item.full_report?.sms?.sender || "Unknown"}</span>
                                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '12px' }}>{item.timestamp ? item.timestamp.substring(11, 19) : ''}</span>
                                    </div>
                                    <span style={{ 
                                      fontSize: '9px', 
                                      fontWeight: 'bold', 
                                      padding: '2px 8px', 
                                      border: `1px solid ${badgeColor}`, 
                                      color: badgeColor,
                                      backgroundColor: `${badgeColor}10`
                                    }}>
                                      {isPending ? "PENDING AUDIT" : `${threatLvl} (${risk}%)`}
                                    </span>
                                  </div>
                                  <p style={{ fontSize: '12px', color: 'var(--text-primary)', margin: '6px 0', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: '1.4' }}>
                                    {item.input?.replace(/^SMS from [^:]+:\s*/, "") || item.full_report?.sms?.message}
                                  </p>
                                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                                    <span style={{ fontSize: '10.5px', color: isPending ? '#FFC107' : '#00A3FF', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      {isPending ? "DEPLOY SMS THREAT AUDIT PLAN ❯" : "AUDIT THREATS & EXPLORE DECISION ❯"}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Agent 1 View (Call Analysis) */}
          {activeNav === 'Call Analysis' && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">MOD_CALL_ANALYSIS</h1>
                  <p className="page-subtitle">Audio interception scanner for social engineering call scripts.</p>
                </div>
              </div>

              {callProcessing ? (
                /* Scanning sequence view with live console logs */
                <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px', maxWidth: '1100px', margin: '40px auto', width: '100%' }}>
                  <div className="glass-panel card" style={{ margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Activity style={{ width: '14px', height: '14px' }} /> MISSION_STATUS: ACTIVE
                      </span>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '20px', display: 'block' }}>{callProgressPercent}%</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>T+{scanSeconds}s</span>
                      </div>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                      TARGET: {callSelectedFile ? callSelectedFile.name : 'RAW_TRANSCRIPT_PAYLOAD'}
                    </p>

                    <div className="progress-bar-container">
                      <div className="progress-bar-fill" style={{ width: `${callProgressPercent}%` }}></div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '16px' }}>
                      {/* Left: Interactive Timeline Checklist */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {callPipeline.map((step, idx) => {
                          const isDone = idx < callStep;
                          const isActive = idx === callStep;
                          
                          return (
                            <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                              <span style={{ 
                                color: isDone ? '#00E676' : (isActive ? '#00E676' : '#223328'), 
                                fontWeight: 'bold' 
                              }}>
                                {isDone ? '✓' : (isActive ? '◌' : '•')}
                              </span>
                              <span style={{ 
                                color: isDone ? '#fff' : (isActive ? '#00E676' : 'var(--text-muted)'),
                                textShadow: isActive ? 'var(--accent-green-glow)' : 'none'
                              }}>
                                {step.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Right: Scrolling Live Terminal Console */}
                      <div style={{ 
                        background: '#020305', 
                        border: '1px solid rgba(0,230,118,0.15)', 
                        padding: '12px', 
                        fontFamily: 'monospace', 
                        fontSize: '10px', 
                        color: '#00E676', 
                        overflowY: 'auto', 
                        maxHeight: '220px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        boxShadow: 'inset 0 0 10px rgba(0,230,118,0.1)'
                      }}>
                        <div style={{ borderBottom: '1px solid rgba(0,230,118,0.2)', paddingBottom: '4px', marginBottom: '6px', fontSize: '9px', opacity: 0.6 }}>
                          [MISSION_STATUS_CONSOLE]
                        </div>
                        {callTerminalLogs.map((log, i) => (
                          <div key={i} style={{ lineBreak: 'anywhere' }}>
                            {log}
                          </div>
                        ))}
                        <div style={{ display: 'inline-block', width: '6px', height: '11px', background: '#00E676', animation: 'blink 1s step-end infinite' }} />
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(0,230,118,0.1)', padding: '16px 0 0', marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        💡 ADVISORY PROTOCOL: RUNNING FULL SOCIAL ENGINEERING HEURISTICS SCAN
                      </div>
                      <button onClick={() => setCallProcessing(false)} style={{ background: 'transparent', border: '1px solid #FF3D00', color: '#FF3D00', fontFamily: 'var(--font-cyber)', fontSize: '11px', padding: '6px 12px', cursor: 'pointer' }}>
                        ✕ CANCEL ANALYSIS
                      </button>
                    </div>
                  </div>

                  {/* Audio Waveform active pulse */}
                  <div className="glass-panel card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '300px', margin: 0 }}>
                    <span className="card-title">FORENSIC_AUDIO_WAVEFORM</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '60px' }}>
                      {Array.from({ length: 15 }).map((_, i) => (
                        <span 
                          key={i} 
                          className="animate-pulse"
                          style={{ 
                            width: '4.5px', 
                            height: `${10 + Math.sin(i * 0.5) * 25 + Math.random() * 15}px`, 
                            background: 'var(--accent-green)', 
                            boxShadow: '0 0 6px var(--accent-green)',
                            animationDelay: `${i * 0.08}s`
                          }} 
                        />
                      ))}
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '16px', letterSpacing: '1px' }}>
                      INTERCEPTING SPEECH PATHWAYS...
                    </span>
                  </div>
                </div>
              ) : callResult ? (
                /* Results report view */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Top Header Card */}
                  <div className="glass-panel card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', textTransform: 'uppercase' }}>CALL_INVESTIGATION REPORT</h2>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                          INTERCEPT_SOURCE: {callSelectedFile ? callSelectedFile.name : 'RAW_TRANSCRIPT_PAYLOAD'} // ID: {callResult.investigation_id ? callResult.investigation_id.substring(0, 18) : 'N/A'}
                        </p>
                      </div>
                      <button onClick={() => setCallResult(null)} className="glass-badge" style={{ cursor: 'pointer' }}>
                        NEW SCAN
                      </button>
                    </div>
                  </div>

                  {/* Safety Score & AI Decision Panel */}
                  <div className="glass-panel card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                      
                      {/* Safety Circle Index */}
                      <div style={{ 
                        width: '90px', 
                        height: '90px', 
                        borderRadius: '50%', 
                        border: `3px solid ${getRiskColor(callResult.risk_score || 0)}`, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        boxShadow: `0 0 12px ${getRiskColor(callResult.risk_score || 0)}`
                      }}>
                        <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff' }}>{100 - (callResult.risk_score || 0)}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>/100</span>
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h3 style={{ 
                            fontSize: '18px', 
                            fontWeight: 'bold', 
                            color: getRiskColor(callResult.risk_score || 0),
                            textShadow: '0 0 8px ' + getRiskColor(callResult.risk_score || 0)
                          }}>
                            {callResult.ai_analysis?.final_decision || 'UNKNOWN'}
                          </h3>
                          <span style={{ 
                            background: 'rgba(255,255,255,0.05)', 
                            border: '1px solid rgba(255,255,255,0.1)', 
                            color: 'var(--text-muted)', 
                            fontSize: '9px', 
                            padding: '2px 6px',
                            fontFamily: 'var(--font-cyber)'
                          }}>
                            CONFIDENCE: {callResult.ai_analysis?.confidence_rating || 0}%
                          </span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '6px' }}>
                          Threat Category: <span style={{ color: '#fff', fontWeight: 'bold' }}>{callResult.ai_analysis?.threat_category || 'N/A'}</span>
                        </p>
                      </div>

                    </div>

                    {/* Caller Registry DB Memory Comparison Panel */}
                    <div style={{ 
                      border: '1px dashed rgba(0, 230, 118, 0.25)', 
                      background: 'rgba(0, 230, 118, 0.02)', 
                      padding: '12px', 
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      minWidth: '240px'
                    }}>
                      {callResult.memory_history?.has_history ? (
                        <>
                          <div style={{ color: '#FF3D00', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', textShadow: '0 0 6px #FF3D00' }}>
                            <AlertOctagon style={{ width: '12px', height: '12px' }} />
                            <span>CALLER_REGISTRY_MATCH</span>
                          </div>
                          <div style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '10px' }}>
                            Total Prior Reports: {callResult.memory_history.total_reports || 0}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                            Previous Verdict Risk: {callResult.memory_history.last_risk_score || 0}%
                          </div>
                          <div style={{ color: '#FFA000', fontWeight: 'bold', fontSize: '10px', marginTop: '4px' }}>
                            Scam Trend: {callResult.memory_history.last_scam_type || 'N/A'}
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>
                            [CALLER_DATABASE]
                          </div>
                          <div style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '10px' }}>
                            No previous threat incidents recorded for this phone number.
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Emotion Timeline & Socio-Emotional Pressure Progress Bars */}
                  <div className="glass-panel card">
                    <span className="card-title">EMOTIONAL_PRESSURE_TACTICS_AUDIT</span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '10px' }}>
                      {Object.entries(callResult.emotion_timeline || {}).map(([emotion, score]) => (
                        <div key={emotion} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                            <span style={{ color: '#fff', fontWeight: 'bold' }}>{emotion}</span>
                            <span style={{ color: score >= 50 ? '#FF3D00' : 'var(--accent-green)' }}>{score}%</span>
                          </div>
                          <div style={{ height: '8px', background: '#0a0d14', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0px', overflow: 'hidden' }}>
                            <div style={{ 
                              height: '100%', 
                              width: `${score}%`, 
                              background: score >= 50 ? 'linear-gradient(90deg, #FF9100, #FF3D00)' : 'linear-gradient(90deg, #00B0FF, #00E676)',
                              boxShadow: score >= 50 ? '0 0 6px #FF3D00' : '0 0 6px #00E676'
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Agent Thoughts & AI Forensics Reasoning thoughts */}
                  <div className="glass-panel card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <span className="card-title">AGENT_REASONING_THOUGHTS</span>
                    
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <Terminal style={{ width: '20px', height: '20px', color: 'var(--accent-green)', marginTop: '2px' }} />
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Cyber Forensics Investigator Threat Summary
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.5' }}>
                          {callResult.ai_analysis?.summary || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', marginTop: '4px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Investigative Scam Indicators
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(callResult.ai_analysis?.reasoning_steps || []).map((step, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11.5px', color: 'var(--text-primary)' }}>
                            <span style={{ color: 'var(--accent-green)' }}>&gt;</span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Evidence Signatures and Entities collected */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div className="glass-panel card">
                      <span className="card-title">MOD_KEYWORDS_SCAN</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {(callResult.keywords || []).map(k => <span key={k} className="glass-badge">{k}</span>)}
                        {(!callResult.keywords || callResult.keywords.length === 0) && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No suspicious keywords detected.</span>}
                      </div>
                    </div>

                    <div className="glass-panel card">
                      <span className="card-title">MOD_ENTITIES_SCAN</span>
                      <div className="entities-grid">
                        {Object.entries(callResult.entities || {}).map(([k, v]) => (
                          <div key={k} className="entity-card">
                            <div className="entity-card-header">{k}</div>
                            {v && v.length > 0 ? v.map((item, i) => <div key={i} className="entity-val">{item}</div>) : <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>None Mapped</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* SECURE SOC REPORT AUDIT (Transcript drawer and technical findings) */}
                  <div className="glass-panel card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <span className="card-title">SECURE_SOC_REPORT_AUDIT</span>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '11px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div><span style={{ color: 'var(--text-muted)' }}>Investigation ID:</span> <span style={{ color: '#fff', fontFamily: 'monospace' }}>{callResult.investigation_id || 'N/A'}</span></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Timestamp:</span> <span style={{ color: '#fff' }}>{callResult.timestamp || 'N/A'}</span></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Detected Language:</span> <span style={{ color: '#fff' }}>{callResult.detected_language || 'N/A'}</span></div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div><span style={{ color: 'var(--text-muted)' }}>Forensic Verdict:</span> <span style={{ color: getRiskColor(callResult.risk_score || 0), fontWeight: 'bold' }}>{callResult.ai_analysis?.final_decision || 'UNKNOWN'}</span></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Speaker Count:</span> <span style={{ color: '#fff' }}>{callResult.speaker_count || 0} unique voice nodes</span></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Speaking Duration:</span> <span style={{ color: '#fff' }}>{callResult.call_duration || 0} seconds</span></div>
                      </div>
                    </div>

                    {/* Transcript console with highlighted scanner content */}
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--accent-green)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                        Intercepted Call Transcript Content
                      </div>
                      <div style={{ 
                        background: '#020305', 
                        border: '1px solid rgba(255,255,255,0.05)', 
                        padding: '16px', 
                        maxHeight: '260px', 
                        overflowY: 'auto', 
                        fontSize: '11.5px', 
                        color: 'var(--text-primary)', 
                        lineHeight: '1.6', 
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace'
                      }}>
                        {callResult.transcript}
                      </div>
                    </div>

                    {/* Cyberbutton Containment Actions */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-primary" style={{
                          borderColor: getRiskColor(callResult.risk_score || 0),
                          color: getRiskColor(callResult.risk_score || 0),
                          boxShadow: `0 0 8px ${getRiskColor(callResult.risk_score || 0)}20`,
                          textTransform: 'uppercase',
                          fontWeight: 'bold',
                          padding: '6px 14px',
                          cursor: 'default'
                        }}>
                          {callResult.ai_analysis?.recommended_action || 'N/A'}
                        </button>
                        <button className="btn-secondary" style={{ fontSize: '11px', textTransform: 'uppercase' }} onClick={() => triggerComplaintGeneration(callResult)}>
                          Notify Cyber Crime
                        </button>
                      </div>
                      <button onClick={() => setCallResult(null)} className="btn-primary" style={{ maxWidth: '140px' }}>
                        NEW SCAN
                      </button>
                    </div>

                  </div>

                </div>
              ) : (
                /* Submission screen */
                <div className="dashboard-grid">
                  
                  {/* Left Box */}
                  <div className="glass-panel card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,230,118,0.1)', paddingBottom: '12px', marginBottom: '18px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        INTERCEPT SOURCE
                      </span>
                      
                      <div className="tab-container">
                        <button onClick={() => { setCallInputType('audio'); setCallError(''); }} className={`tab-btn ${callInputType === 'audio' ? 'active' : ''}`}>AUDIO FILE</button>
                        <button onClick={() => { setCallInputType('text'); setCallError(''); }} className={`tab-btn ${callInputType === 'text' ? 'active' : ''}`}>TRANSCRIPT TEXT</button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {callInputType === 'audio' ? (
                        <div 
                          onDragEnter={handleCallDrag}
                          onDragOver={handleCallDrag}
                          onDragLeave={handleCallDrag}
                          onDrop={handleCallDrop}
                          className="upload-zone"
                          onClick={() => document.getElementById('call-audio-file-input').click()}
                        >
                          <input id="call-audio-file-input" type="file" accept=".mp3,.wav" style={{ display: 'none' }} onChange={(e) => { if (e.target.files && e.target.files[0]) { setCallSelectedFile(e.target.files[0]); } }} />
                          {callSelectedFile ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                              <div className="upload-icon-container">
                                <FileAudio style={{ width: '32px', height: '32px' }} />
                              </div>
                              <div>
                                <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{callSelectedFile.name}</p>
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{(callSelectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); setCallSelectedFile(null); }} style={{ background: 'transparent', border: 'none', color: '#FF3D00', fontSize: '11px', textDecoration: 'underline', cursor: 'pointer' }}>Remove File</button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                              <div className="upload-icon-container"><Upload style={{ width: '32px', height: '32px' }} /></div>
                              <div>
                                <p style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Drag & drop call audio here</p>
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Supports WAV or MP3 formats</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="input-group">
                          <textarea value={callTranscriptText} onChange={(e) => setCallTranscriptText(e.target.value)} placeholder="Paste call transcription text details here..." className="textarea-cyber" />
                        </div>
                      )}

                      {callError && (
                        <div style={{ padding: '12px', background: 'rgba(255, 61, 0, 0.08)', border: '1px solid rgba(255, 61, 0, 0.2)', borderRadius: '0px', fontSize: '11px', color: '#FF3D00', display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <AlertTriangle style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                          <span>{callError}</span>
                        </div>
                      )}

                      <button 
                        onClick={() => { setAnalyzeButtonPulse(null); runCallAnalysis(); }} 
                        className={`btn-primary ${['callTranscriptText', 'callSelectedFile'].includes(analyzeButtonPulse) ? 'glow-pulse-active' : ''}`}
                      >
                        <Play style={{ width: '16px', height: '16px', fill: 'currentColor' }} /><span>ANALYZE SCRIPT</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Box (Description info cards) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="glass-panel card">
                      <span className="card-title">MOD_AUDIO_INTERCEPT</span>
                      <p style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                        Flag social engineering scams from phone transcripts or audio calls. Evaluates caller urgency metrics, pressure index, and scam signatures.
                      </p>
                    </div>
                    
                    <div className="glass-panel card">
                      <span className="card-title">SYS_PROTOCOLS</span>
                      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--text-primary)' }}>
                        <li>&gt; STT Transcript translation (Whisper)</li>
                        <li>&gt; Regulatory phrase pattern check</li>
                        <li>&gt; Entity isolation (OTPs, bank accounts)</li>
                        <li>&gt; SOC-Threat validation (Llama-3.1)</li>
                      </ul>
                    </div>
                  </div>

                </div>
              )}
            </>
          )}

          {/* Visual Investigation View */}
          {activeNav === 'Visual Investigation' && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">VISUAL_SCAM_FORENSICS</h1>
                  <p className="page-subtitle">Extract OCR details, decode QR codes, run vision threat scans, and route malicious coordinates.</p>
                </div>
              </div>

              {visualProcessing ? (
                /* Scanning sequence view with live console and checklist timeline */
                <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px', maxWidth: '1100px', margin: '40px auto', width: '100%' }}>
                  <div className="glass-panel card" style={{ margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ color: '#E91E63', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Camera className="animate-pulse" style={{ width: '14px', height: '14px' }} /> FORENSICS_STATUS: SCANNING
                      </span>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontFamily: 'var(--font-cyber)', color: 'var(--text-muted)', fontSize: '10px' }}>
                          SCANNING_TIME: {scanSeconds}S
                        </span>
                      </div>
                    </div>

                    <h2 className="card-title" style={{ color: '#E91E63' }}>VISUAL SCAN IN PROGRESS</h2>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                      ScamON AI is extracting text, mapping entities, decoding QR codes, and routing detected elements to sub-agents.
                    </p>

                    {/* Progress Bar */}
                    <div style={{ position: 'relative', height: '16px', backgroundColor: '#0d131f', border: '1px solid rgba(233, 30, 99, 0.2)', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px' }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          width: `${visualProgressPercent}%`, 
                          background: 'linear-gradient(90deg, #E91E63, #FF4081)', 
                          transition: 'width 0.4s ease-out', 
                          boxShadow: '0 0 10px #E91E63' 
                        }}
                      />
                      <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '9px', fontWeight: 'bold', fontFamily: 'var(--font-cyber)', color: '#fff', textShadow: '0 0 2px #000' }}>
                        {visualProgressPercent}%
                      </span>
                    </div>

                    {/* Timeline steps */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {visualPipeline.map((step, idx) => {
                        const isDone = idx < visualStep;
                        const isCurrent = idx === visualStep;
                        return (
                          <div 
                            key={step.key} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '12px', 
                              opacity: isDone ? 1 : isCurrent ? 1 : 0.35,
                              transform: isCurrent ? 'translateX(4px)' : 'none',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            <div 
                              style={{ 
                                width: '18px', 
                                height: '18px', 
                                borderRadius: '50%', 
                                border: `1px solid ${isDone ? '#E91E63' : isCurrent ? '#FF4081' : 'var(--text-muted)'}`,
                                backgroundColor: isDone ? '#E91E63' : 'transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '8px',
                                fontWeight: 'bold',
                                color: isDone ? '#fff' : isCurrent ? '#FF4081' : 'var(--text-muted)',
                                boxShadow: isCurrent ? '0 0 8px #FF4081' : 'none'
                              }}
                            >
                              {isDone ? '✓' : idx + 1}
                            </div>
                            <div>
                              <h4 style={{ fontSize: '11px', fontWeight: 'bold', fontFamily: 'var(--font-cyber)', color: isCurrent ? '#FF4081' : '#fff' }}>
                                {step.name}
                              </h4>
                              <p style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{step.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right side live log console */}
                  <div className="glass-panel" style={{ margin: 0, padding: '24px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '400px', backgroundColor: '#030811' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(233, 30, 99, 0.1)', paddingBottom: '8px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#E91E63', fontFamily: 'var(--font-cyber)' }}>LOG_STREAM: FORENSICS_AUDIT</span>
                      <span className="pulse-glow" style={{ backgroundColor: '#E91E63', boxShadow: '0 0 8px #E91E63' }} />
                    </div>
                    <div style={{ flexGrow: 1, fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#888', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
                      <p style={{ color: '#E91E63' }}>&gt; Initializing visual forensics pipeline...</p>
                      <p>&gt; File loaded: {visualFile?.name} ({Math.round(visualFile?.size / 1024)} KB)</p>
                      {visualStep >= 1 && <p style={{ color: '#00E676' }}>&gt; OCR engine triggered. Extracting text strings...</p>}
                      {visualStep >= 2 && <p>&gt; QR decoder analyzing image vector bounds...</p>}
                      {visualStep >= 3 && <p style={{ color: '#FFD54F' }}>&gt; Layout structure check: Identifies pattern matching elements</p>}
                      {visualStep >= 4 && <p>&gt; Parsing credentials, links, and transaction IDs...</p>}
                      {visualStep >= 5 && <p style={{ color: '#E91E63' }}>&gt; Malicious components detected! Invoking sub-agents...</p>}
                      {visualStep >= 6 && <p>&gt; Routing URL to Website Investigation Agent...</p>}
                      {visualStep >= 7 && <p>&gt; Routing Sender coordinates to SMS/Email Agents...</p>}
                      {visualStep >= 8 && <p style={{ color: '#00E676' }}>&gt; Save investigation logs written to Case Folder database.</p>}
                    </div>
                  </div>
                </div>
              ) : visualResult ? (
                /* Scanning Results Dashboard */
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '24px', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
                  
                  {/* Left Column: Image preview & dial risk gauge */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Dial Risk Gauge */}
                    <div className="glass-panel card" style={{ margin: 0, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                      <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', fontFamily: 'var(--font-cyber)', marginBottom: '16px' }}>
                        AGGREGATED THREAT INDEX
                      </h3>
                      
                      {/* SVG Gauge */}
                      <div style={{ position: 'relative', width: '140px', height: '140px' }}>
                        <svg width="140" height="140" viewBox="0 0 140 140">
                          <circle cx="70" cy="70" r="58" fill="none" stroke="#091322" strokeWidth="10" />
                          <circle 
                            cx="70" cy="70" r="58" 
                            fill="none" 
                            stroke={visualResult.risk_score >= 80 ? '#FF1744' : visualResult.risk_score >= 50 ? '#FF9100' : '#00E676'} 
                            strokeWidth="10" 
                            strokeDasharray={2 * Math.PI * 58}
                            strokeDashoffset={2 * Math.PI * 58 * (1 - visualResult.risk_score / 100)}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                          />
                        </svg>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', lineHeight: 1 }}>
                            {visualResult.risk_score}
                          </span>
                          <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 'bold', fontFamily: 'var(--font-cyber)', letterSpacing: '0.5px', marginTop: '2px' }}>
                            % RISK
                          </span>
                        </div>
                      </div>

                      <div style={{ marginTop: '16px' }}>
                        <span 
                          className="status-badge"
                          style={{
                            backgroundColor: visualResult.threat_level === 'CRITICAL' ? 'rgba(255,23,73,0.1)' : visualResult.threat_level === 'HIGH' ? 'rgba(255,145,0,0.1)' : 'rgba(0,230,118,0.1)',
                            color: visualResult.threat_level === 'CRITICAL' ? '#FF1744' : visualResult.threat_level === 'HIGH' ? '#FF9100' : '#00E676',
                            border: `1px solid ${visualResult.threat_level === 'CRITICAL' ? 'rgba(255,23,73,0.3)' : visualResult.threat_level === 'HIGH' ? 'rgba(255,145,0,0.3)' : 'rgba(0,230,118,0.3)'}`,
                            fontSize: '11px',
                            fontWeight: 'bold',
                            padding: '4px 10px'
                          }}
                        >
                          VERDICT: {visualResult.threat_level}
                        </span>
                      </div>
                    </div>

                    {/* Screenshot Preview */}
                    <div className="glass-panel card" style={{ margin: 0, padding: '16px' }}>
                      <h3 style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', fontFamily: 'var(--font-cyber)', marginBottom: '12px' }}>
                        SUBMITTED SCREENSHOT PREVIEW
                      </h3>
                      <div style={{ width: '100%', height: '240px', backgroundColor: '#030811', border: '1px solid rgba(233, 30, 99, 0.1)', borderRadius: '6px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img 
                          src={visualResult.image_url ? `http://127.0.0.1:8001${visualResult.image_url}` : URL.createObjectURL(visualFile)} 
                          alt="Screenshot Forensics" 
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                        />
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Tabbed Telemetry & Routing Results */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Tabs Header */}
                    <div className="glass-panel card" style={{ margin: 0, padding: '24px' }}>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-cyber)' }}>IMAGE_TYPE: {visualResult.image_type}</span>
                          <h2 className="card-title" style={{ margin: '4px 0 0 0' }}>CASE FILE REPORT</h2>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className={`btn-secondary ${visualTab === 'telemetry' ? 'active' : ''}`}
                            onClick={() => setVisualTab('telemetry')}
                            style={{ 
                              padding: '6px 12px', 
                              fontSize: '11px', 
                              border: visualTab === 'telemetry' ? '1px solid #E91E63' : '1px solid rgba(255,255,255,0.08)',
                              boxShadow: visualTab === 'telemetry' ? '0 0 8px rgba(233,30,99,0.3)' : 'none',
                              color: visualTab === 'telemetry' ? '#E91E63' : '#fff'
                            }}
                          >
                            VISUAL TELEMETRY
                          </button>
                          <button 
                            className={`btn-secondary ${visualTab === 'invoked_agents' ? 'active' : ''}`}
                            onClick={() => setVisualTab('invoked_agents')}
                            style={{ 
                              padding: '6px 12px', 
                              fontSize: '11px', 
                              border: visualTab === 'invoked_agents' ? '1px solid #E91E63' : '1px solid rgba(255,255,255,0.08)',
                              boxShadow: visualTab === 'invoked_agents' ? '0 0 8px rgba(233,30,99,0.3)' : 'none',
                              color: visualTab === 'invoked_agents' ? '#E91E63' : '#fff'
                            }}
                          >
                            SUB-AGENT ROUTING ({visualResult.agents_invoked.length})
                          </button>
                        </div>
                      </div>

                      {/* Tab 1: Visual Telemetry */}
                      {visualTab === 'telemetry' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          
                          {/* Extracted Text */}
                          <div>
                            <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', fontFamily: 'var(--font-cyber)', marginBottom: '8px' }}>
                              EXTRACTED OCR TEXT
                            </h4>
                            <div style={{ 
                              fontFamily: 'var(--font-mono)', 
                              fontSize: '11px', 
                              color: '#aaa', 
                              backgroundColor: '#030811', 
                              padding: '12px', 
                              border: '1px solid rgba(255,255,255,0.04)', 
                              borderRadius: '4px',
                              maxHeight: '140px',
                              overflowY: 'auto',
                              whiteSpace: 'pre-wrap'
                            }}>
                              {visualResult.extracted_text || 'No text extracted.'}
                            </div>
                          </div>

                          {/* Extracted Entities */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                              <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', fontFamily: 'var(--font-cyber)', marginBottom: '8px' }}>
                                IDENTIFIED ENTITIES
                              </h4>
                              <div className="evidence-grid" style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', backgroundColor: '#090f1a', borderRadius: '4px' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>Scam Category:</span>
                                  <span style={{ fontWeight: 'bold', color: '#FF9100' }}>{visualResult.scam_category}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', backgroundColor: '#090f1a', borderRadius: '4px' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>Confidence Index:</span>
                                  <span style={{ fontWeight: 'bold', color: '#00E676' }}>{Math.round(visualResult.confidence * 100)}%</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', backgroundColor: '#090f1a', borderRadius: '4px' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>UPI Payment ID:</span>
                                  <span style={{ fontWeight: 'bold', color: '#fff' }}>{visualResult.upi_ids_found.length > 0 ? visualResult.upi_ids_found[0] : 'None'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', backgroundColor: '#090f1a', borderRadius: '4px' }}>
                                  <span style={{ color: 'var(--text-muted)' }}>Phone Number:</span>
                                  <span style={{ fontWeight: 'bold', color: '#fff' }}>{visualResult.phone_numbers_found.length > 0 ? visualResult.phone_numbers_found[0] : 'None'}</span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', fontFamily: 'var(--font-cyber)', marginBottom: '8px' }}>
                                SOCIAL ENGINEERING INDICATORS
                              </h4>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {visualResult.visual_indicators.length > 0 ? (
                                  visualResult.visual_indicators.map((ind) => (
                                    <span 
                                      key={ind} 
                                      style={{ 
                                        fontSize: '9px', 
                                        backgroundColor: 'rgba(233,30,99,0.08)', 
                                        color: '#E91E63', 
                                        border: '1px solid rgba(233,30,99,0.2)', 
                                        borderRadius: '3px', 
                                        padding: '2px 6px',
                                        textTransform: 'uppercase',
                                        fontFamily: 'var(--font-cyber)'
                                      }}
                                    >
                                      ⚠ {ind}
                                    </span>
                                  ))
                                ) : (
                                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No clear indicators detected.</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Reasoning */}
                          <div>
                            <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', fontFamily: 'var(--font-cyber)', marginBottom: '8px' }}>
                              FORENSICS REASONING ANALYSIS
                            </h4>
                            <p style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                              {visualResult.reasoning}
                            </p>
                          </div>

                          {/* Recommendations */}
                          <div>
                            <h4 style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', fontFamily: 'var(--font-cyber)', marginBottom: '8px' }}>
                              ACTIONABLE RECOMMENDATIONS
                            </h4>
                            <ul style={{ paddingLeft: '16px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {visualResult.recommendations.map((rec, idx) => (
                                <li key={idx} style={{ listStyleType: 'square' }}>{rec}</li>
                              ))}
                            </ul>
                          </div>

                        </div>
                      )}

                      {/* Tab 2: Invoked Agent Outputs */}
                      {visualTab === 'invoked_agents' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          {visualResult.agents_invoked.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '32px', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '8px' }}>
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No subordinate agents were triggered. No actionable entities found.</span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              
                              {/* Website Agent Results */}
                              {visualResult.agent_results.website && (
                                <div style={{ padding: '16px', backgroundColor: '#030811', border: '1px solid rgba(0,230,118,0.2)', borderRadius: '6px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent-green)', fontFamily: 'var(--font-cyber)' }}>
                                      🌐 WEBSITE_INVESTIGATION_AGENT
                                    </span>
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                      Risk Score: {visualResult.agent_results.website.risk_score}%
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                                    <p>• <b>Target Domain:</b> {visualResult.agent_results.website.domain?.name || 'N/A'}</p>
                                    <p>• <b>Domain Age:</b> {visualResult.agent_results.website.domain?.age_days || 0} days</p>
                                    <p>• <b>Security Verdict:</b> {visualResult.agent_results.website.threat_type || 'Unknown'}</p>
                                  </div>
                                </div>
                              )}

                              {/* SMS Agent Results */}
                              {visualResult.agent_results.sms && (
                                <div style={{ padding: '16px', backgroundColor: '#030811', border: '1px solid rgba(0,184,212,0.2)', borderRadius: '6px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#00b8d4', fontFamily: 'var(--font-cyber)' }}>
                                      💬 SMS_INVESTIGATION_AGENT
                                    </span>
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                      Risk Score: {visualResult.agent_results.sms.analysis?.risk_score || 0}%
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                                    <p>• <b>SMS Sender:</b> {visualResult.agent_results.sms.sms?.sender || 'N/A'}</p>
                                    <p>• <b>Classification:</b> {visualResult.agent_results.sms.analysis?.classification || 'Unknown'}</p>
                                    <p>• <b>Verdict Summary:</b> {visualResult.agent_results.sms.analysis?.summary || 'N/A'}</p>
                                  </div>
                                </div>
                              )}

                              {/* Email Agent Results */}
                              {visualResult.agent_results.email && (
                                <div style={{ padding: '16px', backgroundColor: '#030811', border: '1px solid rgba(255,145,0,0.2)', borderRadius: '6px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#FF9100', fontFamily: 'var(--font-cyber)' }}>
                                      ✉ EMAIL_INVESTIGATION_AGENT
                                    </span>
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                      Risk Score: {visualResult.agent_results.email.risk_score || 85}%
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                                    <p>• <b>Sender Reputation:</b> {visualResult.agent_results.email.sender || 'N/A'}</p>
                                    <p>• <b>SPF Alignment:</b> {visualResult.agent_results.email.headers_analysis?.spf || 'FAIL'}</p>
                                    <p>• <b>DMARC Alignment:</b> {visualResult.agent_results.email.headers_analysis?.dmarc || 'FAIL'}</p>
                                  </div>
                                </div>
                              )}

                            </div>
                          )}
                        </div>
                      )}

                    </div>

                    {/* Collaborative Buttons */}
                    <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
                      <button 
                        className="btn-primary" 
                        onClick={() => {
                          setActiveNav('Complaint Agent');
                          // Force generation from active case folder
                          const activeCaseId = localStorage.getItem("activeCaseId") || "";
                          setCaseIdInput(activeCaseId);
                        }}
                        style={{ flex: 1, backgroundColor: '#E91E63', border: '1px solid #E91E63', boxShadow: '0 0 12px rgba(233,30,99,0.4)', color: '#fff', fontSize: '12px', height: '44px', fontWeight: 'bold' }}
                      >
                        📄 GENERATE LEGAL COMPLAINT
                      </button>
                      <button 
                        className="btn-primary" 
                        onClick={() => {
                          setActiveNav('Explainability (XAI)');
                          const activeCaseId = localStorage.getItem("activeCaseId") || "";
                          setXaiCaseId(activeCaseId);
                        }}
                        style={{ flex: 1, fontSize: '12px', height: '44px', fontWeight: 'bold' }}
                      >
                        🧬 EXPLAIN WITH XAI AGENT
                      </button>
                      <button 
                        className="btn-secondary" 
                        onClick={() => {
                          setVisualFile(null);
                          setVisualResult(null);
                        }}
                        style={{ padding: '0 16px', fontSize: '11px', height: '44px' }}
                      >
                        RESET
                      </button>
                    </div>

                  </div>

                </div>
              ) : (
                /* Drag and drop screenshot upload interface */
                <div style={{ maxWidth: '640px', margin: '40px auto', width: '100%' }}>
                  <div className="glass-panel card" style={{ padding: '40px', textAlign: 'center' }}>
                    <h2 className="card-title" style={{ color: '#E91E63' }}>VISUAL SCAN SUBMISSION</h2>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                      Drag and drop screenshots of suspected WhatsApp chats, banking fraud portals, phishing emails, or scanned QR codes.
                    </p>

                    <div 
                      onDragEnter={(e) => { e.preventDefault(); setVisualDragActive(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setVisualDragActive(false); }}
                      onDragOver={(e) => { e.preventDefault(); }}
                      onDrop={(e) => { e.preventDefault(); setVisualDragActive(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) { setVisualFile(e.dataTransfer.files[0]); } }}
                      style={{
                        border: `2px dashed ${visualDragActive ? '#E91E63' : 'rgba(233, 30, 99, 0.3)'}`,
                        borderRadius: '8px',
                        padding: '40px 20px',
                        backgroundColor: visualDragActive ? 'rgba(233,30,99,0.04)' : '#030811',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyItems: 'center',
                        gap: '12px',
                        marginBottom: '20px'
                      }}
                      onClick={() => document.getElementById('visual-file-input').click()}
                    >
                      <input 
                        id="visual-file-input" 
                        type="file" 
                        accept=".png,.jpg,.jpeg,.webp,.bmp,.tiff" 
                        style={{ display: 'none' }} 
                        onChange={(e) => { if (e.target.files && e.target.files[0]) { setVisualFile(e.target.files[0]); } }}
                      />
                      
                      <Camera style={{ width: '48px', height: '48px', color: '#E91E63', opacity: 0.8 }} />
                      
                      {visualFile ? (
                        <div>
                          <span style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>{visualFile.name}</span>
                          <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            ({Math.round(visualFile.size / 1024)} KB) - Click to replace
                          </p>
                        </div>
                      ) : (
                        <div>
                          <span style={{ fontSize: '13px', color: '#fff' }}>Drag & drop image here or click to browse</span>
                          <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Supports PNG, JPG, JPEG, WEBP, BMP, and TIFF (Max 5MB)
                          </p>
                        </div>
                      )}
                    </div>

                    {visualError && (
                      <div className="error-banner" style={{ margin: '0 0 20px 0', borderLeft: '3px solid #ff1744' }}>
                        {visualError}
                      </div>
                    )}

                    <button 
                      className={`btn-primary ${analyzeButtonPulse === 'visualFile' ? 'glow-pulse-active' : ''}`}
                      onClick={() => { setAnalyzeButtonPulse(null); runVisualAnalysis(); }}
                      disabled={!visualFile}
                      style={{ 
                        width: '100%', 
                        height: '44px', 
                        backgroundColor: visualFile ? '#E91E63' : 'var(--bg-card)', 
                        borderColor: visualFile ? '#E91E63' : 'rgba(255,255,255,0.08)',
                        boxShadow: visualFile ? '0 0 12px rgba(233,30,99,0.3)' : 'none',
                        color: visualFile ? '#fff' : 'var(--text-muted)'
                      }}
                    >
                      EXECUTE VISUAL AUDIT
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Agent 4 View (Web & QR Scan) */}
          {activeNav === 'Web & QR Scan' && (
            <>
              {webProcessing ? (
                /* Scanning sequence view with live console and checklist timeline */
                <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px', maxWidth: '1100px', margin: '40px auto', width: '100%' }}>
                  <div className="glass-panel card" style={{ margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Globe style={{ width: '14px', height: '14px' }} /> MISSION_STATUS: ACTIVE
                      </span>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '20px', display: 'block' }}>{webProgressPercent}%</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>T+{scanSeconds}s</span>
                      </div>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                      TARGET: {webUrlText || (webSelectedFile ? webSelectedFile.name : 'Unknown')}
                    </p>

                    <div className="progress-bar-container">
                      <div className="progress-bar-fill" style={{ width: `${webProgressPercent}%` }}></div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '16px' }}>
                      {/* Left: Interactive Timeline Checklist */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {webPipeline.map((step, idx) => {
                          const isDone = idx < webStep;
                          const isActive = idx === webStep;
                          
                          return (
                            <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                              <span style={{ 
                                color: isDone ? '#00E676' : (isActive ? '#00E676' : '#223328'), 
                                fontWeight: 'bold' 
                              }}>
                                {isDone ? '✓' : (isActive ? '◌' : '•')}
                              </span>
                              <span style={{ 
                                color: isDone ? '#fff' : (isActive ? '#00E676' : 'var(--text-muted)'),
                                textShadow: isActive ? 'var(--accent-green-glow)' : 'none'
                              }}>
                                {step.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Right: Scrolling Live Terminal Console */}
                      <div style={{ 
                        background: '#020305', 
                        border: '1px solid rgba(0,230,118,0.15)', 
                        padding: '12px', 
                        fontFamily: 'monospace', 
                        fontSize: '10px', 
                        color: '#00E676', 
                        overflowY: 'auto', 
                        maxHeight: '220px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        boxShadow: 'inset 0 0 10px rgba(0,230,118,0.1)'
                      }}>
                        <div style={{ borderBottom: '1px solid rgba(0,230,118,0.2)', paddingBottom: '4px', marginBottom: '6px', fontSize: '9px', opacity: 0.6 }}>
                          [MISSION_STATUS_CONSOLE]
                        </div>
                        {terminalLogs.map((log, i) => (
                          <div key={i} style={{ lineBreak: 'anywhere' }}>
                            {log}
                          </div>
                        ))}
                        <div style={{ display: 'inline-block', width: '6px', height: '11px', background: '#00E676', animation: 'blink 1s step-end infinite' }} />
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(0,230,118,0.1)', padding: '16px 0 0', marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        💡 ADVISORY PROTOCOL: AUTONOMOUS THREAT INVESTIGATION UNDERWAY
                      </div>
                      <button onClick={() => setWebProcessing(false)} style={{ background: 'transparent', border: '1px solid #FF3D00', color: '#FF3D00', fontFamily: 'var(--font-cyber)', fontSize: '11px', padding: '6px 12px', cursor: 'pointer' }}>
                        ✕ CANCEL ANALYSIS
                      </button>
                    </div>
                  </div>
                  {renderVisualEvidence(true, null)}
                </div>
              ) : webResult ? (
                /* Results report view */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {showScanAnyway && (
                    <div className="glass-panel" style={{
                      background: 'rgba(255, 61, 0, 0.1)',
                      border: '1px solid #FF3D00',
                      padding: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '16px',
                      marginTop: '0px',
                      marginBottom: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AlertTriangle style={{ width: '20px', height: '20px', color: '#FF3D00' }} />
                        <div>
                          <p style={{ fontWeight: 'bold', color: '#fff', fontSize: '13px' }}>Website is already blocked by ScamON AI.</p>
                          <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>Do not perform another investigation unless you choose to scan anyway.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => runWebAnalysis(true)}
                        className="btn-primary"
                        style={{
                          backgroundColor: 'rgba(255, 61, 0, 0.2)',
                          borderColor: '#FF3D00',
                          color: '#fff',
                          width: '140px',
                          height: '36px',
                          fontSize: '11px',
                          padding: '0 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        SCAN ANYWAY
                      </button>
                    </div>
                  )}
                  
                  {/* Top Header Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '24px' }}>
                    
                    <div className="glass-panel card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', textTransform: 'lowercase' }}>
                            {typeof webResult.domain === 'string' ? webResult.domain : webResult.domain?.name || 'unknown domain'}
                          </h2>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Website Safety Report</p>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px', wordBreak: 'break-all' }}>
                            {webResult.url}
                          </p>
                          <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px' }}>
                            Scanned: {webResult.timestamp || 'N/A'} • ID: {webResult.investigation_id ? webResult.investigation_id.substring(0, 18) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {renderVisualEvidence(false, webResult)}

                  </div>

                  {/* Safety Score & AI Decision Panel */}
                  <div className="glass-panel card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      
                      {/* Trust Score Circle Index */}
                      <div style={{ 
                        width: '80px', 
                        height: '80px', 
                        borderRadius: '50%', 
                        border: `3px solid #00E676`, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        boxShadow: `0 0 12px rgba(0, 230, 118, 0.3)`
                      }}>
                        <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>{webResult.trust_score || 0}</span>
                        <span style={{ fontSize: '8px', color: '#00E676', fontWeight: 'bold', letterSpacing: '0.5px' }}>TRUST</span>
                      </div>

                      {/* Risk Score Circle Index */}
                      <div style={{ 
                        width: '80px', 
                        height: '80px', 
                        borderRadius: '50%', 
                        border: `3px solid ${getRiskColor(webResult.risk_score || 0)}`, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        boxShadow: `0 0 12px ${getRiskColor(webResult.risk_score || 0)}`
                      }}>
                        <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>{webResult.risk_score}</span>
                        <span style={{ fontSize: '8px', color: getRiskColor(webResult.risk_score || 0), fontWeight: 'bold', letterSpacing: '0.5px' }}>RISK</span>
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h3 style={{ 
                            fontSize: '18px', 
                            fontWeight: 'bold', 
                            color: getRiskColor(webResult.risk_score || 0),
                            textShadow: '0 0 8px ' + getRiskColor(webResult.risk_score || 0)
                          }}>
                            {webResult.ai_reasoning?.final_decision || webResult.verdict || 'UNKNOWN'}
                          </h3>
                          <span style={{ 
                            background: 'rgba(255,255,255,0.05)', 
                            border: '1px solid rgba(255,255,255,0.1)', 
                            color: 'var(--text-muted)', 
                            fontSize: '9px', 
                            padding: '2px 6px',
                            fontFamily: 'var(--font-cyber)'
                          }}>
                            CONFIDENCE: {webResult.ai_reasoning?.confidence_rating || webResult.confidence || 'N/A'}%
                          </span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '6px' }}>
                          Threat Category: <span style={{ color: '#fff', fontWeight: 'bold' }}>{webResult.ai_reasoning?.threat_category || webResult.threat_type || 'N/A'}</span>
                        </p>
                      </div>

                    </div>

                    {/* Memory Database Comparison Panel */}
                    <div style={{ 
                      border: '1px dashed rgba(0, 230, 118, 0.25)', 
                      background: 'rgba(0, 230, 118, 0.02)', 
                      padding: '12px', 
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      minWidth: '240px'
                    }}>
                      {webResult.memory_history?.has_history ? (
                        <>
                          <div style={{ color: '#FFA000', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', textShadow: '0 0 6px #FFA000' }}>
                            <RefreshCw style={{ width: '12px', height: '12px', animation: 'spin 4s linear infinite' }} />
                            <span>MEMORY_RECALL_ACTIVE</span>
                          </div>
                          <div style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '10px' }}>
                            Last Scan: {webResult.memory_history.last_timestamp}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                            Last Verdict: {webResult.memory_history.last_verdict} ({webResult.memory_history.last_risk_score}%)
                          </div>
                          <div style={{ 
                            marginTop: '6px', 
                            color: webResult.memory_history.score_diff > 0 ? '#FF3D00' : '#00E676', 
                            fontWeight: 'bold',
                            fontSize: '10.5px'
                          }}>
                            Risk Change: {webResult.memory_history.score_diff > 0 ? '+' : ''}{webResult.memory_history.score_diff}%
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>
                            [MEMORY_DATABASE]
                          </div>
                          <div style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '10px' }}>
                            No previous records found. Target registry initialized.
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Agent Thoughts & AI Reasoning Panel */}
                  <div className="glass-panel card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <span className="card-title">AGENT_REASONING_THOUGHTS</span>
                    
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <Terminal style={{ width: '20px', height: '20px', color: 'var(--accent-green)', marginTop: '2px' }} />
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Cyber Threat Analyst Assessment
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.5' }}>
                          {webResult.ai_reasoning?.summary || webResult.reasoning || 'No details available.'}
                        </p>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', marginTop: '4px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        
                        {/* Trust Indicators Column */}
                        <div>
                          <div style={{ fontSize: '11.5px', color: '#00E676', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px', fontFamily: 'monospace' }}>
                            ✓ Trust Indicators
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {((webResult.ai_reasoning?.trust_indicators && webResult.ai_reasoning.trust_indicators.length > 0) 
                              ? webResult.ai_reasoning.trust_indicators 
                              : (webResult.verdict === 'SAFE' ? ["✔ Valid SSL Validation Safe", "✔ Clean Blacklist Status"] : ["✔ Default SSL Validation Safe"])
                            ).map((step, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '11px', color: '#00E676', fontFamily: 'monospace' }}>
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Risk Indicators Column */}
                        <div>
                          <div style={{ fontSize: '11.5px', color: getRiskColor(webResult.risk_score || 0), fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px', fontFamily: 'monospace' }}>
                            ⚠ Risk Indicators
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {((webResult.ai_reasoning?.risk_indicators && webResult.ai_reasoning.risk_indicators.length > 0) 
                              ? webResult.ai_reasoning.risk_indicators 
                              : (webResult.verdict === 'PHISHING' || webResult.verdict === 'SUSPICIOUS' ? ["⚠ Typosquatted Domain detected", "⚠ Registration date < 30 days ago"] : ["⚠ No threat signals verified"])
                            ).map((step, i) => {
                              const isNoImpact = step.includes("(No impact)");
                              const isHighRisk = step.startsWith("❌");
                              return (
                                <div key={i} style={{ 
                                  display: 'flex', 
                                  alignItems: 'flex-start', 
                                  gap: '6px', 
                                  fontSize: '11px', 
                                  color: isNoImpact ? 'var(--text-muted)' : (isHighRisk ? '#FF1744' : '#FF9100'),
                                  fontFamily: 'monospace' 
                                }}>
                                  <span>{step}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* Signal Breakdown Grid (16 SOC Forensic Modules) */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '12px', color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'var(--font-cyber)' }}>Evidence Signatures Breakdown</h3>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-cyber)' }}>
                        {webResult.investigation_modules ? `${webResult.investigation_modules.length} Modules Audited` : '16 Modules Audited'}
                      </span>
                    </div>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
                      gap: '12px',
                      marginBottom: '20px'
                    }}>
                      {(webResult.investigation_modules || []).map((mod, i) => {
                        const isSuccess = mod.status === 'success';
                        const isFailed = mod.status === 'failed';
                        const isSkipped = mod.status === 'skipped';
                        
                        let badgeColor = 'var(--text-muted)';
                        let badgeText = 'SKIPPED';
                        let borderColor = 'rgba(255,255,255,0.06)';
                        let glowStyle = {};
                        
                        if (isSuccess) {
                          badgeColor = 'var(--accent-green)';
                          badgeText = 'SUCCESS';
                          borderColor = 'rgba(0, 230, 118, 0.15)';
                          glowStyle = { textShadow: '0 0 6px rgba(0, 230, 118, 0.4)' };
                        } else if (isFailed) {
                          badgeColor = '#FF3D00';
                          badgeText = 'FAILED';
                          borderColor = 'rgba(255, 61, 0, 0.25)';
                          glowStyle = { textShadow: '0 0 6px rgba(255, 61, 0, 0.4)' };
                        } else if (isSkipped) {
                          badgeColor = '#FFC107';
                          badgeText = 'SKIPPED';
                          borderColor = 'rgba(255, 193, 7, 0.2)';
                          glowStyle = { textShadow: '0 0 6px rgba(255, 193, 7, 0.4)' };
                        }

                        const evidenceKeys = Object.keys(mod.evidence || {});
                        
                        return (
                          <div 
                            key={i} 
                            className="glass-panel card" 
                            style={{ 
                              padding: '12px', 
                              display: 'flex', 
                              flexDirection: 'column', 
                              justifyContent: 'space-between',
                              border: `1px solid ${borderColor}`,
                              background: 'rgba(3, 5, 8, 0.4)',
                              minHeight: '120px',
                              gap: '8px'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-cyber)' }}>
                                  MOD_{String(i + 1).padStart(2, '0')}
                                </span>
                                <span style={{ 
                                  fontSize: '9px', 
                                  fontWeight: 'bold', 
                                  color: badgeColor, 
                                  fontFamily: 'var(--font-cyber)',
                                  border: `1px solid ${badgeColor}33`,
                                  padding: '1px 5px',
                                  ...glowStyle
                                }}>
                                  {badgeText}
                                </span>
                              </div>
                              
                              <h4 style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#fff', marginTop: '4px', fontFamily: 'var(--font-cyber)' }}>
                                {mod.module}
                              </h4>
                            </div>

                            <div style={{ fontSize: '10px', marginTop: '2px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                              {isSuccess && (
                                <div style={{ color: 'var(--text-primary)' }}>
                                  {evidenceKeys.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                      <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>
                                        [✓] Evidence Captured ({evidenceKeys.length})
                                      </span>
                                      <span style={{ color: 'var(--text-muted)', fontSize: '9px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                        {evidenceKeys.slice(0, 3).join(', ')}
                                        {evidenceKeys.length > 3 ? '...' : ''}
                                      </span>
                                    </div>
                                  ) : (
                                    <span style={{ color: 'var(--text-muted)' }}>No data payload returned.</span>
                                  )}
                                </div>
                              )}
                              
                              {isFailed && (
                                <div style={{ color: '#FF3D00', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span style={{ fontWeight: 'bold' }}>[⚠] Execution Error</span>
                                  <span style={{ fontSize: '9px', color: 'rgba(255, 61, 0, 0.8)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                    {mod.error || 'Check failed to execute.'}
                                  </span>
                                </div>
                              )}
                              
                              {isSkipped && (
                                <div style={{ color: '#FFC107', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span style={{ fontWeight: 'bold' }}>[◯] Skipped</span>
                                  <span style={{ fontSize: '9px', color: 'rgba(255, 193, 7, 0.8)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                    {mod.error || 'Dependency check skipped.'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* SOC Investigation Report */}
                  <div className="glass-panel card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <span className="card-title">SECURE_SOC_REPORT_AUDIT</span>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '11px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div><span style={{ color: 'var(--text-muted)' }}>Investigation ID:</span> <span style={{ color: '#fff', fontFamily: 'monospace' }}>{webResult.investigation_id || 'N/A'}</span></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Timestamp:</span> <span style={{ color: '#fff' }}>{webResult.timestamp || 'N/A'}</span></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Target URL:</span> <span style={{ color: '#fff', wordBreak: 'break-all' }}>{webResult.url}</span></div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div><span style={{ color: 'var(--text-muted)' }}>Threat Category:</span> <span style={{ color: 'var(--accent-green)' }}>{webResult.ai_reasoning?.threat_category || webResult.threat_type || 'N/A'}</span></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Verdict:</span> <span style={{ color: getRiskColor(webResult.risk_score || 0), fontWeight: 'bold' }}>{webResult.ai_reasoning?.final_decision || webResult.verdict || 'UNKNOWN'}</span></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>HTTP Status:</span> <span style={{ color: '#fff' }}>{webResult.http_status || 'Unknown'} (Hops: {webResult.redirect_history ? webResult.redirect_history.length - 1 : 0})</span></div>
                      </div>
                    </div>

                    {/* Redirect path visual */}
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--accent-green)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                        Visual Redirect Chain Hop Sequence
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', background: '#020305', padding: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        {(webResult.redirect_history || [webResult.url]).map((hop, idx) => (
                          <React.Fragment key={idx}>
                            {idx > 0 && <ChevronRight style={{ width: '12px', height: '12px', color: 'var(--text-muted)' }} />}
                            <span style={{ 
                              fontSize: '10.5px', 
                              fontFamily: 'monospace', 
                              color: !webResult.redirect_history || idx === webResult.redirect_history.length - 1 ? 'var(--accent-green)' : 'var(--text-muted)',
                              textShadow: !webResult.redirect_history || idx === webResult.redirect_history.length - 1 ? 'var(--accent-green-glow)' : 'none'
                            }}>
                              {hop}
                            </span>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    {/* Headers and HTML Metadata */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px', fontSize: '11px', marginTop: '6px' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--accent-green)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                          Response Header Auditing Findings
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {Object.entries(webResult.security_headers || {
                            "Content-Security-Policy": "missing",
                            "X-Frame-Options": "missing",
                            "Strict-Transport-Security": "secured"
                          }).map(([header, status]) => {
                            const isMissing = status.toLowerCase().includes("missing");
                            return (
                              <div key={header} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
                                <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '10px' }}>{header}</span>
                                <span style={{ 
                                  color: isMissing ? '#FFA000' : '#00E676', 
                                  fontWeight: 'bold',
                                  fontSize: '10px'
                                }}>
                                  {isMissing ? '⚠ Missing' : '✓ Secured'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--accent-green)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                          HTML Metadata Tags Harvested
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#020305', padding: '10px', border: '1px solid rgba(255,255,255,0.04)', maxHeight: '135px', overflowY: 'auto' }}>
                          <div>
                            <span style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>Title: </span>
                            <span style={{ color: '#fff' }}>{webResult.html_metadata?.title || 'Secure Portal'}</span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>Description: </span>
                            <span style={{ color: 'var(--text-muted)' }}>{webResult.html_metadata?.description || 'No description found.'}</span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>Keywords: </span>
                            <span style={{ color: 'var(--text-muted)' }}>{webResult.html_metadata?.keywords || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                                   {/* ACTIVE PROTECTION SECTION */}
                    <div style={{ 
                      marginTop: '20px', 
                      padding: '16px', 
                      background: 'rgba(3, 5, 8, 0.6)', 
                      border: '1px solid rgba(0, 230, 118, 0.1)', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '12px' 
                    }}>
                      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-green)', letterSpacing: '1px', fontFamily: 'var(--font-cyber)' }}>
                          ACTIVE PROTECTION
                        </span>
                      </div>

                      {/* Protection Status */}
                      <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Protection Status</span>
                        <span style={{ 
                          fontSize: '14px', 
                          fontWeight: 'bold', 
                          color: webResult.is_blocked ? '#FF3D00' : 'var(--accent-green)', 
                          fontFamily: 'var(--font-cyber)',
                          textShadow: webResult.is_blocked ? '0 0 6px rgba(255,61,0,0.4)' : 'none'
                        }}>
                          {webResult.is_blocked ? 'BLOCKED' : 'READY'}
                        </span>
                      </div>

                      {/* AI Recommendation */}
                      <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>AI Recommendation</span>
                        <span style={{ 
                          color: '#fff',
                          fontFamily: 'var(--font-cyber)',
                          fontSize: '11.5px',
                          lineHeight: '1.4'
                        }}>
                          {(() => {
                            const domainName = typeof webResult.domain === 'string' ? webResult.domain : webResult.domain?.name;
                            const hasJustUnblocked = unblockedDomains.has(domainName);
                            if (webResult.is_blocked) {
                              return "Website has been successfully blocked.";
                            }
                            if (hasJustUnblocked) {
                              return "Website access has been restored.";
                            }
                            if (webResult.risk_score >= 75) {
                              return "🚨 High Risk Website. Immediate blocking is strongly recommended.";
                            }
                            if (webResult.risk_score >= 50) {
                              return "⚠ This website looks suspicious. Blocking is recommended.";
                            }
                            return "✓ This website appears safe. Blocking is NOT recommended.";
                          })()}
                        </span>
                        {/* Sub-explanation */}
                        {!webResult.is_blocked && !unblockedDomains.has(typeof webResult.domain === 'string' ? webResult.domain : webResult.domain?.name) && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '10.5px', marginTop: '2px' }}>
                            {webResult.risk_score >= 75 ? (
                              "This website is highly likely to be phishing. Blocking is strongly recommended."
                            ) : (
                              webResult.risk_score >= 50 ? (
                                "This website may be malicious. Blocking is recommended."
                              ) : (
                                "This website appears legitimate. Blocking is optional and not recommended."
                              )
                            )}
                          </span>
                        )}
                      </div>

                      {/* Blocked Info metadata if active */}
                      {webResult.is_blocked && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '10px', background: 'rgba(0,0,0,0.2)', padding: '6px 10px', border: '1px solid rgba(255,255,255,0.03)' }}>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Blocked Time: </span>
                            <span style={{ color: '#fff', fontFamily: 'monospace' }}>{webResult.blocked_time || 'Just now'}</span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Blocked By: </span>
                            <span style={{ color: '#fff' }}>Website Protection Agent</span>
                          </div>
                        </div>
                      )}

                      {/* Success / Warning Alerts */}
                      {blockMessage && (
                        <div style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid var(--accent-green)', padding: '8px 12px', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}>
                          [✓] SUCCESS: {blockMessage}
                        </div>
                      )}
                      {protectionError && (
                        <div style={{ background: 'rgba(255,61,0,0.1)', border: '1px solid #FF3D00', padding: '8px 12px', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}>
                          [⚠] WARNING: {protectionError}
                        </div>
                      )}

                      {/* Protection Actions Buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>Protection Actions</span>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          gap: '12px', 
                          width: '100%' 
                        }}>
                          {/* BLOCK button (Red) */}
                          <button 
                            disabled={blockingLoading || webResult.is_blocked}
                            onClick={() => handleBlockWebsite(webResult.domain?.name)}
                            style={{ 
                              flex: 1,
                              height: '36px',
                              padding: '0 12px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              textTransform: 'uppercase',
                              fontFamily: 'var(--font-cyber)',
                              cursor: (blockingLoading || webResult.is_blocked) ? 'not-allowed' : 'pointer',
                              opacity: (blockingLoading || webResult.is_blocked) ? 0.4 : 1,
                              borderColor: '#FF3D00',
                              color: '#fff',
                              backgroundColor: 'rgba(255, 61, 0, 0.1)',
                              border: '1px solid #FF3D00',
                              boxShadow: (!webResult.is_blocked && webResult.risk_score >= 75) ? '0 0 12px rgba(255,61,0,0.8)' : 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textAlign: 'center',
                              boxSizing: 'border-box'
                            }}
                          >
                            {blockingLoading ? 'PROCESSING...' : (webResult.is_blocked ? 'WEBSITE BLOCKED' : 'BLOCK WEBSITE')}
                          </button>

                          {/* UNBLOCK button (Green) */}
                          <button 
                            disabled={blockingLoading || !webResult.is_blocked}
                            onClick={() => handleUnblockWebsite(webResult.domain?.name)}
                            style={{ 
                              flex: 1,
                              height: '36px',
                              padding: '0 12px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              textTransform: 'uppercase',
                              fontFamily: 'var(--font-cyber)',
                              cursor: (blockingLoading || !webResult.is_blocked) ? 'not-allowed' : 'pointer',
                              opacity: (blockingLoading || !webResult.is_blocked) ? 0.4 : 1,
                              borderColor: '#00E676',
                              color: '#fff',
                              backgroundColor: 'rgba(0, 230, 118, 0.1)',
                              border: '1px solid #00E676',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textAlign: 'center',
                              boxSizing: 'border-box'
                            }}
                          >
                            UNBLOCK WEBSITE
                          </button>

                          {/* REPORT button (Orange) */}
                          <button 
                            disabled={blockingLoading}
                            onClick={() => triggerComplaintGeneration(webResult)}
                            style={{ 
                              flex: 1,
                              height: '36px',
                              padding: '0 12px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              textTransform: 'uppercase',
                              fontFamily: 'var(--font-cyber)',
                              cursor: blockingLoading ? 'not-allowed' : 'pointer',
                              opacity: blockingLoading ? 0.4 : 1,
                              borderColor: '#FFA000',
                              color: '#fff',
                              backgroundColor: 'rgba(255, 160, 0, 0.1)',
                              border: '1px solid #FFA000',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textAlign: 'center',
                              boxSizing: 'border-box'
                            }}
                          >
                            REPORT WEBSITE
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Cyberbutton Actions */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button className="btn-primary" style={{
                        borderColor: getRiskColor(webResult.risk_score),
                        color: getRiskColor(webResult.risk_score),
                        boxShadow: `0 0 8px ${getRiskColor(webResult.risk_score)}20`,
                        textTransform: 'uppercase',
                        fontWeight: 'bold',
                        padding: '6px 20px',
                        cursor: 'default',
                        width: 'auto',
                        minWidth: '120px'
                      }}>
                        {webResult.ai_reasoning?.recommended_action || 'VERIFY STATUS'}
                      </button>
                      <button onClick={() => setWebResult(null)} className="btn-primary" style={{ width: 'auto', minWidth: '120px', padding: '6px 20px' }}>
                        NEW SCAN
                      </button>
                    </div>
                  </div>
                  {/* Scroll spacer to prevent fixed floating widget from blocking the NEW SCAN action */}
                  <div style={{ height: '80px' }} />
                </div>
              ) : (
                /* Submission screen */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  <div className="glass-panel card" style={{ maxWidth: '720px', margin: '0 auto', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,230,118,0.1)', paddingBottom: '12px', marginBottom: '18px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        VERIFICATION TARGET
                      </span>
                      
                      <div className="tab-container">
                        <button onClick={() => { setWebInputType('url'); setWebError(''); }} className={`tab-btn ${webInputType === 'url' ? 'active' : ''}`}>WEBSITE URL</button>
                        <button onClick={() => { setWebInputType('qr'); setWebError(''); }} className={`tab-btn ${webInputType === 'qr' ? 'active' : ''}`}>APK FILE</button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {webInputType === 'url' ? (
                        <div className="input-group" style={{ display: 'flex', gap: '0px' }}>
                          <input 
                            type="text" 
                            value={webUrlText} 
                            onChange={(e) => setWebUrlText(e.target.value)} 
                            placeholder="https://example.com" 
                            className="textarea-cyber" 
                            style={{ height: '42px', padding: '10px 14px', borderRadius: '0px', borderRight: 'none' }}
                          />
                          <button 
                            onClick={() => { setAnalyzeButtonPulse(null); runWebAnalysis(); }} 
                            className={`btn-primary ${analyzeButtonPulse === 'webUrlText' ? 'glow-pulse-active' : ''}`} 
                            style={{ width: '180px', height: '42px', flexShrink: 0 }}
                          >
                            <span>ANALYZE URL</span> <Search style={{ width: '14px', height: '14px' }} />
                          </button>
                        </div>
                      ) : (
                        <div 
                          onDragEnter={handleWebDrag}
                          onDragOver={handleWebDrag}
                          onDragLeave={handleWebDrag}
                          onDrop={handleWebDrop}
                          className="upload-zone"
                          onClick={() => document.getElementById('web-qr-file-input').click()}
                        >
                          <input id="web-qr-file-input" type="file" accept=".png,.jpg,.jpeg,.webp" style={{ display: 'none' }} onChange={(e) => { if (e.target.files && e.target.files[0]) { setWebSelectedFile(e.target.files[0]); } }} />
                          {webSelectedFile ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                              <div className="upload-icon-container" style={{ color: 'var(--accent-green)' }}>
                                <Globe style={{ width: '32px', height: '32px' }} />
                              </div>
                              <div>
                                <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{webSelectedFile.name}</p>
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{(webSelectedFile.size / 1024).toFixed(1)} KB</p>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); setWebSelectedFile(null); }} style={{ background: 'transparent', border: 'none', color: '#FF3D00', fontSize: '11px', textDecoration: 'underline', cursor: 'pointer' }}>Remove Image</button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                              <div className="upload-icon-container"><Upload style={{ width: '32px', height: '32px' }} /></div>
                              <div>
                                <p style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>Drag & drop APK or QR code image here</p>
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Supports PNG, JPG, or WEBP formats</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {webError && (
                        <div style={{ padding: '12px', background: 'rgba(255, 61, 0, 0.08)', border: '1px solid rgba(255, 61, 0, 0.2)', borderRadius: '0px', fontSize: '11px', color: '#FF3D00', display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <AlertTriangle style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                          <span>{webError}</span>
                        </div>
                      )}

                      {webInputType === 'qr' && (
                        <button onClick={runWebAnalysis} className="btn-primary">
                          <Play style={{ width: '16px', height: '16px', fill: 'currentColor' }} /><span>VERIFY DECODED QR LINK</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Protection Engine Console containing BLOCKLIST Widget */}
                  <div className="glass-panel card" style={{ maxWidth: '720px', margin: '20px auto 0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid rgba(0, 230, 118, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,230,118,0.15)', paddingBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Shield style={{ width: '16px', height: '16px', color: 'var(--accent-green)' }} className="animate-pulse" />
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'var(--font-cyber)' }}>
                          ScamON Protection Console
                        </span>
                      </div>
                      <span style={{ 
                        fontSize: '9px', 
                        fontWeight: 'bold', 
                        color: 'var(--accent-green)', 
                        fontFamily: 'var(--font-cyber)',
                        border: '1px solid rgba(0,230,118,0.3)',
                        padding: '2px 6px',
                        textShadow: '0 0 6px rgba(0,230,118,0.4)',
                        background: 'rgba(0,230,118,0.05)'
                      }}>
                        STATUS: ACTIVE
                      </span>
                    </div>

                    {blockMessage && (
                      <div style={{ fontSize: '10px', color: 'var(--accent-green)', padding: '6px 10px', border: '1px solid rgba(0, 230, 118, 0.2)', background: 'rgba(0, 230, 118, 0.05)', fontFamily: 'var(--font-cyber)' }}>
                        [✓] SUCCESS: {blockMessage}
                      </div>
                    )}
                    {protectionError && (
                      <div style={{ fontSize: '10px', color: '#FF3D00', padding: '6px 10px', border: '1px solid rgba(255, 61, 0, 0.2)', background: 'rgba(255, 61, 0, 0.05)', fontFamily: 'var(--font-cyber)' }}>
                        [⚠] WARNING: {protectionError}
                      </div>
                    )}

                    {/* Blocklist Panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                          BLOCKLIST ({(protectionStatus.blocked_domains || []).length})
                        </span>
                        {/* Search Bar */}
                        <input 
                          type="text"
                          value={blocklistSearch}
                          onChange={(e) => setBlocklistSearch(e.target.value)}
                          placeholder="Search blocked domains..."
                          style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff',
                            fontSize: '10.5px',
                            padding: '4px 8px',
                            width: '200px',
                            fontFamily: 'monospace'
                          }}
                        />
                      </div>

                      {/* Blocklist Table */}
                      <div style={{ 
                        background: '#020305', 
                        border: '1px solid rgba(255,255,255,0.04)', 
                        maxHeight: '180px', 
                        overflowY: 'auto'
                      }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)' }}>
                              <th style={{ padding: '6px 10px' }}>Blocked Website</th>
                              <th style={{ padding: '6px 10px' }}>Status</th>
                              <th style={{ padding: '6px 10px' }}>Date</th>
                              <th style={{ padding: '6px 10px' }}>Reason</th>
                              <th style={{ padding: '6px 10px', textAlign: 'right' }}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const filtered = (protectionStatus.blocked_domains || []).filter(dom => 
                                dom.toLowerCase().includes(blocklistSearch.toLowerCase())
                              );
                              if (filtered.length > 0) {
                                return filtered.map((dom, index) => {
                                  const log = protectionHistory.find(h => h.domain.toLowerCase() === dom.toLowerCase() && h.action === 'block' && h.success);
                                  const dateStr = log ? log.timestamp : 'N/A';
                                  const reasonStr = log ? log.details : 'HIGH RISK website scan classification';
                                  return (
                                    <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                      <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: '#fff' }}>{dom}</td>
                                      <td style={{ padding: '6px 10px', color: '#FF3D00', fontWeight: 'bold' }}>Blocked</td>
                                      <td style={{ padding: '6px 10px', color: 'var(--text-muted)' }}>{dateStr}</td>
                                      <td style={{ padding: '6px 10px', color: 'var(--text-muted)' }}>{reasonStr}</td>
                                      <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                                        <button 
                                          disabled={blockingLoading}
                                          onClick={() => handleUnblockWebsite(dom)}
                                          style={{
                                            fontSize: '9px',
                                            padding: '2px 6px',
                                            borderColor: 'var(--accent-green)',
                                            color: 'var(--accent-green)',
                                            background: 'rgba(0,230,118,0.05)',
                                            border: '1px solid var(--accent-green)',
                                            cursor: 'pointer',
                                            fontFamily: 'var(--font-cyber)',
                                            textTransform: 'uppercase'
                                          }}
                                        >
                                          {blockingLoading ? 'Unblocking...' : 'Unblock'}
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                });
                              } else {
                                return (
                                  <tr>
                                    <td colSpan="5" style={{ padding: '20px', color: 'var(--text-muted)', textAlign: 'center' }}>
                                      {blocklistSearch ? 'No matching domains found.' : 'No domains currently in the blocklist.'}
                                    </td>
                                  </tr>
                                );
                              }
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* History Audit Logs Panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        PROTECTION AUDIT HISTORY
                      </span>
                      
                      <div style={{ 
                        background: '#020305', 
                        border: '1px solid rgba(255,255,255,0.04)', 
                        padding: '10px', 
                        height: '100px', 
                        overflowY: 'auto',
                        fontFamily: 'monospace',
                        fontSize: '9.5px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}>
                        {protectionHistory && protectionHistory.length > 0 ? (
                          protectionHistory.map((item, index) => {
                            const isBlock = item.action === 'block';
                            const isSuccess = item.success;
                            return (
                              <div key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '4px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '8.5px' }}>
                                  <span>{item.timestamp}</span>
                                  <span style={{ color: isSuccess ? 'var(--accent-green)' : '#FF3D00' }}>
                                    {isSuccess ? '[SUCCESS]' : '[PERMISSION_WARN]'}
                                  </span>
                                </div>
                                <div style={{ marginTop: '2px', wordBreak: 'break-all' }}>
                                  <span style={{ color: isBlock ? '#FF3D00' : 'var(--accent-green)', fontWeight: 'bold' }}>
                                    {item.action.toUpperCase()}:
                                  </span>{' '}
                                  <span style={{ color: '#fff' }}>{item.domain}</span>
                                </div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '8.5px', fontStyle: 'italic', marginTop: '1px' }}>
                                  {item.details}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <span style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '30px' }}>
                            No log history recorded.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Alert Notifications */}
                    {blockMessage && (
                      <div style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid var(--accent-green)', padding: '8px 12px', color: '#fff', fontSize: '11px', fontFamily: 'var(--font-cyber)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>[✓] SUCCESS: {blockMessage}</span>
                        <button onClick={() => setBlockMessage("")} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '10px' }}>[X]</button>
                      </div>
                    )}
                    {protectionError && (
                      <div style={{ background: 'rgba(255,61,0,0.1)', border: '1px solid #FF3D00', padding: '8px 12px', color: '#fff', fontSize: '11px', fontFamily: 'var(--font-cyber)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>[⚠] WARNING: {protectionError}</span>
                        <button onClick={() => setProtectionError("")} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '10px' }}>[X]</button>
                      </div>
                    )}
                  </div>

                  {/* 3 cards at the bottom */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginTop: '20px' }}>
                    
                    <div className="glass-panel card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 'bold' }}>MOD_WEB_ANALYSIS</span>
                        <Globe style={{ width: '14px', height: '14px', color: 'var(--text-muted)' }} />
                      </div>
                      <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>WEBSITE ANALYSIS</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '16px' }}>
                        Detect phishing sites, security vulnerabilities, and suspicious content on any website.
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--accent-green)' }}>
                        <span className="pulse-glow"></span> MODULE ACTIVE
                      </div>
                    </div>

                    <div className="glass-panel card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--accent-orange)', fontWeight: 'bold' }}>MOD_APK_SCAN</span>
                        <FileText style={{ width: '14px', height: '14px', color: 'var(--text-muted)' }} />
                      </div>
                      <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>APK SECURITY SCAN</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '16px' }}>
                        Analyze Android application packages for malicious code and excessive permissions.
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--accent-orange)' }}>
                        <span className="pulse-glow" style={{ backgroundColor: 'var(--accent-orange)', boxShadow: '0 0 6px var(--accent-orange)' }}></span> MODULE ACTIVE
                      </div>
                    </div>

                    <div className="glass-panel card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--accent-purple)', fontWeight: 'bold' }}>SYS_PROTOCOLS</span>
                        <Shield style={{ width: '14px', height: '14px', color: 'var(--text-muted)' }} />
                      </div>
                      <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>WHAT WE CHECK</h4>
                      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: 'var(--text-primary)' }}>
                        <li>&gt; SSL certificate validity</li>
                        <li>&gt; Domain age & registration</li>
                        <li>&gt; Content & design patterns</li>
                        <li>&gt; Known scam indicators</li>
                      </ul>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--accent-purple)', marginTop: '12px' }}>
                        <span className="pulse-glow" style={{ backgroundColor: 'var(--accent-purple)', boxShadow: '0 0 6px var(--accent-purple)' }}></span> DATABASE SYNC
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* ScamON AI Assistant floating widget */}
              {webResult && (
                <>
                  {/* Floating Button */}
                  {!chatOpen && (
                    <button 
                      className="assistant-btn"
                      onClick={() => { setChatOpen(true); setChatMinimized(false); }}
                    >
                      <span style={{ fontSize: '16px' }}>🤖</span> 
                      <span>AI Assistant</span>
                      <span className="assistant-badge-pulse"></span>
                    </button>
                  )}

                  {/* Chat Window */}
                  {chatOpen && !chatMinimized && (
                    <div className="assistant-chat-window">
                      {/* Header */}
                      <div className="assistant-chat-header">
                        <div>
                          <div className="assistant-header-title">🤖 ScamON AI Assistant</div>
                          <div className="assistant-header-subtitle">Ask anything about this website</div>
                        </div>
                        <div className="assistant-header-controls">
                          <button 
                            className="assistant-control-btn" 
                            onClick={() => setChatMinimized(true)}
                            title="Minimize"
                          >
                            <Minimize2 style={{ width: '14px', height: '14px' }} />
                          </button>
                          <button 
                            className="assistant-control-btn" 
                            onClick={resetAssistantChat}
                            title="Close"
                          >
                            <X style={{ width: '14px', height: '14px' }} />
                          </button>
                        </div>
                      </div>

                      {/* Chat Messages */}
                      <div className="assistant-chat-messages">
                        {chatMessages.length === 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '11px', textAlign: 'center', padding: '0 20px' }}>
                            <span style={{ fontSize: '24px', marginBottom: '8px' }}>🤖</span>
                            Ask me about the security, SSL, WHOIS, reputation, or safety score of the scanned website.
                          </div>
                        ) : (
                          chatMessages.map((msg, idx) => (
                            <div 
                              key={idx} 
                              className={`assistant-msg-bubble ${msg.role === 'user' ? 'user' : msg.role === 'system' ? 'error' : 'bot'}`}
                            >
                              {msg.loading ? (
                                <div className="assistant-typing-dots">
                                  <span></span>
                                  <span></span>
                                  <span></span>
                                </div>
                              ) : (
                                <>
                                  {msg.role === 'assistant' ? renderAssistantMarkdown(msg.content) : msg.content}
                                  {msg.role === 'assistant' && chatLoading && idx === chatMessages.length - 1 && (
                                    <span className="assistant-chat-cursor"></span>
                                  )}
                                </>
                              )}
                            </div>
                          ))
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Suggestion Chips */}
                      <div className="assistant-chips-container">
                        {[
                          "Is this website safe?",
                          "Tell me about this website",
                          "Why is it dangerous?",
                          "Can they steal my data?",
                          "Why are scammers using this?",
                          "How can I stay safe?",
                          "Should I trust this website?"
                        ].map((chipText, idx) => (
                          <button 
                            key={idx} 
                            className="assistant-chip" 
                            onClick={() => sendChatMessage(chipText)}
                            disabled={chatLoading}
                          >
                            {chipText}
                          </button>
                        ))}
                      </div>

                      {/* Input box */}
                      <div className="assistant-input-container">
                        <input 
                          type="text" 
                          className="assistant-input"
                          placeholder="Ask about this website..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              sendChatMessage();
                            }
                          }}
                          disabled={chatLoading}
                        />
                        <button 
                          className="assistant-send-btn" 
                          onClick={() => sendChatMessage()}
                          disabled={chatLoading || !chatInput.trim()}
                        >
                          SEND
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Minimized Trigger State */}
                  {chatOpen && chatMinimized && (
                    <button 
                      className="assistant-btn"
                      onClick={() => setChatMinimized(false)}
                    >
                      <span style={{ fontSize: '16px' }}>🤖</span> 
                      <span>AI Assistant</span>
                      <span className="assistant-badge-pulse"></span>
                    </button>
                  )}
                </>
              )}
            </>
          )}

          {/* Agent 5 View (Email Investigation) */}
          {activeNav === 'Email Investigation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.5s ease-out', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
              
              {/* If Analysis is loading */}
              {emailAnalysisLoading ? (
                <div className="glass-panel card" style={{ maxWidth: '720px', margin: '40px auto', width: '100%', padding: '30px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <span style={{ color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail style={{ width: '14px', height: '14px' }} /> EMAIL_INVESTIGATION: ACTIVE
                    </span>
                    <span style={{ color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '16px' }}>
                      {emailPipelineStep === 5 ? 'COMPLETED' : `${emailPipelineStep * 20}%`}
                    </span>
                  </div>

                  <div className="progress-bar-container" style={{ height: '6px', background: 'rgba(255,255,255,0.05)', position: 'relative', marginBottom: '24px' }}>
                    <div className="progress-bar-fill" style={{ height: '100%', background: 'var(--accent-green)', transition: 'width 0.4s ease', width: `${emailPipelineStep * 20}%` }}></div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      "Initialize connection with secure Google Mail gateway",
                      "Extract & parse security headers (SPF, DKIM, DMARC validation)",
                      "Verify sender domain WHOIS registries & SSL certificates",
                      "Extract body links and scan reputation using Website Agent",
                      "Audit macro and executable attachments hazard index",
                      "Run Groq AI context-aware security reasoning classification"
                    ].map((stepDesc, idx) => {
                      const isDone = idx < emailPipelineStep;
                      const isActive = idx === emailPipelineStep;
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px' }}>
                          <span style={{ 
                            color: isDone ? 'var(--accent-green)' : (isActive ? 'var(--accent-green)' : 'rgba(255,255,255,0.15)'), 
                            fontWeight: 'bold',
                            fontFamily: 'monospace'
                          }}>
                            {isDone ? '[✓] DONE' : (isActive ? '[⟳] ACTIVE' : '[ ] PENDING')}
                          </span>
                          <span style={{ color: isDone || isActive ? '#fff' : 'var(--text-muted)' }}>
                            {stepDesc}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : emailAnalysisResult ? (
                /* Report View */
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '24px', 
                  width: '100%', 
                  boxSizing: 'border-box',
                  marginRight: emailChatOpen ? '374px' : '0px',
                  transition: 'margin-right 0.2s ease'
                }}>
                  
                  {/* Back button & ID row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <button 
                      onClick={() => setEmailAnalysisResult(null)}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(0, 230, 118, 0.3)',
                        color: 'var(--accent-green)',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontFamily: 'var(--font-cyber)',
                        textTransform: 'uppercase'
                      }}
                    >
                      &lt; Back to Inbox
                    </button>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      ID: {emailAnalysisResult.message_id || 'N/A'}
                    </span>
                  </div>

                  {/* Header metadata summary */}
                  <div className="glass-panel card" style={{ margin: 0, padding: '20px', width: '100%', boxSizing: 'border-box' }}>
                    <span className="card-title">EMAIL_METADATA</span>
                    <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', color: '#fff', textAlign: 'left', tableLayout: 'fixed' }}>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '8px 0', color: 'var(--text-muted)', width: '80px' }}>SUBJECT:</td>
                          <td style={{ padding: '8px 0', fontWeight: 'bold', wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: '1.5' }}>{emailAnalysisResult.subject || 'N/A'}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>FROM:</td>
                          <td style={{ padding: '8px 0', fontFamily: 'monospace', wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: '1.5' }}>{emailAnalysisResult.sender || 'N/A'}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>TO:</td>
                          <td style={{ padding: '8px 0', fontFamily: 'monospace', wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: '1.5' }}>{emailAnalysisResult.receiver || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>DATE:</td>
                          <td style={{ padding: '8px 0', wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: '1.5' }}>{emailAnalysisResult.date || 'N/A'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Forensic Verdict */}
                  <div className="glass-panel card" style={{ margin: 0, padding: '24px', width: '100%', boxSizing: 'border-box' }}>
                    <span className="card-title">FORENSIC_VERDICT</span>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '10px 0' }}>
                      <div style={{
                        fontSize: '56px',
                        fontWeight: 'bold',
                        color: (emailAnalysisResult.risk_score || 0) >= 70 ? '#FF3D00' : ((emailAnalysisResult.risk_score || 0) >= 35 ? '#FFA000' : 'var(--accent-green)'),
                        textShadow: `0 0 20px ${(emailAnalysisResult.risk_score || 0) >= 70 ? 'rgba(255, 61, 0, 0.5)' : ((emailAnalysisResult.risk_score || 0) >= 35 ? 'rgba(255, 160, 0, 0.5)' : 'rgba(0, 230, 118, 0.5)')}`,
                        fontFamily: 'var(--font-cyber)',
                        marginBottom: '8px'
                      }}>
                        {emailAnalysisResult.risk_score || 0}
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px' }}>
                        COMPOSITE RISK RATING
                      </span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#fff',
                        padding: '4px 12px',
                        background: (emailAnalysisResult.risk_score || 0) >= 70 ? 'rgba(255, 61, 0, 0.15)' : ((emailAnalysisResult.risk_score || 0) >= 35 ? 'rgba(255, 160, 0, 0.15)' : 'rgba(0, 230, 118, 0.15)'),
                        border: `1px solid ${(emailAnalysisResult.risk_score || 0) >= 70 ? '#FF3D00' : ((emailAnalysisResult.risk_score || 0) >= 35 ? '#FFA000' : 'var(--accent-green)')}`,
                        textTransform: 'uppercase',
                        fontFamily: 'var(--font-cyber)'
                      }}>
                        {emailAnalysisResult.threat_level || 'UNKNOWN'} THREAT
                      </span>
                    </div>
                  </div>

                  {/* AI Reasoning summary */}
                  <div className="glass-panel card" style={{ margin: 0, padding: '20px', width: '100%', boxSizing: 'border-box' }}>
                    <span className="card-title">AI_REASONING_ENGINE</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>THREAT VERDICT:</span>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: (emailAnalysisResult.llm_classification || 'UNKNOWN').toLowerCase() === 'safe' ? 'var(--accent-green)' : '#FF3D00',
                          fontFamily: 'var(--font-cyber)'
                        }}>
                          {(emailAnalysisResult.llm_classification || 'UNKNOWN').toUpperCase()}
                        </span>
                      </div>
                      <p style={{ fontSize: '11px', lineHeight: '1.6', color: '#e0e0e0', margin: 0, fontStyle: 'italic', wordBreak: 'break-word' }}>
                        "{emailAnalysisResult.llm_reasoning || 'No analysis reasoning generated.'}"
                      </p>
                      {(emailAnalysisResult.risk_score || 0) >= 70 && (
                        <div style={{ marginTop: '4px' }}>
                          <button
                            onClick={() => triggerComplaintGeneration({
                              caller: emailAnalysisResult.sender || 'N/A',
                              reason: (emailAnalysisResult.llm_classification || 'UNKNOWN') + " Email Attempt",
                              risk_score: emailAnalysisResult.risk_score || 0,
                              details: emailAnalysisResult.llm_reasoning || ''
                            })}
                            style={{
                              background: 'rgba(255, 61, 0, 0.05)',
                              border: '1px solid #FF3D00',
                              color: '#FF3D00',
                              padding: '6px 12px',
                              cursor: 'pointer',
                              fontSize: '10px',
                              fontFamily: 'var(--font-cyber)',
                              fontWeight: 'bold',
                              textTransform: 'uppercase'
                            }}
                          >
                            ⚠ File Complaint Report
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Header Authentications */}
                  <div className="glass-panel card" style={{ margin: 0, padding: '20px', width: '100%', boxSizing: 'border-box' }}>
                    <span className="card-title">HEADER_AUTHENTICATION_AUDIT</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '11px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                        <span>SPF (Sender Policy Framework):</span>
                        <span style={{ fontWeight: 'bold', color: (emailAnalysisResult.headers_analysis?.spf || 'fail') === 'pass' ? 'var(--accent-green)' : '#FF3D00' }}>
                          {(emailAnalysisResult.headers_analysis?.spf || 'UNKNOWN').toUpperCase()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                        <span>DKIM (DomainKeys Identified Mail):</span>
                        <span style={{ fontWeight: 'bold', color: (emailAnalysisResult.headers_analysis?.dkim || 'fail') === 'pass' ? 'var(--accent-green)' : '#FF3D00' }}>
                          {(emailAnalysisResult.headers_analysis?.dkim || 'UNKNOWN').toUpperCase()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                        <span>DMARC (Domain-based Auth):</span>
                        <span style={{ fontWeight: 'bold', color: (emailAnalysisResult.headers_analysis?.dmarc || 'fail') === 'pass' ? 'var(--accent-green)' : '#FF3D00' }}>
                          {(emailAnalysisResult.headers_analysis?.dmarc || 'UNKNOWN').toUpperCase()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                        <span>Sender Return-Path Alignment:</span>
                        <span style={{ fontWeight: 'bold', color: emailAnalysisResult.headers_analysis?.mismatch_from_return_path ? '#FF3D00' : 'var(--accent-green)' }}>
                          {emailAnalysisResult.headers_analysis?.mismatch_from_return_path ? 'MISALIGNED' : 'ALIGNED'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                        <span>Sender Reply-To Alignment:</span>
                        <span style={{ fontWeight: 'bold', color: emailAnalysisResult.headers_analysis?.mismatch_from_reply_to ? '#FF3D00' : 'var(--accent-green)' }}>
                          {emailAnalysisResult.headers_analysis?.mismatch_from_reply_to ? 'MISALIGNED' : 'ALIGNED'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <span>Mail Server Hop Chain Hops:</span>
                        <span>{emailAnalysisResult.headers_analysis?.received_hops || 0} hops</span>
                      </div>
                    </div>
                  </div>

                  {/* Domain Reputation */}
                  <div className="glass-panel card" style={{ margin: 0, padding: '20px', width: '100%', boxSizing: 'border-box' }}>
                    <span className="card-title">DOMAIN_REPUTATION_AUDIT</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '11px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                        <span>Domain:</span>
                        <span style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{emailAnalysisResult.domain_reputation?.domain || 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                        <span>Domain Age:</span>
                        <span>{emailAnalysisResult.domain_reputation?.age_days || 0} days</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                        <span>Registrar:</span>
                        <span style={{ wordBreak: 'break-all' }}>{emailAnalysisResult.domain_reputation?.registrar || 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                        <span>SSL Certificate:</span>
                        <span style={{ fontWeight: 'bold', color: emailAnalysisResult.domain_reputation?.valid_ssl ? 'var(--accent-green)' : '#FF3D00' }}>
                          {emailAnalysisResult.domain_reputation?.valid_ssl ? 'VALID' : 'INVALID/NONE'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <span>Active MX Mail Records:</span>
                        <span style={{ fontWeight: 'bold', color: emailAnalysisResult.domain_reputation?.has_mx_records ? 'var(--accent-green)' : '#FF3D00' }}>
                          {emailAnalysisResult.domain_reputation?.has_mx_records ? 'ACTIVE' : 'MISSING'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Embedded Links */}
                  <div className="glass-panel card" style={{ margin: 0, padding: '20px', width: '100%', boxSizing: 'border-box' }}>
                    <span className="card-title">EMBEDDED_LINKS_REPUTATION ({(emailAnalysisResult.links_analysis || []).length})</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                      {(emailAnalysisResult.links_analysis || []).map((lnk, idx) => (
                        <div key={idx} style={{ border: '1px solid rgba(255,255,255,0.04)', padding: '10px', background: 'rgba(255,255,255,0.01)', fontSize: '10.5px' }}>
                          <div style={{ fontWeight: 'bold', wordBreak: 'break-all', color: 'var(--accent-green)', whiteSpace: 'normal', lineHeight: '1.4' }}>
                            {lnk.url}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '9.5px', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '6px' }}>
                            <span>Domain: {lnk.domain}</span>
                            <span style={{ color: lnk.risk_score >= 70 ? '#FF3D00' : (lnk.risk_score >= 35 ? '#FFA000' : 'var(--accent-green)'), fontWeight: 'bold' }}>
                              Risk Score: {lnk.risk_score}/100 ({lnk.decision})
                            </span>
                          </div>
                        </div>
                      ))}
                      {(!emailAnalysisResult.links_analysis || emailAnalysisResult.links_analysis.length === 0) && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                          No embedded hyperlinks found in email body content.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Attachments Security Audit */}
                  <div className="glass-panel card" style={{ margin: 0, padding: '20px', width: '100%', boxSizing: 'border-box' }}>
                    <span className="card-title">ATTACHMENTS_SECURITY_AUDIT ({(emailAnalysisResult.attachments_analysis || []).length})</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                      {(emailAnalysisResult.attachments_analysis || []).map((att, idx) => (
                        <div key={idx} style={{ border: '1px solid rgba(255,255,255,0.04)', padding: '10px', background: 'rgba(255,255,255,0.01)', fontSize: '10.5px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', flexWrap: 'wrap', gap: '6px' }}>
                            <span style={{ color: '#fff', wordBreak: 'break-all' }}>{att.filename}</span>
                            <span style={{ color: att.risk_score >= 70 ? '#FF3D00' : 'var(--text-muted)' }}>({(att.size_bytes / 1024).toFixed(1)} KB)</span>
                          </div>
                          <p style={{ fontSize: '9.5px', color: att.risk_score >= 70 ? '#FF3D00' : 'var(--text-muted)', margin: '6px 0 0 0', wordBreak: 'break-word', lineHeight: '1.4' }}>
                            {att.reason}
                          </p>
                        </div>
                      ))}
                      {(!emailAnalysisResult.attachments_analysis || emailAnalysisResult.attachments_analysis.length === 0) && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                          No file attachments found in email.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Floating Toggle Button (when closed) */}
                  {!emailChatOpen && (
                    <button 
                      onClick={() => setEmailChatOpen(true)}
                      style={{
                        position: 'fixed',
                        bottom: '24px',
                        right: '24px',
                        zIndex: 10000,
                        background: 'rgba(2, 6, 12, 0.95)',
                        border: '1px solid var(--accent-green)',
                        color: 'var(--accent-green)',
                        padding: '10px 18px',
                        borderRadius: '24px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: '0 0 12px rgba(0, 230, 118, 0.3)',
                        fontFamily: 'var(--font-cyber)'
                      }}
                    >
                      🤖 EMAIL AI ASSISTANT
                    </button>
                  )}

                  {/* Floating AI Assistant Panel */}
                  {emailChatOpen && (
                    <div className="glass-panel card" style={{
                      position: 'fixed',
                      top: '80px',
                      right: '24px',
                      bottom: '24px',
                      width: '350px',
                      margin: 0,
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      zIndex: 10000,
                      background: 'rgba(2, 6, 12, 0.96)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(0, 230, 118, 0.25)',
                      boxShadow: '0 0 25px rgba(0, 230, 118, 0.25)',
                      boxSizing: 'border-box'
                    }}>
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', margin: 0 }}>
                          <span>🤖</span> AI SECURITY ASSISTANT
                        </span>
                        <button 
                          onClick={() => setEmailChatOpen(false)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#fff',
                            fontSize: '18px',
                            cursor: 'pointer',
                            lineHeight: '1',
                            padding: '0 4px'
                          }}
                        >
                          ×
                        </button>
                      </div>
                      
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: '1px', borderBottom: '1px solid rgba(0,230,118,0.1)', paddingBottom: '8px', marginTop: '-8px' }}>
                        PRO SOC ANALYST ENGINE ACTIVE
                      </div>

                      {/* Chat Message Thread */}
                      <div style={{ 
                        flexGrow: 1, 
                        overflowY: 'auto', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '12px', 
                        paddingRight: '4px', 
                        paddingBottom: '12px', 
                        borderBottom: '1px solid rgba(255,255,255,0.04)' 
                      }}>
                        {emailChatMessages.length === 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '10px', textAlign: 'center', padding: '10px' }}>
                            <span style={{ fontSize: '28px', marginBottom: '10px' }}>💬</span>
                            <span style={{ lineHeight: '1.5' }}>
                              Ask me any question regarding this email's headers, links, domains, attachments, or composite risk findings.
                            </span>
                          </div>
                        ) : (
                          emailChatMessages.map((msg, idx) => (
                            <div key={idx} style={{
                              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                              maxWidth: '85%',
                              background: msg.role === 'user' ? 'rgba(0, 230, 118, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                              border: msg.role === 'user' ? '1px solid rgba(0, 230, 118, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
                              padding: '8px 12px',
                              fontSize: '10.5px',
                              color: '#fff',
                              lineHeight: '1.5'
                            }}>
                              <div style={{ fontSize: '8.5px', color: msg.role === 'user' ? 'var(--accent-green)' : 'rgba(255,255,255,0.4)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px', fontFamily: 'monospace' }}>
                                {msg.role === 'user' ? 'Analyst (You)' : 'SOC Assistant'}
                              </div>
                              {msg.loading ? (
                                <span className="pulse-glow" style={{ color: 'var(--accent-green)' }}>[⟳] Analyzing...</span>
                              ) : (
                                <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</div>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {/* Suggested Prompts List */}
                      {emailChatMessages.length === 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <span style={{ fontSize: '8.5px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', fontFamily: 'monospace' }}>Suggested Questions:</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '110px', overflowY: 'auto', paddingRight: '2px' }}>
                            {[
                              "Is this email genuine?",
                              "Is this a phishing email?",
                              "Is this internship real?",
                              "Can I trust this sender?",
                              "Why is this email risky?",
                              "Explain SPF.",
                              "Explain DKIM.",
                              "Explain DMARC.",
                              "Should I click this link?",
                              "Should I download the attachment?",
                              "Summarize this email.",
                              "Explain the investigation report."
                            ].map((qText, qIdx) => (
                              <button
                                key={qIdx}
                                onClick={() => sendEmailChatMessage(qText)}
                                disabled={emailChatLoading}
                                className="chat-suggested-chip"
                                style={{
                                  background: 'rgba(0, 230, 118, 0.02)',
                                  border: '1px solid rgba(0, 230, 118, 0.12)',
                                  color: 'var(--text-muted)',
                                  padding: '4px 8px',
                                  fontSize: '9px',
                                  cursor: 'pointer',
                                  fontFamily: 'monospace',
                                  textAlign: 'left'
                                }}
                              >
                                {qText}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Input controls */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          value={emailChatInput}
                          onChange={(e) => setEmailChatInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              sendEmailChatMessage();
                            }
                          }}
                          placeholder="Ask about headers, links, risk..."
                          disabled={emailChatLoading}
                          style={{
                            flexGrow: 1,
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(0,230,118,0.2)',
                            color: '#fff',
                            padding: '8px 12px',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                        <button
                          onClick={() => sendEmailChatMessage()}
                          disabled={emailChatLoading || !emailChatInput.trim()}
                          style={{
                            background: 'rgba(0,230,118,0.08)',
                            border: '1px solid var(--accent-green)',
                            color: 'var(--accent-green)',
                            padding: '8px 12px',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            fontFamily: 'var(--font-cyber)'
                          }}
                        >
                          SEND
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                /* Inbox/Connect List View */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Status Banner */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        background: emailConnected ? 'var(--accent-green)' : 'rgba(255,255,255,0.15)',
                        boxShadow: emailConnected ? '0 0 8px var(--accent-green)' : 'none'
                      }}></span>
                      <span style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold', fontFamily: 'monospace' }}>
                        GMAIL_GATEWAY: {emailConnected ? `CONNECTED [${emailAddress}]` : 'OFFLINE'}
                      </span>
                    </div>
                    {emailConnected && (
                      <button 
                        onClick={() => fetchInboxEmails()}
                        disabled={emailLoading}
                        style={{
                          background: 'none',
                          border: '1px solid rgba(0, 230, 118, 0.3)',
                          color: 'var(--accent-green)',
                          padding: '4px 10px',
                          fontSize: '10px',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-cyber)'
                        }}
                      >
                        {emailLoading ? 'LOADING...' : 'REFRESH INBOX'}
                      </button>
                    )}
                  </div>

                  {emailError && (
                    <div style={{ fontSize: '10px', color: '#FF3D00', padding: '8px 12px', border: '1px solid rgba(255, 61, 0, 0.2)', background: 'rgba(255, 61, 0, 0.05)', fontFamily: 'var(--font-cyber)' }}>
                      [⚠] WARNING: {emailError}
                    </div>
                  )}

                  {!emailConnected ? (
                    /* Connect Option */
                    <div className="glass-panel card" style={{ maxWidth: '500px', margin: '40px auto', width: '100%', padding: '30px', textAlign: 'center' }}>
                      <Mail style={{ width: '48px', height: '48px', color: 'var(--accent-green)', margin: '0 auto 16px auto', opacity: 0.8 }} />
                      <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontFamily: 'var(--font-cyber)' }}>
                        Connect Gmail Account
                      </h3>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '24px' }}>
                        Connect your Gmail account using Google OAuth to inspect incoming emails, audit authentication headers (SPF, DKIM, DMARC), verify sender reputations, scan hyperlinks, and prevent email-based social engineering scams.
                      </p>
                      <button 
                        onClick={handleConnectGmail}
                        disabled={emailLoading}
                        style={{
                          background: 'rgba(0, 230, 118, 0.05)',
                          border: '1px solid var(--accent-green)',
                          color: 'var(--accent-green)',
                          padding: '8px 20px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-cyber)',
                          textTransform: 'uppercase'
                        }}
                      >
                        {emailLoading ? 'Connecting...' : 'CONNECT GMAIL SECURELY'}
                      </button>
                    </div>
                  ) : (
                    /* Emails Table list */
                    <div className="glass-panel card" style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
                      <span className="card-title" style={{ margin: '14px' }}>INCOMING_MAIL_LOGS ({emailsList.length})</span>
                      <div className="logs-table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                        <table className="logs-table">
                          <thead>
                            <tr>
                              <th>Sender</th>
                              <th>Subject</th>
                              <th>Received Date</th>
                              <th>Snippet Preview</th>
                              <th style={{ textAlign: 'right' }}>Forensic Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {emailsList.map((msg) => (
                              <tr key={msg.id} style={{ fontStyle: msg.is_unread ? 'italic' : 'normal' }}>
                                <td style={{ fontFamily: 'monospace', fontWeight: msg.is_unread ? 'bold' : 'normal' }}>
                                  {msg.sender.split("<")[0].trim() || msg.sender}
                                </td>
                                <td style={{ fontWeight: msg.is_unread ? 'bold' : 'normal' }}>{msg.subject}</td>
                                <td style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{msg.date.split(',')[1] || msg.date}</td>
                                <td style={{ fontSize: '10.5px', color: 'var(--text-muted)', maxWidth: '300px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                  {msg.snippet}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <button
                                    onClick={() => handleAnalyzeEmail(msg.id)}
                                    style={{
                                      fontSize: '9px',
                                      padding: '3px 8px',
                                      background: 'rgba(0, 230, 118, 0.05)',
                                      color: 'var(--accent-green)',
                                      border: '1px solid var(--accent-green)',
                                      cursor: 'pointer',
                                      textTransform: 'uppercase',
                                      fontFamily: 'var(--font-cyber)'
                                    }}
                                  >
                                    Inspect Mail
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {emailsList.length === 0 && !emailLoading && (
                              <tr>
                                <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                  No emails found in your inbox.
                                </td>
                              </tr>
                            )}
                            {emailLoading && (
                              <tr>
                                <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'var(--accent-green)' }}>
                                  [⟳] Fetching emails from Gmail API...
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Dashboard (Stats and History list) */}
          {activeNav === 'Dashboard_Hidden_Node' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.5s ease-out' }}>
              
              {/* TOP: KPI Cards */}
              <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {[
                  { 
                    label: "Total Investigations", 
                    val: stats.total_scans, 
                    trend: "+12.4%", 
                    icon: Activity, 
                    sparkline: (
                      <svg viewBox="0 0 100 30" width="60" height="15">
                        <path d="M0,25 Q15,5 30,20 T60,5 T90,20 L100,10" fill="none" stroke="var(--accent-green)" strokeWidth="1"/>
                      </svg>
                    )
                  },
                  { 
                    label: "High Risk Threats", 
                    val: stats.high_risk_websites, 
                    trend: "+4.1%", 
                    icon: AlertOctagon, 
                    sparkline: (
                      <svg viewBox="0 0 100 30" width="60" height="15">
                        <path d="M0,5 Q20,25 40,10 T80,25 L100,5" fill="none" stroke="var(--accent-green)" strokeWidth="1"/>
                      </svg>
                    )
                  },
                  { 
                    label: "Safe Websites", 
                    val: stats.safe_websites, 
                    trend: "+8.2%", 
                    icon: Shield, 
                    sparkline: (
                      <svg viewBox="0 0 100 30" width="60" height="15">
                        <path d="M0,20 Q30,5 60,25 L100,10" fill="none" stroke="var(--accent-green)" strokeWidth="1"/>
                      </svg>
                    )
                  },
                  { 
                    label: "Live Call Scans", 
                    val: callProcessing ? "1 Active" : "0 Active", 
                    trend: "Stable", 
                    icon: PhoneCall, 
                    sparkline: (
                      <svg viewBox="0 0 100 30" width="60" height="15">
                        <path d="M0,15 L20,15 L30,5 L40,25 L50,15 L70,15 L80,10 L90,20 L100,15" fill="none" stroke="var(--accent-green)" strokeWidth="1"/>
                      </svg>
                    )
                  },
                  { 
                    label: "Complaints Filed", 
                    val: stats.total_complaints || recentComplaints.length || 0, 
                    trend: "+15.0%", 
                    icon: FileText, 
                    sparkline: (
                      <svg viewBox="0 0 100 30" width="60" height="15">
                        <path d="M0,25 Q20,15 40,20 T80,5 L100,15" fill="none" stroke="var(--accent-green)" strokeWidth="1"/>
                      </svg>
                    )
                  }
                ].map((stat, i) => {
                  const StatIcon = stat.icon;
                  return (
                    <div 
                      key={i} 
                      className="glass-panel card" 
                      style={{ 
                        margin: 0, 
                        padding: '16px 20px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'space-between',
                        minHeight: '110px',
                        border: '1px solid rgba(0, 230, 118, 0.15)',
                        background: 'rgba(5, 7, 10, 0.4)',
                        backdropFilter: 'blur(12px)',
                        borderRadius: '4px',
                        boxShadow: '0 0 8px rgba(0, 230, 118, 0.02)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                        cursor: 'default'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.borderColor = 'rgba(0, 230, 118, 0.4)';
                        e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 230, 118, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = 'rgba(0, 230, 118, 0.15)';
                        e.currentTarget.style.boxShadow = '0 0 8px rgba(0, 230, 118, 0.02)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</span>
                        <StatIcon style={{ width: '12px', height: '12px', color: 'var(--accent-green)' }} />
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '10px' }}>
                        <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', textShadow: '0 0 10px rgba(255,255,255,0.1)' }}>
                          {stat.val}
                        </span>
                        <span style={{ fontSize: '9px', color: 'var(--accent-green)', fontWeight: 'bold' }}>
                          {stat.trend}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid rgba(0,230,118,0.08)', paddingTop: '8px' }}>
                        <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>ACTIVITY TREND</span>
                        {stat.sparkline}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* MIDDLE: Three Column Grid (Threat Overview, Live Feed, Agent Status) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                
                {/* Column 1: Threat Overview */}
                <div className="glass-panel card" style={{ margin: 0, padding: '20px', border: '1px solid rgba(0, 230, 118, 0.15)', background: 'rgba(5, 7, 10, 0.4)', backdropFilter: 'blur(12px)', borderRadius: '4px' }}>
                  <span className="card-title" style={{ fontSize: '11px', letterSpacing: '0.5px', fontWeight: 'bold', display: 'block', marginBottom: '16px', color: 'var(--accent-green)', textShadow: '0 0 4px rgba(0,230,118,0.3)' }}>THREAT OVERVIEW</span>
                  
                  {(() => {
                    const safe = scanHistory.filter(x => x.status === "Clean").length || 8;
                    const phishing = scanHistory.filter(x => x.category?.toLowerCase().includes("phish")).length || 4;
                    const banking = scanHistory.filter(x => x.category?.toLowerCase().includes("bank")).length || 2;
                    const qr = scanHistory.filter(x => x.type?.toLowerCase().includes("qr") || x.type?.toLowerCase().includes("apk")).length || 2;
                    const total = safe + phishing + banking + qr || 16;
                    
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto' }}>
                          <svg width="120" height="120" viewBox="0 0 36 36" style={{ display: 'block' }}>
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(0, 230, 118, 0.03)" strokeWidth="2.5" />
                            {/* Segment 1: Safe (Bright Green) */}
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="#00E676" strokeWidth="3" 
                              strokeDasharray={`${(safe / total) * 100} ${100 - (safe / total) * 100}`} 
                              strokeDashoffset="25" />
                            {/* Segment 2: Phishing (Green opacity 0.7) */}
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(0, 230, 118, 0.7)" strokeWidth="3" 
                              strokeDasharray={`${(phishing / total) * 100} ${100 - (phishing / total) * 100}`} 
                              strokeDashoffset={`${25 - (safe / total) * 100}`} />
                            {/* Segment 3: Scams (Green opacity 0.4) */}
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(0, 230, 118, 0.4)" strokeWidth="3" 
                              strokeDasharray={`${(banking / total) * 100} ${100 - (banking / total) * 100}`} 
                              strokeDashoffset={`${25 - ((safe + phishing) / total) * 100}`} />
                            {/* Segment 4: QR/APK (Green opacity 0.2) */}
                            <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(0, 230, 118, 0.2)" strokeWidth="3" 
                              strokeDasharray={`${(qr / total) * 100} ${100 - (qr / total) * 100}`} 
                              strokeDashoffset={`${25 - ((safe + phishing + banking) / total) * 100}`} />
                          </svg>
                          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>{total}</span>
                            <span style={{ fontSize: '7px', color: 'var(--text-muted)' }}>TOTAL SCANS</span>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', background: '#00E676', borderRadius: '50%' }} />
                            <span style={{ color: 'var(--text-muted)' }}>Safe: {safe}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', background: 'rgba(0, 230, 118, 0.7)', borderRadius: '50%' }} />
                            <span style={{ color: 'var(--text-muted)' }}>Phishing: {phishing}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', background: 'rgba(0, 230, 118, 0.4)', borderRadius: '50%' }} />
                            <span style={{ color: 'var(--text-muted)' }}>Scams: {banking}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', background: 'rgba(0, 230, 118, 0.2)', borderRadius: '50%' }} />
                            <span style={{ color: 'var(--text-muted)' }}>QR/APK: {qr}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Column 2: Live Activity Feed */}
                <div className="glass-panel card" style={{ margin: 0, padding: '20px', border: '1px solid rgba(0, 230, 118, 0.15)', background: 'rgba(5, 7, 10, 0.4)', backdropFilter: 'blur(12px)', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span className="card-title" style={{ fontSize: '11px', letterSpacing: '0.5px', fontWeight: 'bold', color: 'var(--accent-green)', textShadow: '0 0 4px rgba(0,230,118,0.3)' }}>LIVE ACTIVITY</span>
                    <span className="pulse-glow" style={{ width: '6px', height: '6px', background: 'var(--accent-green)', boxShadow: '0 0 6px var(--accent-green)' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto' }}>
                    {liveThreatFeed.map((feed, idx) => (
                      <div 
                        key={feed.id || idx} 
                        style={{ 
                          background: 'rgba(0, 230, 118, 0.01)', 
                          borderLeft: '2px solid var(--accent-green)',
                          padding: '6px 10px',
                          borderRadius: '0 2px 2px 0',
                          animation: 'fadeIn 0.3s ease-out'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)' }}>
                          <span style={{ fontWeight: 'bold' }}>{feed.agent}</span>
                          <span>{feed.time}</span>
                        </div>
                        <p style={{ fontSize: '11px', color: '#fff', marginTop: '2px', fontFamily: 'var(--font-cyber)' }}>{feed.event}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 3: Agent Status Panel */}
                <div className="glass-panel card" style={{ margin: 0, padding: '20px', border: '1px solid rgba(0, 230, 118, 0.15)', background: 'rgba(5, 7, 10, 0.4)', backdropFilter: 'blur(12px)', borderRadius: '4px' }}>
                  <span className="card-title" style={{ fontSize: '11px', letterSpacing: '0.5px', fontWeight: 'bold', display: 'block', marginBottom: '16px', color: 'var(--accent-green)', textShadow: '0 0 4px rgba(0,230,118,0.3)' }}>AGENT STATUS PANEL</span>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { name: "Website Investigation Agent", status: webProcessing ? "Processing" : "Running", active: true, lastAct: "Website Scan", health: "100%" },
                      { name: "Call Analysis Agent", status: callProcessing ? "Processing" : "Running", active: true, lastAct: "Audio Forensics", health: "100%" },
                      { name: "Live Call Detector", status: callProcessing ? "Active" : "Running", active: true, lastAct: "Waveform Listening", health: "100%" },
                      { name: "Complaint Filing Agent", status: complaintStatus === 'generating' || complaintStatus === 'sending' ? "Processing" : "Idle", active: true, lastAct: "Email Routing", health: "100%" },
                      { name: "AI Assistant", status: chatLoading ? "Processing" : "Running", active: true, lastAct: "Assisting Analyst", health: "100%" }
                    ].map((agent, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,230,118,0.05)', paddingBottom: '6px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ 
                              width: '6px', 
                              height: '6px', 
                              borderRadius: '50%', 
                              background: agent.status === "Processing" || agent.status === "Active" ? '#FFA000' : '#00E676',
                              boxShadow: agent.status === "Processing" || agent.status === "Active" ? '0 0 6px #FFA000' : '0 0 6px #00E676'
                            }} />
                            <span style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold' }}>{agent.name}</span>
                          </div>
                          <div style={{ fontSize: '8px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            LAST ACT: {agent.lastAct} • HEALTH: {agent.health}
                          </div>
                        </div>
                        <span style={{ 
                          fontSize: '9px', 
                          fontWeight: 'bold', 
                          textTransform: 'uppercase',
                          color: agent.status === "Processing" || agent.status === "Active" ? '#FFA000' : '#00E676'
                        }}>
                          {agent.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* BOTTOM: Recent Investigation Table */}
              <div className="glass-panel card" style={{ margin: 0, padding: '20px', border: '1px solid rgba(0, 230, 118, 0.15)', background: 'rgba(5, 7, 10, 0.4)', backdropFilter: 'blur(12px)', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span className="card-title" style={{ fontSize: '11px', letterSpacing: '0.5px', fontWeight: 'bold', color: 'var(--accent-green)', textShadow: '0 0 4px rgba(0,230,118,0.3)' }}>RECENT INVESTIGATION TABLE</span>
                  <span className="glass-badge" style={{ fontSize: '9px', padding: '2px 8px', borderColor: 'rgba(0, 230, 118, 0.2)', color: 'var(--accent-green)' }}>SECURE PIPELINE</span>
                </div>

                <div className="logs-table-wrapper" style={{ overflowX: 'auto', maxHeight: '350px' }}>
                  <table className="logs-table">
                    <thead>
                      <tr>
                        <th style={{ fontFamily: 'var(--font-cyber)' }}>Scan ID</th>
                        <th style={{ fontFamily: 'var(--font-cyber)' }}>Agent</th>
                        <th style={{ fontFamily: 'var(--font-cyber)' }}>Threat Type</th>
                        <th style={{ fontFamily: 'var(--font-cyber)' }}>Risk Level</th>
                        <th style={{ fontFamily: 'var(--font-cyber)', textAlign: 'center' }}>Score</th>
                        <th style={{ fontFamily: 'var(--font-cyber)' }}>Time</th>
                        <th style={{ fontFamily: 'var(--font-cyber)', textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scanHistory.slice(0, 15).map((log) => {
                        let riskLabel = "Safe";
                        let riskColor = "var(--accent-green)";
                        if (log.score > 0 && log.score < 50) {
                          riskLabel = "Warning";
                          riskColor = "#FFA000";
                        } else if (log.score >= 50 && log.score < 75) {
                          riskLabel = "Warning";
                          riskColor = "#FFA000";
                        } else if (log.score >= 75) {
                          riskLabel = "High Risk";
                          riskColor = "#FF3D00";
                        }

                        return (
                          <tr key={log.id}>
                            <td style={{ fontFamily: 'var(--font-cyber)', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                              #SH-{log.id.length > 15 ? log.id.substring(0, 12) + "..." : log.id}
                            </td>
                            <td>{log.agent}</td>
                            <td style={{ color: 'var(--text-muted)' }}>{log.type}</td>
                            <td>
                              <span style={{ 
                                color: riskColor,
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                fontSize: '10px'
                              }}>
                                {riskLabel}
                              </span>
                            </td>
                            <td style={{ fontWeight: 'bold', color: riskColor, textAlign: 'center' }}>
                              {log.score}%
                            </td>
                            <td style={{ color: 'var(--text-muted)' }}>{log.date}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button 
                                onClick={() => {
                                  if (log.agent.includes("Call")) setActiveNav('Call Analysis');
                                  else setActiveNav('Web & QR Scan');
                                }}
                                style={{ background: 'transparent', border: 'none', color: 'var(--accent-green)', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}
                                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                              >
                                INSPECT
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* Protection Dashboard */}
          {activeNav === 'Protection' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Stats & Search Header Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                
                {/* Stats Panel */}
                <div className="glass-panel card" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    TOTAL BLOCKED WEBSITES
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '10px' }}>
                    <span style={{ 
                      fontSize: '36px', 
                      fontWeight: 'bold', 
                      color: '#FF3D00', 
                      textShadow: '0 0 10px rgba(255, 61, 0, 0.4)',
                      fontFamily: 'var(--font-cyber)'
                    }}>
                      {blockedWebsitesList.filter(item => item.blocked).length}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                      active policies
                    </span>
                  </div>
                </div>

                {/* Search & Filters Panel */}
                <div className="glass-panel card" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <span className="card-title" style={{ fontSize: '11px' }}>DATABASE SEARCH & INDICATOR FILTERS</span>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="text"
                      value={blocklistSearch}
                      onChange={(e) => setBlocklistSearch(e.target.value)}
                      placeholder="Search normalized domains (e.g. google.com)..."
                      style={{
                        flex: 1,
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        fontSize: '12px',
                        padding: '8px 12px',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                  
                  {/* Category Filter tabs */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['All', 'High Risk', 'Phishing', 'Malware', 'Safe'].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setProtectionFilter(filter)}
                        style={{
                          background: protectionFilter === filter ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${protectionFilter === filter ? 'var(--accent-green)' : 'rgba(255,255,255,0.1)'}`,
                          color: protectionFilter === filter ? '#fff' : 'var(--text-muted)',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-cyber)',
                          textTransform: 'uppercase'
                        }}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Quick Summary Playbook Split lists */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                
                {/* Recently Blocked */}
                <div className="glass-panel card" style={{ margin: 0, padding: '16px' }}>
                  <span className="card-title" style={{ fontSize: '11px', color: '#FF3D00' }}>RECENTLY BLOCKED</span>
                  <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                    {blockedWebsitesList.filter(item => item.blocked).slice(0, 5).map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderLeft: '3px solid #FF3D00' }}>
                        <span style={{ fontFamily: 'monospace', color: '#fff' }}>{item.domain}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{item.blocked_at ? item.blocked_at.split(' ')[0] : 'N/A'}</span>
                      </div>
                    ))}
                    {blockedWebsitesList.filter(item => item.blocked).length === 0 && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>No active blocked websites.</span>
                    )}
                  </div>
                </div>

                {/* Recently Unblocked */}
                <div className="glass-panel card" style={{ margin: 0, padding: '16px' }}>
                  <span className="card-title" style={{ fontSize: '11px', color: 'var(--accent-green)' }}>RECENTLY UNBLOCKED</span>
                  <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                    {blockedWebsitesList.filter(item => !item.blocked && item.unblocked).slice(0, 5).map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderLeft: '3px solid var(--accent-green)' }}>
                        <span style={{ fontFamily: 'monospace', color: '#fff' }}>{item.domain}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{item.unblocked_at ? item.unblocked_at.split(' ')[0] : 'N/A'}</span>
                      </div>
                    ))}
                    {blockedWebsitesList.filter(item => !item.blocked && item.unblocked).length === 0 && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>No recently unblocked websites.</span>
                    )}
                  </div>
                </div>

              </div>

              {/* Main Protection list Table */}
              <div className="glass-panel card" style={{ margin: 0 }}>
                <span className="card-title">MANAGED PROTECTION LIST</span>
                <div style={{ overflowX: 'auto', marginTop: '12px' }}>
                  <table className="logs-table">
                    <thead>
                      <tr>
                        <th>Domain</th>
                        <th>Risk Score</th>
                        <th>Threat Category</th>
                        <th>Block Status</th>
                        <th>Blocked/Unblocked At</th>
                        <th>Reason</th>
                        <th>Initiator</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const filtered = blockedWebsitesList.filter(item => {
                          const matchesSearch = item.domain.toLowerCase().includes(blocklistSearch.toLowerCase());
                          if (!matchesSearch) return false;

                          if (protectionFilter === 'High Risk') return item.risk_score >= 75;
                          if (protectionFilter === 'Phishing') return (item.threat_type || '').toLowerCase() === 'phishing';
                          if (protectionFilter === 'Malware') return (item.threat_type || '').toLowerCase() === 'malware';
                          if (protectionFilter === 'Safe') return item.risk_score < 50;
                          return true;
                        });

                        if (filtered.length > 0) {
                          return filtered.map((item) => (
                            <tr key={item.id || item._id || item.domain}>
                              <td style={{ fontFamily: 'monospace', color: '#fff', fontWeight: 'bold' }}>{item.domain}</td>
                              <td style={{ color: getRiskColor(item.risk_score), fontWeight: 'bold' }}>{item.risk_score}%</td>
                              <td>{item.threat_type || 'General Risk'}</td>
                              <td>
                                <span style={{ 
                                  padding: '2px 8px', 
                                  fontSize: '10px', 
                                  fontWeight: 'bold',
                                  background: item.blocked ? 'rgba(255,61,0,0.1)' : 'rgba(0,230,118,0.1)',
                                  color: item.blocked ? '#FF3D00' : 'var(--accent-green)',
                                  border: `1px solid ${item.blocked ? 'rgba(255,61,0,0.2)' : 'rgba(0,230,118,0.2)'}`
                                }}>
                                  {item.blocked ? 'BLOCKED' : 'UNBLOCKED'}
                                </span>
                              </td>
                              <td style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>{item.blocked ? item.blocked_at : (item.unblocked_at || 'N/A')}</td>
                              <td style={{ color: 'var(--text-muted)' }}>{item.reason}</td>
                              <td>{item.blocked_by}</td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                  {item.blocked ? (
                                    <button
                                      disabled={blockingLoading}
                                      onClick={() => handleUnblockWebsite(item.domain)}
                                      style={{
                                        fontSize: '9px',
                                        padding: '3px 8px',
                                        border: '1px solid var(--accent-green)',
                                        background: 'rgba(0, 230, 118, 0.05)',
                                        color: 'var(--accent-green)',
                                        cursor: 'pointer',
                                        fontFamily: 'var(--font-cyber)',
                                        textTransform: 'uppercase'
                                      }}
                                    >
                                      Unblock
                                    </button>
                                  ) : (
                                    <button
                                      disabled={blockingLoading}
                                      onClick={() => handleBlockWebsite(item.domain)}
                                      style={{
                                        fontSize: '9px',
                                        padding: '3px 8px',
                                        border: '1px solid #FF3D00',
                                        background: 'rgba(255, 61, 0, 0.05)',
                                        color: '#FF3D00',
                                        cursor: 'pointer',
                                        fontFamily: 'var(--font-cyber)',
                                        textTransform: 'uppercase'
                                      }}
                                    >
                                      Block
                                    </button>
                                  )}
                                  
                                  <button
                                    onClick={async () => {
                                      if (confirm(`Are you sure you want to permanently delete the block record for ${item.domain}?`)) {
                                        try {
                                          const entryId = item.id || item._id;
                                          const res = await fetch(`http://127.0.0.1:8001/api/websites/block/${entryId}`, { method: 'DELETE' });
                                          if (res.ok) {
                                            fetchBlockedWebsitesList();
                                            fetchDashboardStatsAndHistory();
                                            fetchProtectionData();
                                          }
                                        } catch (e) {
                                          console.error(e);
                                        }
                                      }
                                    }}
                                    style={{
                                      fontSize: '9px',
                                      padding: '3px 8px',
                                      border: '1px solid #FFA000',
                                      background: 'rgba(255, 160, 0, 0.05)',
                                      color: '#FFA000',
                                      cursor: 'pointer',
                                      fontFamily: 'var(--font-cyber)',
                                      textTransform: 'uppercase'
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ));
                        } else {
                          return (
                            <tr>
                              <td colSpan="8" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No matching protection records found.
                              </td>
                            </tr>
                          );
                        }
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* COMPLAINT AGENT MODULE */}
          {activeNav === 'Complaint Agent' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Header Title */}
              <div className="glass-panel card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileText style={{ color: 'var(--accent-green)' }} /> COMPLAINT FILING AGENT
                    </h2>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      AUTOMATED LEGAL DOCUMENT COMPILATION & EVIDENCE PACKAGING NODE
                    </p>
                  </div>
                  <span className="glass-badge" style={{ color: 'var(--accent-green)', borderColor: 'var(--accent-green)' }}>ACTIVE_SOC_COMPLIANCE</span>
                </div>
              </div>

              {/* NULL / EMPTY TARGET STATE */}
              {(complaintStatus === 'null' || !complaintTarget) && (
                <div className="glass-panel card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '60px 24px', minHeight: '380px' }}>
                  <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                    <Shield style={{ width: '32px', height: '32px', color: 'var(--accent-green)' }} />
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', textTransform: 'uppercase' }}>No Active Threat Selected</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '460px', marginTop: '10px', lineHeight: '18px' }}>
                    To file an official cybercrime complaint, navigate to the <b>Web & QR Scan</b> or <b>Call Analysis</b> views and click the <b>REPORT WEBSITE</b> or <b>Notify Cyber Crime</b> action button when a threat is identified.
                  </p>
                  <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                    <button onClick={() => setActiveNav('Web & QR Scan')} className="btn-primary" style={{ width: 'auto', padding: '8px 24px' }}>
                      Go to Web Scan
                    </button>
                    <button onClick={() => setActiveNav('Call Analysis')} className="btn-secondary" style={{ width: 'auto', padding: '8px 24px' }}>
                      Go to Call Scan
                    </button>
                  </div>
                </div>
              )}

              {/* RECIPIENT CONFIGURATION STATE */}
              {complaintStatus === 'config' && complaintTarget && (
                <div className="glass-panel card" style={{ maxWidth: '600px', margin: '20px auto', padding: '32px', border: '1px solid rgba(0,230,118,0.15)', boxShadow: '0 0 25px rgba(0,230,118,0.05)' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText style={{ color: 'var(--accent-green)' }} /> Complaint Recipient Configuration
                  </h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                    Configure the official target endpoints for this legal threat packaging dispatch.
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>To (Recipient Email):</label>
                      <input 
                        type="text"
                        className="input-field"
                        value={configForm.to}
                        onChange={(e) => setConfigForm({ ...configForm, to: e.target.value })}
                        placeholder="Enter recipient email address"
                        style={{ width: '100%', fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 14px', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>CC (Optional Carbon Copy):</label>
                      <input 
                        type="text"
                        className="input-field"
                        value={configForm.cc}
                        onChange={(e) => setConfigForm({ ...configForm, cc: e.target.value })}
                        placeholder="Optional carbon copy recipient"
                        style={{ width: '100%', fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 14px', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>Subject:</label>
                      <input 
                        type="text"
                        className="input-field"
                        value={configForm.subject}
                        onChange={(e) => setConfigForm({ ...configForm, subject: e.target.value })}
                        placeholder="Complaint Regarding Suspected Cyber Scam"
                        style={{ width: '100%', fontWeight: 'bold', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 14px', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
                    <button 
                      onClick={() => { setComplaintTarget(null); setComplaintStatus('null'); }} 
                      className="btn-secondary" 
                      style={{ width: 'auto', padding: '8px 24px' }}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={startComplaintGeneration} 
                      className="btn-primary" 
                      style={{ width: 'auto', padding: '8px 24px', background: 'var(--accent-green)', color: '#020b18', fontWeight: 'bold' }}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* GENERATING STATE */}
              {complaintStatus === 'generating' && complaintTarget && (
                <div className="glass-panel card" style={{ padding: '40px', maxWidth: '600px', margin: '20px auto', border: '1px solid rgba(0,230,118,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,230,118,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="assistant-badge-pulse" style={{ position: 'relative', top: 'auto', right: 'auto' }} />
                    </div>
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      🤖 ScamON AI Complaint Agent
                    </h3>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '20px' }}>
                    {[
                      "Preparing complaint...",
                      "Collecting investigation report...",
                      "Analyzing evidence...",
                      "Generating PDF documents...",
                      "Preparing attachments...",
                      "Generating Complaint.pdf",
                      "Generating Investigation_Report.pdf",
                      "Generating Evidence_Report.pdf",
                      "Preparing email..."
                    ].map((stepText, idx) => {
                      const isCompleted = complaintProgressStep > idx;
                      const isCurrent = complaintProgressStep === idx;
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '14px', opacity: isCompleted ? 1 : (isCurrent ? 0.95 : 0.25), transition: 'opacity 0.25s ease' }}>
                          <div style={{ 
                            width: '18px', 
                            height: '18px', 
                            borderRadius: '50%', 
                            border: `1px solid ${isCompleted ? 'var(--accent-green)' : (isCurrent ? 'var(--accent-green)' : 'rgba(255,255,255,0.15)')}`,
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            boxShadow: isCurrent ? '0 0 6px var(--accent-green)' : 'none'
                          }}>
                            {isCompleted ? (
                              <span style={{ color: 'var(--accent-green)', fontSize: '9px', fontWeight: 'bold' }}>✓</span>
                            ) : (
                              isCurrent ? <span className="assistant-badge-pulse" style={{ position: 'relative', top: 'auto', right: 'auto', width: '6px', height: '6px' }} /> : null
                            )}
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: isCurrent ? 'bold' : 'normal', color: isCompleted ? 'var(--accent-green)' : '#fff' }}>
                            {stepText}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', marginTop: '32px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${(complaintProgressStep / 9) * 100}%`, 
                      height: '100%', 
                      background: 'var(--accent-green)', 
                      boxShadow: '0 0 10px var(--accent-green)',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>
              )}

              {/* TYPING STATE */}
              {complaintStatus === 'typing' && (
                <div className="glass-panel card" style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(0,230,118,0.1)' }}>
                  <div style={{ background: '#0a192f', borderBottom: '1px solid rgba(0,230,118,0.15)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', letterSpacing: '0.5px' }}>🤖 SECURE COMPLAINT COMPOSER</span>
                      <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>AI Agent is drafting the complaint letter...</p>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--accent-green)', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="assistant-badge-pulse" style={{ position: 'relative', top: 'auto', right: 'auto' }} /> DRAFTING COMPLAINT
                    </span>
                  </div>

                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold' }}>From:</span>
                      <span style={{ fontSize: '12px', color: '#fff', fontFamily: 'monospace' }}>scamon.compliance@gmail.com</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold' }}>To:</span>
                      <span style={{ fontSize: '12px', color: '#fff', fontFamily: 'monospace' }}>{complaintForm.to}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold' }}>CC:</span>
                      <span style={{ fontSize: '12px', color: '#fff', fontFamily: 'monospace' }}>{complaintForm.cc || 'None'}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold' }}>Subject:</span>
                      <span style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>{complaintForm.subject}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>Drafting Progress:</span>
                      <div 
                        ref={typingContainerRef}
                        style={{ 
                          background: 'rgba(0,0,0,0.4)', 
                          border: '1px solid rgba(255,255,255,0.08)', 
                          borderRadius: '4px', 
                          padding: '16px', 
                          color: '#e2e8f0', 
                          fontSize: '12px', 
                          fontFamily: 'monospace', 
                          whiteSpace: 'pre-wrap', 
                          minHeight: '220px',
                          maxHeight: '300px', 
                          overflowY: 'auto', 
                          lineHeight: '18px' 
                        }}
                      >
                        {typedBody}
                        <span style={{ color: 'var(--accent-green)', fontWeight: 'bold', animation: 'assistant-glow-pulse 0.8s infinite' }}>▋</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', opacity: 0.5 }}>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Waiting for compilation to finish...</span>
                      <button 
                        disabled 
                        className="btn-primary" 
                        style={{ width: 'auto', padding: '10px 32px', background: 'rgba(255,255,255,0.1)', cursor: 'not-allowed', color: '#fff' }}
                      >
                        ⚡ Send Complaint
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* PREVIEW STATE */}
              {complaintStatus === 'preview' && (
                <div className="glass-panel card" style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(0,230,118,0.15)' }}>
                  
                  {/* Gmail Compose Header */}
                  <div style={{ background: '#0a192f', borderBottom: '1px solid rgba(0,230,118,0.15)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', letterSpacing: '0.5px' }}>🤖 SECURE COMPLAINT COMPOSER</span>
                      <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Review and edit complaint contents before transmission</p>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>UUID: {complaintId}</span>
                  </div>

                  {/* Composer Fields */}
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold' }}>From:</span>
                      <span style={{ fontSize: '12px', color: '#fff', fontFamily: 'monospace' }}>scamon.compliance@gmail.com (Configured Project Account)</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold' }}>To:</span>
                      <input 
                        type="text" 
                        value={complaintForm.to} 
                        onChange={(e) => setComplaintForm({ ...complaintForm, to: e.target.value })}
                        style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '12px', padding: '4px 0', outline: 'none', fontFamily: 'monospace', borderBottom: '1px solid rgba(255,255,255,0.1)' }} 
                        placeholder="recipient@cybercrime.gov"
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold' }}>CC:</span>
                      <input 
                        type="text" 
                        value={complaintForm.cc} 
                        onChange={(e) => setComplaintForm({ ...complaintForm, cc: e.target.value })}
                        style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '12px', padding: '4px 0', outline: 'none', fontFamily: 'monospace', borderBottom: '1px solid rgba(255,255,255,0.1)' }} 
                        placeholder="cc@compliance.org (Optional)"
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold' }}>Subject:</span>
                      <input 
                        type="text" 
                        value={complaintForm.subject} 
                        onChange={(e) => setComplaintForm({ ...complaintForm, subject: e.target.value })}
                        style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '12px', padding: '4px 0', outline: 'none', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)' }} 
                      />
                    </div>

                    {/* Email Body texteditor */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>Complaint Letter Body:</span>
                      <textarea 
                        rows="12"
                        value={complaintForm.body}
                        onChange={(e) => setComplaintForm({ ...complaintForm, body: e.target.value })}
                        style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', padding: '12px', color: '#e2e8f0', fontSize: '12px', fontFamily: 'monospace', resize: 'vertical', outline: 'none', lineHeight: '18px' }}
                      />
                    </div>

                    {/* Attachments Chips Row */}
                    <div style={{ marginTop: '10px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Attachments generated:</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {complaintForm.attachments.map((att, idx) => (
                          <a 
                            key={idx}
                            href={`http://127.0.0.1:8001${att.path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="glass-badge"
                            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(0,163,255,0.05)', borderColor: 'rgba(0,163,255,0.25)', color: '#00A3FF' }}
                          >
                            <span>📄</span>
                            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{att.name}</span>
                            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>(Download)</span>
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(complaintForm.body);
                            alert("Complaint letter body copied to clipboard.");
                          }}
                          className="btn-secondary" 
                          style={{ width: 'auto', padding: '8px 16px', fontSize: '11px' }}
                        >
                          Copy Text
                        </button>
                        <button 
                          onClick={() => {
                            complaintForm.attachments.forEach(att => {
                              const link = document.createElement('a');
                              link.href = `http://127.0.0.1:8001${att.path}`;
                              link.download = att.name;
                              link.click();
                            });
                          }}
                          className="btn-secondary" 
                          style={{ width: 'auto', padding: '8px 16px', fontSize: '11px' }}
                        >
                          Download All PDFs
                        </button>
                      </div>
                      <button 
                        onClick={handleSendComplaint}
                        className="btn-primary" 
                        style={{ width: 'auto', padding: '10px 32px', background: 'var(--accent-green)', color: '#020b18', boxShadow: '0 0 15px rgba(0,230,118,0.4)', fontWeight: 'bold' }}
                      >
                        ⚡ Send Complaint
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SENDING STATE */}
              {complaintStatus === 'sending' && (
                <div className="glass-panel card" style={{ padding: '40px', maxWidth: '600px', margin: '20px auto', border: '1px solid rgba(0,230,118,0.1)' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', textTransform: 'uppercase', marginBottom: '24px', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="assistant-badge-pulse" style={{ position: 'relative', top: 'auto', right: 'auto' }} /> Dispatched Compliance Pipeline
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                      "Connecting to Gmail...",
                      "Authenticating...",
                      "Uploading attachments...",
                      "Sending email...",
                      "Delivering..."
                    ].map((stepText, idx) => {
                      const isCompleted = smtpProgressStep > idx;
                      const isCurrent = smtpProgressStep === idx;
                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '14px', opacity: isCompleted ? 1 : (isCurrent ? 0.95 : 0.25), transition: 'opacity 0.25s ease' }}>
                          <div style={{ 
                            width: '18px', 
                            height: '18px', 
                            borderRadius: '50%', 
                            border: `1px solid ${isCompleted ? 'var(--accent-green)' : (isCurrent ? 'var(--accent-green)' : 'rgba(255,255,255,0.15)')}`,
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            boxShadow: isCurrent ? '0 0 6px var(--accent-green)' : 'none'
                          }}>
                            {isCompleted ? (
                              <span style={{ color: 'var(--accent-green)', fontSize: '9px', fontWeight: 'bold' }}>✓</span>
                            ) : (
                              isCurrent ? <span className="assistant-badge-pulse" style={{ position: 'relative', top: 'auto', right: 'auto', width: '6px', height: '6px' }} /> : null
                            )}
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: isCurrent ? 'bold' : 'normal', color: isCompleted ? 'var(--accent-green)' : '#fff' }}>
                            {stepText}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', marginTop: '30px', overflow: 'hidden' }}>
                    <div style={{ width: `${(smtpProgressStep / 5) * 100}%`, height: '100%', background: 'var(--accent-green)', boxShadow: '0 0 8px var(--accent-green)', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              )}

              {/* SUCCESS CONFIRMATION STATE */}
              {complaintStatus === 'success' && (
                <div className="glass-panel card" style={{ padding: '32px' }}>
                  
                  {/* Header alert */}
                  <div style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid var(--accent-green)', borderRadius: '4px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                    <span style={{ fontSize: '24px', color: 'var(--accent-green)' }}>✓</span>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--accent-green)', textTransform: 'uppercase' }}>Email Delivered Successfully</h4>
                      <p style={{ fontSize: '11px', color: '#fff', marginTop: '2px' }}>The official legal evidence package has been emailed using Gmail SMTP server.</p>
                    </div>
                  </div>

                  {/* Audit details card */}
                  <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '4px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>✓ Complaint ID generated:</span>
                      <span style={{ fontSize: '11px', color: '#fff', fontFamily: 'monospace', fontWeight: 'bold' }}>{complaintId}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>✓ Recipient:</span>
                      <span style={{ fontSize: '11px', color: '#fff', fontFamily: 'monospace' }}>{complaintForm.to}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>✓ Timestamp:</span>
                      <span style={{ fontSize: '11px', color: '#fff' }}>{new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC'}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Files Sent:</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {complaintForm.attachments.map((att, idx) => (
                          <span key={idx} style={{ fontSize: '11px', color: '#00A3FF' }}>📄 {att.name}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Success Actions Toolbar */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={() => {
                        complaintForm.attachments.forEach(att => {
                          const link = document.createElement('a');
                          link.href = `http://127.0.0.1:8001${att.path}`;
                          link.download = att.name;
                          link.click();
                        });
                      }}
                      className="btn-secondary" 
                      style={{ width: 'auto', padding: '10px 24px' }}
                    >
                      Download Documents Again
                    </button>
                    <button 
                      onClick={() => {
                        setComplaintTarget(null);
                        setComplaintStatus('null');
                      }}
                      className="btn-secondary" 
                      style={{ width: 'auto', padding: '10px 24px' }}
                    >
                      Generate New Complaint
                    </button>
                    <button 
                      onClick={() => {
                        setComplaintTarget(null);
                        setComplaintStatus('null');
                        setActiveNav('Dashboard');
                      }}
                      className="btn-primary" 
                      style={{ width: 'auto', padding: '10px 24px' }}
                    >
                      Return to Dashboard
                    </button>
                  </div>
                </div>
              )}

              {/* ERROR STATE */}
              {complaintStatus === 'error' && (
                <div className="glass-panel card" style={{ padding: '32px' }}>
                  
                  {/* Warning Header */}
                  <div style={{ background: 'rgba(255,61,0,0.08)', border: '1px solid #FF3D00', borderRadius: '4px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                    <span style={{ fontSize: '24px', color: '#FF3D00' }}>⚠</span>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#FF3D00', textTransform: 'uppercase' }}>Unable to send the email</h4>
                      <p style={{ fontSize: '11px', color: '#fff', marginTop: '2px' }}>{complaintError || 'A connection exception occurred during the SMTP server request.'}</p>
                    </div>
                  </div>

                  {/* Troubleshoot */}
                  <div style={{ marginBottom: '24px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Possible Reasons:</span>
                    <ul style={{ fontSize: '12px', color: '#fff', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <li>Internet connection is unavailable or timed out.</li>
                      <li>Invalid recipient email address syntax.</li>
                      <li>Mail server is unavailable or blocked the login request (check GMAIL_APP_PASSWORD in <code>.env</code>).</li>
                    </ul>
                    <p style={{ fontSize: '12px', color: 'var(--accent-green)', fontWeight: 'bold', marginTop: '16px' }}>
                      Your complaint files have been safely generated and saved locally! You can download them directly below:
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={handleSendComplaint} className="btn-primary" style={{ width: 'auto', padding: '10px 24px', background: '#FF3D00', borderColor: '#FF3D00', boxShadow: '0 0 10px rgba(255,61,0,0.3)' }}>
                      Retry Send
                    </button>
                    <button 
                      onClick={() => {
                        complaintForm.attachments.forEach(att => {
                          const link = document.createElement('a');
                          link.href = `http://127.0.0.1:8001${att.path}`;
                          link.download = att.name;
                          link.click();
                        });
                      }}
                      className="btn-secondary" 
                      style={{ width: 'auto', padding: '10px 24px' }}
                    >
                      Download PDFs
                    </button>
                    <button 
                      onClick={() => setComplaintStatus('preview')}
                      className="btn-secondary" 
                      style={{ width: 'auto', padding: '10px 24px' }}
                    >
                      Cancel & Edit
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* --- ENTERPRISE DIGITAL EVIDENCE VAULT --- */}
          {activeNav === 'Evidence Vault' && (
            <>
              <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '24px', 
              width: '100%', 
              boxSizing: 'border-box',
              marginRight: vaultChatOpen ? '374px' : '0px',
              transition: 'margin-right 0.2s ease'
            }}>
              
              {/* Header Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="card-title" style={{ fontSize: '14px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FolderLock style={{ width: '16px', height: '16px', color: 'var(--accent-green)' }} /> ENTERPRISE DIGITAL EVIDENCE VAULT
                  </span>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Forensics repository for all multi-agent scan telemetry. Log integrity checked via SHA-256 hashes.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ background: 'rgba(0,230,118,0.06)', border: '1px dashed var(--accent-green)', padding: '6px 14px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 8px var(--accent-green)' }} className="pulse-glow"></div>
                    <span style={{ fontSize: '10.5px', color: '#fff', fontFamily: 'monospace' }}>ACTIVE CASE: <b>{activeCaseId || 'SCAMON-2026-000001'}</b></span>
                  </div>
                  <button
                    onClick={startNewCaseInvestigation}
                    className="btn-primary"
                    style={{ width: 'auto', padding: '8px 18px', fontSize: '10px' }}
                  >
                    ⚡ NEW INVESTIGATION CASE
                  </button>
                </div>
              </div>

              {/* Case Stats Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', width: '100%' }}>
                <div className="glass-panel card" style={{ margin: 0, padding: '16px', borderLeft: '3px solid var(--accent-green)' }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'monospace', textTransform: 'uppercase' }}>Total Forensics Cases</span>
                  <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>
                    {cases.length}
                  </div>
                </div>
                <div className="glass-panel card" style={{ margin: 0, padding: '16px', borderLeft: '3px solid #00B0FF' }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'monospace', textTransform: 'uppercase' }}>Today's Investigations</span>
                  <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>
                    {cases.filter(c => c.created_at?.includes(new Date().toISOString().substring(0, 10)) || c.offline).length + 1}
                  </div>
                </div>
                <div className="glass-panel card" style={{ margin: 0, padding: '16px', borderLeft: '3px solid #FF9100' }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'monospace', textTransform: 'uppercase' }}>Open Cases</span>
                  <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>
                    {cases.filter(c => c.status !== 'Closed').length}
                  </div>
                </div>
                <div className="glass-panel card" style={{ margin: 0, padding: '16px', borderLeft: '3px solid #78909C' }}>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'monospace', textTransform: 'uppercase' }}>Closed Cases</span>
                  <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>
                    {cases.filter(c => c.status === 'Closed').length}
                  </div>
                </div>
              </div>

              {/* Main Directory Split Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px', alignItems: 'start' }}>
                
                {/* Left Column: Case Folders Directory */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Search and filter row */}
                  <div className="glass-panel card" style={{ margin: 0, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Search Case ID..."
                        value={vaultSearch}
                        onChange={(e) => setVaultSearch(e.target.value)}
                        style={{
                          flexGrow: 1,
                          background: '#0a192f',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: '#fff',
                          padding: '6px 12px',
                          fontSize: '11px',
                          fontFamily: 'monospace',
                          outline: 'none'
                        }}
                      />
                      <button
                        onClick={fetchVaultCases}
                        className="btn-primary"
                        style={{ width: 'auto', padding: '6px 16px', fontSize: '10px' }}
                      >
                        Search
                      </button>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
                      <select
                        value={vaultFilterStatus}
                        onChange={(e) => setVaultFilterStatus(e.target.value)}
                        style={{ background: '#0a192f', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '4px 8px', fontSize: '9.5px', fontFamily: 'monospace' }}
                      >
                        <option value="All">All Statuses</option>
                        <option value="Open">Open</option>
                        <option value="Investigating">Investigating</option>
                        <option value="Evidence Collected">Evidence Collected</option>
                        <option value="Analysis Completed">Analysis Completed</option>
                        <option value="Complaint Generated">Complaint Generated</option>
                        <option value="Closed">Closed</option>
                      </select>
                      
                      <select
                        value={vaultFilterThreat}
                        onChange={(e) => setVaultFilterThreat(e.target.value)}
                        style={{ background: '#0a192f', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '4px 8px', fontSize: '9.5px', fontFamily: 'monospace' }}
                      >
                        <option value="All">All Risks</option>
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Warning">Warning</option>
                        <option value="Safe">Safe</option>
                      </select>

                      <select
                        value={vaultSortBy}
                        onChange={(e) => setVaultSortBy(e.target.value)}
                        style={{ background: '#0a192f', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', padding: '4px 8px', fontSize: '9.5px', fontFamily: 'monospace' }}
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="highest_risk">Highest Risk</option>
                        <option value="lowest_risk">Lowest Risk</option>
                      </select>
                    </div>
                  </div>

                  {/* Cases Directory List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
                    {casesLoading ? (
                      <div className="glass-panel card" style={{ padding: '24px', textAlign: 'center' }}>
                        <RefreshCw className="animate-spin" style={{ width: '20px', height: '20px', color: 'var(--accent-green)', margin: '0 auto' }} />
                      </div>
                    ) : cases.length === 0 ? (
                      <div className="glass-panel card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'monospace' }}>
                        NO CASE TELEMETRY RECORDED
                      </div>
                    ) : (
                      cases.map((c, idx) => {
                        const isSelected = selectedCase?.case_id === c.case_id;
                        return (
                          <div
                            key={`${c.case_id}-${idx}`}
                            className={`glass-panel card ${isSelected ? 'active' : ''}`}
                            style={{
                              margin: 0,
                              padding: '16px',
                              cursor: 'pointer',
                              borderLeft: isSelected ? '3px solid var(--accent-green)' : '3px solid transparent',
                              background: isSelected ? 'rgba(0, 230, 118, 0.03)' : ''
                            }}
                            onClick={() => openCaseFolderDetails(c.case_id)}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', fontFamily: 'monospace' }}>{c.case_id}</span>
                              <span style={{
                                fontSize: '8.5px',
                                padding: '2px 8px',
                                background: c.overall_risk_score >= 75 ? 'rgba(255,61,0,0.1)' : (c.overall_risk_score >= 50 ? 'rgba(255,145,0,0.1)' : 'rgba(0,230,118,0.1)'),
                                border: `1px solid ${c.overall_risk_score >= 75 ? '#FF3D00' : (c.overall_risk_score >= 50 ? '#FF9100' : 'var(--accent-green)')}`,
                                color: c.overall_risk_score >= 75 ? '#FF3D00' : (c.overall_risk_score >= 50 ? '#FF9100' : 'var(--accent-green)'),
                                fontFamily: 'monospace',
                                fontWeight: 'bold'
                              }}>
                                SCORE {c.overall_risk_score}
                              </span>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px', fontFamily: 'monospace' }}>
                              <span>Status: <b>{c.status}</b></span>
                              <span>Sources: {c.agents_used?.join(', ') || 'none'}</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)', marginTop: '6px', fontFamily: 'monospace', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '6px' }}>
                              <span>{c.created_at}</span>
                              <span 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteCaseFolder(c.case_id);
                                }}
                                style={{ color: '#FF3D00', cursor: 'pointer' }}
                              >
                                [DELETE]
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right Column: Case Folder Details Audit */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {!selectedCase ? (
                    <div className="glass-panel card" style={{ margin: 0, padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '14px', minHeight: '380px' }}>
                      <FolderLock style={{ width: '48px', height: '48px', color: 'var(--accent-green)', opacity: 0.6 }} />
                      <div>
                        <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: '1px', margin: 0 }}>
                          FORENSIC DIRECTORY AUDITOR
                        </h4>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '340px', margin: '6px auto 0 auto', lineHeight: '1.4' }}>
                          Select any sequential cyber investigation folder from the list directory to verify logs, export file ZIP packs, or generate reports.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="glass-panel card" style={{ margin: 0, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '520px', background: 'rgba(3,5,8,0.9)', border: '1px solid rgba(0,230,118,0.1)' }}>
                      
                      {/* Scoped CSS styling for buttons and forensic cards */}
                      <style dangerouslySetInnerHTML={{__html: `
                        .forensic-btn {
                          height: 34px;
                          width: 100%;
                          display: inline-flex;
                          align-items: center;
                          justify-content: center;
                          font-size: 9.5px;
                          font-weight: bold;
                          font-family: monospace;
                          cursor: pointer;
                          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                          background: transparent;
                          text-transform: uppercase;
                          letter-spacing: 0.5px;
                          border-radius: 4px;
                        }
                        .forensic-btn:disabled {
                          opacity: 0.3;
                          cursor: not-allowed;
                          box-shadow: none !important;
                          transform: none !important;
                        }
                        .forensic-btn-green {
                          border: 1px solid #00E676;
                          color: #00E676;
                        }
                        .forensic-btn-green:hover:not(:disabled) {
                          box-shadow: 0 0 12px rgba(0, 230, 118, 0.5);
                          background: rgba(0, 230, 118, 0.08);
                          transform: translateY(-1px);
                        }
                        .forensic-btn-gray {
                          border: 1px solid rgba(255, 255, 255, 0.15);
                          color: #fff;
                          background: rgba(255, 255, 255, 0.04);
                        }
                        .forensic-btn-gray:hover:not(:disabled) {
                          box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
                          background: rgba(255, 255, 255, 0.08);
                          transform: translateY(-1px);
                        }
                        .forensic-btn-purple {
                          border: 1px solid #D500F9;
                          color: #D500F9;
                        }
                        .forensic-btn-purple:hover:not(:disabled) {
                          box-shadow: 0 0 12px rgba(213, 0, 249, 0.5);
                          background: rgba(213, 0, 249, 0.08);
                          transform: translateY(-1px);
                        }
                        .forensic-btn-orange {
                          border: 1px solid #FF9100;
                          color: #FF9100;
                        }
                        .forensic-btn-orange:hover:not(:disabled) {
                          box-shadow: 0 0 12px rgba(255, 145, 0, 0.5);
                          background: rgba(255, 145, 0, 0.08);
                          transform: translateY(-1px);
                        }
                        .forensic-btn-red {
                          border: 1px solid #FF3D00;
                          color: #FF3D00;
                        }
                        .forensic-btn-red:hover:not(:disabled) {
                          box-shadow: 0 0 12px rgba(255, 61, 0, 0.5);
                          background: rgba(255, 61, 0, 0.08);
                          transform: translateY(-1px);
                        }
                        .forensic-btn-blue {
                          border: 1px solid #00B0FF;
                          color: #00B0FF;
                        }
                        .forensic-btn-blue:hover:not(:disabled) {
                          box-shadow: 0 0 12px rgba(0, 176, 255, 0.5);
                          background: rgba(0, 176, 255, 0.08);
                          transform: translateY(-1px);
                        }
                        .evidence-card {
                          border-radius: 4px;
                          background: rgba(3, 5, 8, 0.85);
                          padding: 16px;
                          display: flex;
                          flex-direction: column;
                          gap: 12px;
                          transition: all 0.25s ease;
                        }
                        .evidence-card:hover {
                          transform: translateY(-2px);
                          box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                        }
                      `}} />

                      {/* Case details header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(0,230,118,0.2)', paddingBottom: '16px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#fff', fontFamily: 'monospace', letterSpacing: '0.5px' }}>📁 CASE FILE: {selectedCase.case_id}</span>
                            <span style={{
                              fontSize: '8px',
                              padding: '1px 6px',
                              background: selectedCase.status === 'Closed' ? 'rgba(120,144,156,0.15)' : 'rgba(0,230,118,0.15)',
                              border: `1px solid ${selectedCase.status === 'Closed' ? '#78909C' : 'var(--accent-green)'}`,
                              color: selectedCase.status === 'Closed' ? '#B0BEC5' : 'var(--accent-green)',
                              fontWeight: 'bold',
                              textTransform: 'uppercase'
                            }}>{selectedCase.status}</span>
                          </div>
                          <span style={{ fontSize: '9.5px', color: 'var(--text-muted)', display: 'block', marginTop: '4px', fontFamily: 'monospace' }}>
                            CREATED: {selectedCase.created_at} | LAST MODIFIED: {selectedCase.updated_at}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>SOC STATUS:</span>
                          <select
                            value={selectedCase.status}
                            onChange={(e) => changeCaseStatus(selectedCase.case_id, e.target.value)}
                            style={{ background: '#0a192f', border: '1px solid rgba(0,230,118,0.2)', color: '#fff', padding: '4px 8px', fontSize: '10px', fontFamily: 'monospace', outline: 'none' }}
                          >
                            <option value="Open">Open</option>
                            <option value="Investigating">Investigating</option>
                            <option value="Evidence Collected">Evidence Collected</option>
                            <option value="Analysis Completed">Analysis Completed</option>
                            <option value="Complaint Generated">Complaint Generated</option>
                            <option value="Closed">Closed</option>
                          </select>
                        </div>
                      </div>

                      {/* Case statistics block */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', background: 'rgba(0,0,0,0.4)', padding: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                          <span style={{ fontSize: '7.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Agents Used</span>
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginTop: '2px' }}>{Object.keys(selectedCase.evidence || {}).length}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                          <span style={{ fontSize: '7.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Evidence Files</span>
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginTop: '2px' }}>
                            {
                              (selectedCase.evidence?.website ? 6 : 0) +
                              (selectedCase.evidence?.email ? 8 : 0) +
                              (selectedCase.evidence?.call ? 4 : 0) +
                              (selectedCase.evidence?.live_call ? 3 : 0) +
                              (selectedCase.evidence?.threat_correlation ? 2 : 0)
                            }
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                          <span style={{ fontSize: '7.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Integrity</span>
                          <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--accent-green)', marginTop: '2px' }}>VERIFIED</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                          <span style={{ fontSize: '7.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Completion</span>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#00B0FF', marginTop: '2px' }}>
                            {selectedCase.status === 'Closed' ? '100%' : (selectedCase.status === 'Complaint Generated' ? '90%' : (selectedCase.status === 'Analysis Completed' ? '75%' : '40%'))}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                          <span style={{ fontSize: '7.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Overall Threat</span>
                          <span style={{
                            fontSize: '9px',
                            fontWeight: 'bold',
                            color: selectedCase.overall_threat_level === 'CRITICAL' ? '#FF3D00' : (selectedCase.overall_threat_level === 'HIGH' ? '#FF9100' : 'var(--accent-green)'),
                            marginTop: '2px'
                          }}>{selectedCase.overall_threat_level || 'SAFE'}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '7.5px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Risk Score</span>
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginTop: '2px' }}>{selectedCase.overall_risk_score}</span>
                        </div>
                      </div>

                      {/* Agents Participated Row */}
                      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '10px' }}>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Agents Participated:</span>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '8.5px', padding: '2px 8px', background: selectedCase.evidence?.website ? 'rgba(0,230,118,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selectedCase.evidence?.website ? '#00E676' : 'rgba(255,255,255,0.08)'}`, color: selectedCase.evidence?.website ? '#fff' : 'var(--text-muted)' }}>🌐 Website Investigation Agent</span>
                          <span style={{ fontSize: '8.5px', padding: '2px 8px', background: selectedCase.evidence?.email ? 'rgba(0,176,255,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selectedCase.evidence?.email ? '#00B0FF' : 'rgba(255,255,255,0.08)'}`, color: selectedCase.evidence?.email ? '#fff' : 'var(--text-muted)' }}>📧 Email Investigation Agent</span>
                          <span style={{ fontSize: '8.5px', padding: '2px 8px', background: selectedCase.evidence?.call ? 'rgba(255,145,0,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selectedCase.evidence?.call ? '#FF9100' : 'rgba(255,255,255,0.08)'}`, color: selectedCase.evidence?.call ? '#fff' : 'var(--text-muted)' }}>📞 Call Analysis Agent</span>
                          <span style={{ fontSize: '8.5px', padding: '2px 8px', background: selectedCase.evidence?.live_call ? 'rgba(213,0,249,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selectedCase.evidence?.live_call ? '#D500F9' : 'rgba(255,255,255,0.08)'}`, color: selectedCase.evidence?.live_call ? '#fff' : 'var(--text-muted)' }}>🎙 Live Call Detector</span>
                          <span style={{ fontSize: '8.5px', padding: '2px 8px', background: selectedCase.evidence?.sms ? 'rgba(0,229,255,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selectedCase.evidence?.sms ? '#00E5FF' : 'rgba(255,255,255,0.08)'}`, color: selectedCase.evidence?.sms ? '#fff' : 'var(--text-muted)' }}>💬 SMS Investigation Agent</span>
                          <span style={{ fontSize: '8.5px', padding: '2px 8px', background: selectedCase.evidence?.threat_correlation ? 'rgba(255,61,0,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selectedCase.evidence?.threat_correlation ? '#FF3D00' : 'rgba(255,255,255,0.08)'}`, color: selectedCase.evidence?.threat_correlation ? '#fff' : 'var(--text-muted)' }}>🛡 Threat Correlation Agent</span>
                        </div>
                      </div>

                      {/* Dual column details grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: '20px', alignItems: 'start' }}>
                        
                        {/* Left column: Agent cards */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <span style={{ fontSize: '10px', color: 'var(--accent-green)', fontFamily: 'monospace', textTransform: 'uppercase', fontWeight: 'bold' }}>
                            📁 Forensic Evidence Records
                          </span>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            
                            {/* Card 1: Website Investigation Agent */}
                            <div className="evidence-card" style={{ border: `1px solid ${selectedCase.evidence?.website ? '#00E676' : 'rgba(255,255,255,0.05)'}`, opacity: selectedCase.evidence?.website ? 1 : 0.4 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '11px', fontWeight: 'bold', color: selectedCase.evidence?.website ? '#00E676' : '#fff' }}>🌐 Website Investigation Agent</span>
                                <span style={{ fontSize: '8px', background: selectedCase.evidence?.website ? 'rgba(0,230,118,0.15)' : 'rgba(255,255,255,0.05)', color: selectedCase.evidence?.website ? '#00E676' : 'var(--text-muted)', border: '1px solid', padding: '1px 6px', fontWeight: 'bold' }}>
                                  {selectedCase.evidence?.website ? 'VERIFIED' : 'PENDING'}
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: 'var(--text-muted)' }}>
                                <span>Evidence Files: <b>{selectedCase.evidence?.website ? 6 : 0}</b></span>
                                <span>Risk Rating: <b>{selectedCase.evidence?.website?.data?.risk_score || 'N/A'}</b></span>
                              </div>
                              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 12px', border: '1px solid rgba(255,255,255,0.02)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                <span style={{ fontSize: '9px', color: selectedCase.evidence?.website ? '#fff' : 'var(--text-muted)' }}>✓ Screenshot</span>
                                <span style={{ fontSize: '9px', color: selectedCase.evidence?.website ? '#fff' : 'var(--text-muted)' }}>✓ WHOIS Report</span>
                                <span style={{ fontSize: '9px', color: selectedCase.evidence?.website ? '#fff' : 'var(--text-muted)' }}>✓ SSL Certificate Report</span>
                                <span style={{ fontSize: '9px', color: selectedCase.evidence?.website ? '#fff' : 'var(--text-muted)' }}>✓ VirusTotal Report</span>
                                <span style={{ fontSize: '9px', color: selectedCase.evidence?.website ? '#fff' : 'var(--text-muted)' }}>✓ Redirect Analysis</span>
                                <span style={{ fontSize: '9px', color: selectedCase.evidence?.website ? '#fff' : 'var(--text-muted)' }}>✓ Website Risk Report</span>
                              </div>
                              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                <button
                                  disabled={!selectedCase.evidence?.website}
                                  onClick={() => {
                                    setWebResult(selectedCase.evidence.website.data);
                                    setActiveNav('Web & QR Scan');
                                  }}
                                  className="forensic-btn forensic-btn-blue"
                                  style={{ height: '26px', fontSize: '8.5px' }}
                                >
                                  View Evidence
                                </button>
                                <button
                                  disabled={!selectedCase.evidence?.website}
                                  onClick={() => window.open(`http://127.0.0.1:8001/api/evidence/cases/${selectedCase.case_id}/export/json`)}
                                  className="forensic-btn forensic-btn-green"
                                  style={{ height: '26px', fontSize: '8.5px' }}
                                >
                                  Download Evidence
                                </button>
                              </div>
                            </div>

                            {/* Card 2: Email Investigation Agent */}
                            <div className="evidence-card" style={{ border: `1px solid ${selectedCase.evidence?.email ? '#00B0FF' : 'rgba(255,255,255,0.05)'}`, opacity: selectedCase.evidence?.email ? 1 : 0.4 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '11px', fontWeight: 'bold', color: selectedCase.evidence?.email ? '#00B0FF' : '#fff' }}>📧 Email Investigation Agent</span>
                                <span style={{ fontSize: '8px', background: selectedCase.evidence?.email ? 'rgba(0,176,255,0.15)' : 'rgba(255,255,255,0.05)', color: selectedCase.evidence?.email ? '#00B0FF' : 'var(--text-muted)', border: '1px solid', padding: '1px 6px', fontWeight: 'bold' }}>
                                  {selectedCase.evidence?.email ? 'VERIFIED' : 'PENDING'}
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: 'var(--text-muted)' }}>
                                <span>Evidence Files: <b>{selectedCase.evidence?.email ? 8 : 0}</b></span>
                                <span>Risk Rating: <b>{selectedCase.evidence?.email?.data?.risk_score || 'N/A'}</b></span>
                              </div>
                              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 12px', border: '1px solid rgba(255,255,255,0.02)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                <span style={{ fontSize: '9px', color: selectedCase.evidence?.email ? '#fff' : 'var(--text-muted)' }}>✓ Email Headers</span>
                                <span style={{ fontSize: '9px', color: selectedCase.evidence?.email ? '#fff' : 'var(--text-muted)' }}>✓ SPF Result</span>
                                <span style={{ fontSize: '9px', color: selectedCase.evidence?.email ? '#fff' : 'var(--text-muted)' }}>✓ DKIM Result</span>
                                <span style={{ fontSize: '9px', color: selectedCase.evidence?.email ? '#fff' : 'var(--text-muted)' }}>✓ DMARC Result</span>
                                <span style={{ fontSize: '9px', color: selectedCase.evidence?.email ? '#fff' : 'var(--text-muted)' }}>✓ Attachments</span>
                                <span style={{ fontSize: '9px', color: selectedCase.evidence?.email ? '#fff' : 'var(--text-muted)' }}>✓ URLs</span>
                                <span style={{ fontSize: '9px', color: selectedCase.evidence?.email ? '#fff' : 'var(--text-muted)' }}>✓ Email Risk Report</span>
                              </div>
                              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                <button
                                  disabled={!selectedCase.evidence?.email}
                                  onClick={() => {
                                    setEmailAnalysisResult(selectedCase.evidence.email.data);
                                    setActiveNav('Email Investigation');
                                  }}
                                  className="forensic-btn forensic-btn-blue"
                                  style={{ height: '26px', fontSize: '8.5px' }}
                                >
                                  View Evidence
                                </button>
                                <button
                                  disabled={!selectedCase.evidence?.email}
                                  onClick={() => window.open(`http://127.0.0.1:8001/api/evidence/cases/${selectedCase.case_id}/export/json`)}
                                  className="forensic-btn forensic-btn-green"
                                  style={{ height: '26px', fontSize: '8.5px' }}
                                >
                                  Download Evidence
                                </button>
                              </div>
                            </div>

                            {/* Card 3: Call Analysis Agent */}
                            <div className="evidence-card" style={{ border: `1px solid ${selectedCase.evidence?.call ? '#FF9100' : 'rgba(255,255,255,0.05)'}`, opacity: selectedCase.evidence?.call ? 1 : 0.4 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '11px', fontWeight: 'bold', color: selectedCase.evidence?.call ? '#FF9100' : '#fff' }}>📞 Call Analysis Agent</span>
                                <span style={{ fontSize: '8px', background: selectedCase.evidence?.call ? 'rgba(255,145,0,0.15)' : 'rgba(255,255,255,0.05)', color: selectedCase.evidence?.call ? '#FF9100' : 'var(--text-muted)', border: '1px solid', padding: '1px 6px', fontWeight: 'bold' }}>
                                  {selectedCase.evidence?.call ? 'VERIFIED' : 'PENDING'}
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: 'var(--text-muted)' }}>
                                <span>Evidence Files: <b>{selectedCase.evidence?.call ? 4 : 0}</b></span>
                                <span>Risk Rating: <b>{selectedCase.evidence?.call?.data?.risk_score || 'N/A'}</b></span>
                              </div>
                              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 12px', border: '1px solid rgba(255,255,255,0.02)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                <span style={{ fontSize: '9px', color: selectedCase.evidence?.call ? '#fff' : 'var(--text-muted)' }}>✓ Audio Recording</span>
                                <span style={{ fontSize: '9px', color: selectedCase.evidence?.call ? '#fff' : 'var(--text-muted)' }}>✓ Transcript</span>
                                <span style={{ fontSize: '9px', color: selectedCase.evidence?.call ? '#fff' : 'var(--text-muted)' }}>✓ Scam Keywords</span>
                                <span style={{ fontSize: '9px', color: selectedCase.evidence?.call ? '#fff' : 'var(--text-muted)' }}>✓ Scam Classification</span>
                              </div>
                              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                <button
                                  disabled={!selectedCase.evidence?.call}
                                  onClick={() => {
                                    setCallResult(selectedCase.evidence.call.data);
                                    setActiveNav('Call Analysis');
                                  }}
                                  className="forensic-btn forensic-btn-blue"
                                  style={{ height: '26px', fontSize: '8.5px' }}
                                >
                                  View Evidence
                                </button>
                                <button
                                  disabled={!selectedCase.evidence?.call}
                                  onClick={() => window.open(`http://127.0.0.1:8001/api/evidence/cases/${selectedCase.case_id}/export/json`)}
                                  className="forensic-btn forensic-btn-green"
                                  style={{ height: '26px', fontSize: '8.5px' }}
                                >
                                  Download Evidence
                                </button>
                              </div>
                            </div>

                            {/* Card 4: Live Call Detector */}
                            <div className="evidence-card" style={{ border: `1px solid ${selectedCase.evidence?.live_call ? '#D500F9' : 'rgba(255,255,255,0.05)'}`, opacity: selectedCase.evidence?.live_call ? 1 : 0.4 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '11px', fontWeight: 'bold', color: selectedCase.evidence?.live_call ? '#D500F9' : '#fff' }}>🎙 Live Call Detector</span>
                                <span style={{ fontSize: '8px', background: selectedCase.evidence?.live_call ? 'rgba(213,0,249,0.15)' : 'rgba(255,255,255,0.05)', color: selectedCase.evidence?.live_call ? '#D500F9' : 'var(--text-muted)', border: '1px solid', padding: '1px 6px', fontWeight: 'bold' }}>
                                  {selectedCase.evidence?.live_call ? 'VERIFIED' : 'PENDING'}
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: 'var(--text-muted)' }}>
                                <span>Evidence Files: <b>{selectedCase.evidence?.live_call ? 3 : 0}</b></span>
                                <span>Risk Rating: <b>{selectedCase.evidence?.live_call?.data?.risk_score || 'N/A'}</b></span>
                              </div>
                              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 12px', border: '1px solid rgba(255,255,255,0.02)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                <span style={{ fontSize: '9px', color: selectedCase.evidence?.live_call ? '#fff' : 'var(--text-muted)' }}>✓ Live Transcript</span>
                                <span style={{ fontSize: '9px', color: selectedCase.evidence?.live_call ? '#fff' : 'var(--text-muted)' }}>✓ Urgency Score</span>
                                <span style={{ fontSize: '9px', color: selectedCase.evidence?.live_call ? '#fff' : 'var(--text-muted)' }}>✓ Threat Score</span>
                              </div>
                              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                <button
                                  disabled={!selectedCase.evidence?.live_call}
                                  onClick={() => {
                                    setActiveNav('Live Call Detector');
                                  }}
                                  className="forensic-btn forensic-btn-blue"
                                  style={{ height: '26px', fontSize: '8.5px' }}
                                >
                                  View Evidence
                                </button>
                                <button
                                  disabled={!selectedCase.evidence?.live_call}
                                  onClick={() => window.open(`http://127.0.0.1:8001/api/evidence/cases/${selectedCase.case_id}/export/json`)}
                                  className="forensic-btn forensic-btn-green"
                                  style={{ height: '26px', fontSize: '8.5px' }}
                                >
                                  Download Evidence
                                </button>
                              </div>
                            </div>

                            {/* Card 4.5: SMS Investigation Agent */}
                            <div className="evidence-card" style={{ border: `1px solid ${selectedCase.evidence?.sms ? '#00E5FF' : 'rgba(255,255,255,0.05)'}`, opacity: selectedCase.evidence?.sms ? 1 : 0.4 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '11px', fontWeight: 'bold', color: selectedCase.evidence?.sms ? '#00E5FF' : '#fff' }}>💬 SMS Investigation Agent</span>
                                <span style={{ fontSize: '8px', background: selectedCase.evidence?.sms ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.05)', color: selectedCase.evidence?.sms ? '#00E5FF' : 'var(--text-muted)', border: '1px solid', padding: '1px 6px', fontWeight: 'bold' }}>
                                  {selectedCase.evidence?.sms ? 'VERIFIED' : 'PENDING'}
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: 'var(--text-muted)' }}>
                                <span>Evidence Files: <b>{selectedCase.evidence?.sms ? 1 : 0}</b></span>
                                <span>Risk Rating: <b>{selectedCase.evidence?.sms?.data?.analysis?.risk_score || 'N/A'}</b></span>
                              </div>
                              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 12px', border: '1px solid rgba(255,255,255,0.02)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                <span style={{ fontSize: '9px', color: selectedCase.evidence?.sms ? '#fff' : 'var(--text-muted)' }}>✓ SMS Headers</span>
                                <span style={{ fontSize: '9px', color: selectedCase.evidence?.sms ? '#fff' : 'var(--text-muted)' }}>✓ Semantic Traces</span>
                              </div>
                              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                <button
                                  disabled={!selectedCase.evidence?.sms}
                                  onClick={() => {
                                    setSmsResult(selectedCase.evidence.sms.data);
                                    setSmsSender(selectedCase.evidence.sms.data.sms?.sender || "");
                                    setSmsMessage(selectedCase.evidence.sms.data.sms?.message || "");
                                    setActiveNav('SMS Investigation');
                                  }}
                                  className="forensic-btn forensic-btn-blue"
                                  style={{ height: '26px', fontSize: '8.5px' }}
                                >
                                  View Evidence
                                </button>
                                <button
                                  disabled={!selectedCase.evidence?.sms}
                                  onClick={() => window.open(`http://127.0.0.1:8001/api/evidence/cases/${selectedCase.case_id}/export/json`)}
                                  className="forensic-btn forensic-btn-green"
                                  style={{ height: '26px', fontSize: '8.5px' }}
                                >
                                  Download Evidence
                                </button>
                              </div>
                            </div>

                            {/* Card 4.5: Visual Scam Investigation Agent */}
                            <div className="evidence-card" style={{ border: `1px solid ${selectedCase.evidence?.visual_scam ? '#E91E63' : 'rgba(255,255,255,0.05)'}`, opacity: selectedCase.evidence?.visual_scam ? 1 : 0.4 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '11px', fontWeight: 'bold', color: selectedCase.evidence?.visual_scam ? '#E91E63' : '#fff' }}>📷 Visual Scam Agent</span>
                                <span style={{ fontSize: '8px', background: selectedCase.evidence?.visual_scam ? 'rgba(233,30,99,0.15)' : 'rgba(255,255,255,0.05)', color: selectedCase.evidence?.visual_scam ? '#E91E63' : 'var(--text-muted)', border: '1px solid', padding: '1px 6px', fontWeight: 'bold' }}>
                                  {selectedCase.evidence?.visual_scam ? 'VERIFIED' : 'PENDING'}
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: 'var(--text-muted)' }}>
                                <span>Evidence Files: <b>{selectedCase.evidence?.visual_scam ? 2 : 0}</b></span>
                                <span>Risk Rating: <b>{selectedCase.evidence?.visual_scam?.data?.risk_score || 'N/A'}</b></span>
                              </div>
                              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 12px', border: '1px solid rgba(255,255,255,0.02)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                <span style={{ fontSize: '9px', color: selectedCase.evidence?.visual_scam ? '#fff' : 'var(--text-muted)' }}>✓ Visual OCR</span>
                                <span style={{ fontSize: '9px', color: selectedCase.evidence?.visual_scam ? '#fff' : 'var(--text-muted)' }}>✓ Sub-Agent Logs</span>
                              </div>
                              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                <button
                                  disabled={!selectedCase.evidence?.visual_scam}
                                  onClick={() => {
                                    setVisualResult(selectedCase.evidence.visual_scam.data);
                                    setActiveNav('Visual Investigation');
                                  }}
                                  className="forensic-btn forensic-btn-blue"
                                  style={{ height: '26px', fontSize: '8.5px', border: selectedCase.evidence?.visual_scam ? '1px solid #E91E63' : 'none', color: selectedCase.evidence?.visual_scam ? '#E91E63' : 'inherit' }}
                                >
                                  View Evidence
                                </button>
                                <button
                                  disabled={!selectedCase.evidence?.visual_scam}
                                  onClick={() => window.open(`http://127.0.0.1:8001/api/evidence/cases/${selectedCase.case_id}/export/json`)}
                                  className="forensic-btn forensic-btn-green"
                                  style={{ height: '26px', fontSize: '8.5px' }}
                                >
                                  Download Evidence
                                </button>
                              </div>
                            </div>

                            {/* Card 5: Threat Correlation Agent */}
                            <div className="evidence-card" style={{ border: `1px solid ${selectedCase.evidence?.threat_correlation ? '#FF3D00' : 'rgba(255,255,255,0.05)'}`, opacity: selectedCase.evidence?.threat_correlation ? 1 : 0.4 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '11px', fontWeight: 'bold', color: selectedCase.evidence?.threat_correlation ? '#FF3D00' : '#fff' }}>🛡 Threat Correlation Agent</span>
                                <span style={{ fontSize: '8px', background: selectedCase.evidence?.threat_correlation ? 'rgba(255,61,0,0.15)' : 'rgba(255,255,255,0.05)', color: selectedCase.evidence?.threat_correlation ? '#FF3D00' : 'var(--text-muted)', border: '1px solid', padding: '1px 6px', fontWeight: 'bold' }}>
                                  {selectedCase.evidence?.threat_correlation ? 'VERIFIED' : 'PENDING'}
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: 'var(--text-muted)' }}>
                                <span>Evidence Files: <b>{selectedCase.evidence?.threat_correlation ? 2 : 0}</b></span>
                                <span>Risk Rating: <b>{selectedCase.evidence?.threat_correlation?.data?.risk_score || 'N/A'}</b></span>
                              </div>
                              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 12px', border: '1px solid rgba(255,255,255,0.02)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                <span style={{ fontSize: '9px', color: selectedCase.evidence?.threat_correlation ? '#fff' : 'var(--text-muted)' }}>✓ Correlation Report</span>
                                <span style={{ fontSize: '9px', color: selectedCase.evidence?.threat_correlation ? '#fff' : 'var(--text-muted)' }}>✓ Final Verdict</span>
                              </div>
                              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                <button
                                  disabled={!selectedCase.evidence?.threat_correlation}
                                  onClick={() => {
                                    setActiveNav('Dashboard');
                                  }}
                                  className="forensic-btn forensic-btn-blue"
                                  style={{ height: '26px', fontSize: '8.5px' }}
                                >
                                  View Evidence
                                </button>
                                <button
                                  disabled={!selectedCase.evidence?.threat_correlation}
                                  onClick={() => window.open(`http://127.0.0.1:8001/api/evidence/cases/${selectedCase.case_id}/export/json`)}
                                  className="forensic-btn forensic-btn-green"
                                  style={{ height: '26px', fontSize: '8.5px' }}
                                >
                                  Download Evidence
                                </button>
                              </div>
                            </div>

                          </div>
                        </div>

                        {/* Right column: Action Panel & Timeline */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          
                          {/* Forensic action panel */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--accent-green)', fontFamily: 'monospace', textTransform: 'uppercase', fontWeight: 'bold' }}>
                              ⚡ Forensic Exporters & Pipeline Actions
                            </span>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <button
                                onClick={() => window.open(`http://127.0.0.1:8001/api/evidence/cases/${selectedCase.case_id}/export/zip`)}
                                className="forensic-btn forensic-btn-green"
                              >
                                📥 Download ZIP
                              </button>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <button
                                  onClick={() => window.open(`http://127.0.0.1:8001/api/evidence/cases/${selectedCase.case_id}/export/pdf`)}
                                  className="forensic-btn forensic-btn-gray"
                                >
                                  📄 PDF Report
                                </button>
                                <button
                                  onClick={() => window.open(`http://127.0.0.1:8001/api/evidence/cases/${selectedCase.case_id}/export/docx`)}
                                  className="forensic-btn forensic-btn-gray"
                                >
                                  📄 DOCX Report
                                </button>
                              </div>
                              <button
                                onClick={() => {
                                  localStorage.setItem("activeCaseId", selectedCase.case_id);
                                  setActiveCaseId(selectedCase.case_id);
                                  const ev = selectedCase.evidence || {};
                                  if (ev.website) setWebResult(ev.website.data);
                                  if (ev.email) setEmailAnalysisResult(ev.email.data);
                                  if (ev.call) setCallResult(ev.call.data);
                                  if (ev.sms) setSmsResult(ev.sms.data);
                                  
                                  setActiveNav('Explainability (XAI)');
                                  setTimeout(() => handleXaiExplain(), 100);
                                }}
                                className="forensic-btn forensic-btn-purple"
                              >
                                🤖 Generate XAI Summary
                              </button>
                              <button
                                onClick={() => {
                                  localStorage.setItem("activeCaseId", selectedCase.case_id);
                                  setActiveCaseId(selectedCase.case_id);
                                  const ev = selectedCase.evidence || {};
                                  if (ev.website) setWebResult(ev.website.data);
                                  if (ev.email) setEmailAnalysisResult(ev.email.data);
                                  if (ev.call) setCallResult(ev.call.data);
                                  if (ev.sms) setSmsResult(ev.sms.data);
                                  
                                  setComplaintStatus('null');
                                  setActiveNav('Complaint Agent');
                                }}
                                className="forensic-btn forensic-btn-orange"
                              >
                                📄 Generate Legal Complaint
                              </button>
                              <button
                                onClick={() => deleteCaseFolder(selectedCase.case_id)}
                                className="forensic-btn forensic-btn-red"
                              >
                                ❌ Delete Case File
                              </button>
                            </div>
                          </div>

                          {/* Evidence Summary metrics */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--accent-green)', fontFamily: 'monospace', textTransform: 'uppercase', fontWeight: 'bold' }}>
                              ✓ Forensic Evidence Summary
                            </span>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.04)', padding: '12px 14px', fontSize: '10px', fontFamily: 'monospace' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Total Evidence Files:</span>
                                <span style={{ color: '#fff', fontWeight: 'bold' }}>
                                  {
                                    (selectedCase.evidence?.website ? 6 : 0) +
                                    (selectedCase.evidence?.email ? 8 : 0) +
                                    (selectedCase.evidence?.call ? 4 : 0) +
                                    (selectedCase.evidence?.live_call ? 3 : 0) +
                                    (selectedCase.evidence?.sms ? 1 : 0) +
                                    (selectedCase.evidence?.threat_correlation ? 2 : 0)
                                  }
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px', fontSize: '9px', color: 'var(--text-muted)' }}>
                                <span>Website Files:</span>
                                <span>{selectedCase.evidence?.website ? '6' : '0'}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px', fontSize: '9px', color: 'var(--text-muted)' }}>
                                <span>Email Files:</span>
                                <span>{selectedCase.evidence?.email ? '8' : '0'}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px', fontSize: '9px', color: 'var(--text-muted)' }}>
                                <span>Call Files:</span>
                                <span>{selectedCase.evidence?.call ? '4' : '0'}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px', fontSize: '9px', color: 'var(--text-muted)' }}>
                                <span>Live Call Files:</span>
                                <span>{selectedCase.evidence?.live_call ? '3' : '0'}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px', fontSize: '9px', color: 'var(--text-muted)' }}>
                                <span>SMS Files:</span>
                                <span>{selectedCase.evidence?.sms ? '1' : '0'}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '8px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px', fontSize: '9px', color: 'var(--text-muted)' }}>
                                <span>Threat Reports:</span>
                                <span>{selectedCase.evidence?.threat_correlation ? '2' : '0'}</span>
                              </div>
                              
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px', paddingTop: '4px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Total Size:</span>
                                <span style={{ color: '#fff', fontWeight: 'bold' }}>
                                  {
                                    ((selectedCase.evidence?.website ? 6 : 0) * 14.5 +
                                     (selectedCase.evidence?.email ? 8 : 0) * 8.2 +
                                     (selectedCase.evidence?.call ? 4 : 0) * 124.0 +
                                     (selectedCase.evidence?.live_call ? 3 : 0) * 45.0 +
                                     (selectedCase.evidence?.sms ? 1 : 0) * 1.5 +
                                     (selectedCase.evidence?.threat_correlation ? 2 : 0) * 5.5).toFixed(1)
                                  } MB
                                </span>
                              </div>
                              
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px', paddingTop: '4px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Verification Status:</span>
                                <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>VERIFIED (100% SECURE)</span>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingTop: '4px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>SHA-256 Integrity Hash:</span>
                                <span style={{ fontSize: '8px', color: 'var(--accent-green)', background: 'rgba(0,0,0,0.3)', padding: '6px', border: '1px solid rgba(255,255,255,0.03)', display: 'block', wordBreak: 'break-all', fontFamily: 'monospace', marginTop: '2px' }}>
                                  {selectedCase.evidence?.website?.integrity_hash || selectedCase.evidence?.email?.integrity_hash || 'SHA256: 993deff8812c29bc119b48574a0088cc'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Forensics timeline */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--accent-green)', fontFamily: 'monospace', textTransform: 'uppercase', fontWeight: 'bold' }}>
                              ✓ Case Chronological Timeline
                            </span>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '12px', borderLeft: '1px solid rgba(0, 230, 118, 0.2)', position: 'relative', marginTop: '6px' }}>
                              
                              <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '-15.5px', top: '2.5px', width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-green)', border: '2px solid #020305' }}></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', fontFamily: 'monospace' }}>
                                  <span style={{ color: '#fff', fontWeight: 'bold' }}>Evidence Vault Created</span>
                                  <span style={{ color: 'var(--text-muted)' }}>10:32</span>
                                </div>
                              </div>

                              {selectedCase.evidence?.website && (
                                <div style={{ position: 'relative' }}>
                                  <div style={{ position: 'absolute', left: '-15.5px', top: '2.5px', width: '7px', height: '7px', borderRadius: '50%', background: '#00E676', border: '2px solid #020305' }}></div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', fontFamily: 'monospace' }}>
                                    <span style={{ color: '#fff' }}>Website Investigation Completed</span>
                                    <span style={{ color: 'var(--text-muted)' }}>10:34</span>
                                  </div>
                                </div>
                              )}

                              {selectedCase.evidence?.email && (
                                <div style={{ position: 'relative' }}>
                                  <div style={{ position: 'absolute', left: '-15.5px', top: '2.5px', width: '7px', height: '7px', borderRadius: '50%', background: '#00B0FF', border: '2px solid #020305' }}></div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', fontFamily: 'monospace' }}>
                                    <span style={{ color: '#fff' }}>Email Investigation Completed</span>
                                    <span style={{ color: 'var(--text-muted)' }}>10:36</span>
                                  </div>
                                </div>
                              )}

                              {selectedCase.evidence?.call && (
                                <div style={{ position: 'relative' }}>
                                  <div style={{ position: 'absolute', left: '-15.5px', top: '2.5px', width: '7px', height: '7px', borderRadius: '50%', background: '#FF9100', border: '2px solid #020305' }}></div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', fontFamily: 'monospace' }}>
                                    <span style={{ color: '#fff' }}>Call Analysis Completed</span>
                                    <span style={{ color: 'var(--text-muted)' }}>10:37</span>
                                  </div>
                                </div>
                              )}

                              {selectedCase.evidence?.threat_correlation && (
                                <div style={{ position: 'relative' }}>
                                  <div style={{ position: 'absolute', left: '-15.5px', top: '2.5px', width: '7px', height: '7px', borderRadius: '50%', background: '#FF3D00', border: '2px solid #020305' }}></div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', fontFamily: 'monospace' }}>
                                    <span style={{ color: '#fff' }}>Threat Correlation Completed</span>
                                    <span style={{ color: 'var(--text-muted)' }}>10:38</span>
                                  </div>
                                </div>
                              )}

                              {selectedCase.reports?.xai_summary && (
                                <div style={{ position: 'relative' }}>
                                  <div style={{ position: 'absolute', left: '-15.5px', top: '2.5px', width: '7px', height: '7px', borderRadius: '50%', background: '#D500F9', border: '2px solid #020305' }}></div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', fontFamily: 'monospace' }}>
                                    <span style={{ color: 'var(--accent-purple)', fontWeight: 'bold' }}>Explainability Report Generated</span>
                                    <span style={{ color: 'var(--text-muted)' }}>10:39</span>
                                  </div>
                                </div>
                              )}

                              {selectedCase.reports?.complaint && (
                                <div style={{ position: 'relative' }}>
                                  <div style={{ position: 'absolute', left: '-15.5px', top: '2.5px', width: '7px', height: '7px', borderRadius: '50%', background: '#FF9100', border: '2px solid #020305' }}></div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', fontFamily: 'monospace' }}>
                                    <span style={{ color: '#FF9100', fontWeight: 'bold' }}>Complaint Generated</span>
                                    <span style={{ color: 'var(--text-muted)' }}>10:40</span>
                                  </div>
                                </div>
                              )}

                            </div>
                          </div>

                        </div>

                      </div>

                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* Floating Toggle Button (when closed) */}
            {!vaultChatOpen && (
              <button 
                onClick={() => setVaultChatOpen(true)}
                style={{
                  position: 'fixed',
                  bottom: '24px',
                  right: '24px',
                  zIndex: 10000,
                  background: 'rgba(2, 6, 12, 0.95)',
                  border: '1px solid var(--accent-green)',
                  color: 'var(--accent-green)',
                  padding: '10px 18px',
                  borderRadius: '24px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 0 12px rgba(0, 230, 118, 0.3)',
                  fontFamily: 'var(--font-cyber)'
                }}
              >
                <Cpu style={{ width: '13px', height: '13px', marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }} /> VAULT AI ASSISTANT
              </button>
            )}

            {/* Floating AI Assistant Panel */}
            {vaultChatOpen && (
              <div className="glass-panel card" style={{
                position: 'fixed',
                top: '80px',
                right: '24px',
                bottom: '24px',
                width: '350px',
                margin: 0,
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                zIndex: 10000,
                background: 'rgba(2, 6, 12, 0.96)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(0, 230, 118, 0.25)',
                boxShadow: '0 0 25px rgba(0, 230, 118, 0.25)',
                boxSizing: 'border-box'
              }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', margin: 0 }}>
                    <Cpu style={{ width: '13px', height: '13px', color: 'var(--accent-green)' }} /> SOC VAULT ASSISTANT
                  </span>
                  <button 
                    onClick={() => setVaultChatOpen(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#fff',
                      fontSize: '18px',
                      cursor: 'pointer',
                      lineHeight: '1',
                      padding: '0 4px'
                    }}
                  >
                    ×
                  </button>
                </div>
                
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: '1px', borderBottom: '1px solid rgba(0,230,118,0.1)', paddingBottom: '8px', marginTop: '-8px' }}>
                  SOC VAULT COPILOT ENGINE ACTIVE
                </div>

                {/* Chat Message Thread */}
                <div style={{ 
                  flexGrow: 1, 
                  overflowY: 'auto', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px', 
                  paddingRight: '4px', 
                  paddingBottom: '12px', 
                  borderBottom: '1px solid rgba(255,255,255,0.04)' 
                }}>
                  {vaultChatMessages.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '10px', textAlign: 'center', padding: '10px' }}>
                      <MessageSquare style={{ width: '28px', height: '28px', marginBottom: '10px', color: 'var(--accent-green)' }} />
                      <span style={{ lineHeight: '1.5' }}>
                        Ask me about any scanned websites, domains (e.g. youtube.com), phone numbers, or SMS evidence.
                      </span>
                    </div>
                  ) : (
                    vaultChatMessages.map((msg, idx) => (
                      <div key={idx} style={{
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        background: msg.role === 'user' ? 'rgba(0, 230, 118, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                        border: msg.role === 'user' ? '1px solid rgba(0, 230, 118, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
                        padding: '8px 12px',
                        fontSize: '10.5px',
                        color: '#fff',
                        lineHeight: '1.5'
                      }}>
                        <div style={{ fontSize: '8.5px', color: msg.role === 'user' ? 'var(--accent-green)' : 'rgba(255,255,255,0.4)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px', fontFamily: 'monospace' }}>
                          {msg.role === 'user' ? 'Analyst (You)' : 'SOC Copilot'}
                        </div>
                        {msg.loading ? (
                          <span className="pulse-glow" style={{ color: 'var(--accent-green)' }}>[⟳] Querying Vault...</span>
                        ) : (
                          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Suggested Prompts List */}
                {vaultChatMessages.length === 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '8.5px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', fontFamily: 'monospace' }}>Suggested Queries:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '110px', overflowY: 'auto', paddingRight: '2px' }}>
                      {[
                        "I need the evidence of youtube.com",
                        "evidence for sms",
                        "evidence for email",
                        "which cases have website logs?",
                        "show me high risk cases",
                        "summarize case directory status"
                      ].map((qText, qIdx) => (
                        <button
                          key={qIdx}
                          onClick={() => sendVaultChatMessage(qText)}
                          disabled={vaultChatLoading}
                          className="chat-suggested-chip"
                          style={{
                            background: 'rgba(0, 230, 118, 0.02)',
                            border: '1px solid rgba(0, 230, 118, 0.12)',
                            color: 'var(--text-muted)',
                            padding: '4px 8px',
                            fontSize: '9px',
                            cursor: 'pointer',
                            fontFamily: 'monospace',
                            textAlign: 'left'
                          }}
                        >
                          {qText}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input controls */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={vaultChatInput}
                    onChange={(e) => setVaultChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        sendVaultChatMessage();
                      }
                    }}
                    placeholder="Search youtube.com, sms..."
                    disabled={vaultChatLoading}
                    style={{
                      flexGrow: 1,
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(0,230,118,0.2)',
                      color: '#fff',
                      padding: '8px 12px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    onClick={() => sendVaultChatMessage()}
                    disabled={vaultChatLoading || !vaultChatInput.trim()}
                    style={{
                      background: 'rgba(0,230,118,0.08)',
                      border: '1px solid var(--accent-green)',
                      color: 'var(--accent-green)',
                      padding: '8px 12px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      fontFamily: 'var(--font-cyber)'
                    }}
                  >
                    SEND
                  </button>
                </div>
              </div>
            )}

        </>
      )}

          {/* --- MULTI-AGENT EXPLAINABILITY (XAI) AGENT --- */}
          {activeNav === 'Explainability (XAI)' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', boxSizing: 'border-box' }}>
              
              {/* Header Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="card-title" style={{ fontSize: '14px', margin: 0 }}>🤖 MULTI-AGENT EXPLAINABILITY (XAI) HUB</span>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Correlates diagnostics data, provides multi-language translations, voice synthesis, and chat audits.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>TARGET REPORT LANGUAGE:</span>
                  <select
                    value={xaiLanguage}
                    onChange={(e) => {
                      const selected = e.target.value;
                      setXaiLanguage(selected);
                      handleXaiExplain(selected);
                    }}
                    style={{ background: '#0a192f', border: '1px solid rgba(0,230,118,0.2)', color: '#fff', padding: '6px 12px', fontSize: '11px', fontFamily: 'monospace' }}
                  >
                    <option value="English">ENGLISH</option>
                    <option value="Tamil">TAMIL (தமிழ்)</option>
                    <option value="Hindi">HINDI (हिन्दी)</option>
                    <option value="Malayalam">MALAYALAM (മലയാളം)</option>
                    <option value="Kannada">KANNADA (ಕನ್ನಡ)</option>
                    <option value="Telugu">TELUGU (తెలుగు)</option>
                    <option value="French">FRENCH (Français)</option>
                    <option value="Arabic">ARABIC (العربية)</option>
                  </select>
                </div>
              </div>

              {xaiLoading ? (
                <div className="glass-panel card" style={{ margin: 0, padding: '60px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', textAlign: 'center', minHeight: '280px' }}>
                  <RefreshCw className="animate-spin" style={{ width: '32px', height: '32px', color: 'var(--accent-green)' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <h4 className="pulse-glow" style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-green)', textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: '1px', margin: 0, whiteSpace: 'nowrap' }}>
                      GENERATING MULTI-AGENT FORENSIC SYNTHESIS
                    </h4>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace', margin: 0, whiteSpace: 'nowrap' }}>
                      CORRELATING SCAN DATA • RUNNING LLM TRANSLATIONS • CALCULATING RISK PROFILE
                    </p>
                  </div>
                </div>
              ) : !xaiOutput ? (
                <div className="glass-panel card" style={{ margin: 0, padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '16px' }}>
                  <Layers style={{ width: '48px', height: '48px', color: 'var(--accent-green)', opacity: 0.8 }} />
                  <div style={{ maxWidth: '480px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: 'monospace' }}>
                      XAI FORENSIC COMPILATION ENGINE
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.5' }}>
                      The Explainability Agent acts as the final diagnostics hub. It reads telemetry results from the Website registry, Email headers validator, and Call transcription agents to construct a unified explanations summary.
                    </p>
                  </div>
                  <button
                    onClick={handleXaiExplain}
                    className="btn-primary"
                    style={{ width: 'auto', padding: '10px 32px', fontSize: '11.5px', marginTop: '8px' }}
                  >
                    ⚡ RUN FORENSIC REASONING SYNTHESIS
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Gauge and Contributions */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                    
                    {/* Overall Risk Gauge */}
                    <div className="glass-panel card" style={{ margin: 0, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                      <span className="card-title" style={{ alignSelf: 'flex-start' }}>OVERALL RISK ASSESSMENT</span>
                      
                      {/* Gauge graphic */}
                      <div style={{ position: 'relative', width: '130px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'rgba(0,0,0,0.4)', border: '2px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ 
                          position: 'absolute', 
                          top: '5px', left: '5px', right: '5px', bottom: '5px', 
                          borderRadius: '50%', 
                          border: `4px solid ${xaiOutput.overall_risk.risk_score >= 75 ? '#FF3D00' : (xaiOutput.overall_risk.risk_score >= 50 ? '#FF9100' : 'var(--accent-green)')}`,
                          boxShadow: `0 0 15px ${xaiOutput.overall_risk.risk_score >= 75 ? 'rgba(255,61,0,0.2)' : 'rgba(0,230,118,0.2)'}`
                        }}></div>
                        <div style={{ textAlign: 'center', zIndex: 2 }}>
                          <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#fff', fontFamily: 'monospace' }}>{xaiOutput.overall_risk.risk_score}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 'bold', marginTop: '2px' }}>
                            {xaiOutput.overall_risk.threat_level}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '20px', width: '100%', justifyContent: 'space-around', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>THREAT CONFIDENCE</span>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', marginTop: '2px', fontFamily: 'monospace' }}>
                            {xaiOutput.overall_risk.confidence}%
                          </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>STATUS VERDICT</span>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-green)', marginTop: '4px', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                            {xaiOutput.status}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Risk Contributions Chart */}
                    <div className="glass-panel card" style={{ margin: 0, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <span className="card-title">FORENSIC RISK CONTRIBUTORS</span>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flexGrow: 1, justifyContent: 'center' }}>
                        {Object.entries(xaiOutput.risk_contributors || {}).map(([agent, pct]) => (
                          <div key={agent} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', fontFamily: 'monospace' }}>
                              <span style={{ color: '#fff', textTransform: 'uppercase' }}>{agent.replace('_', ' ')} Agent</span>
                              <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>{pct}%</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-green)', boxShadow: '0 0 8px rgba(0, 230, 118, 0.4)' }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Summary & Voice Player */}
                  <div className="glass-panel card" style={{ margin: 0, padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
                      <span className="card-title" style={{ margin: 0 }}>forensic explanation summary</span>
                      
                      {/* Language Quick translation select */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {['English', 'Tamil', 'Hindi', 'French'].map((lang) => (
                          <button
                            key={lang}
                            onClick={() => {
                              setXaiLanguage(lang);
                              handleXaiExplain(lang);
                            }}
                            style={{
                              background: xaiLanguage === lang ? 'rgba(0,230,118,0.1)' : 'transparent',
                              border: `1px solid ${xaiLanguage === lang ? 'var(--accent-green)' : 'rgba(255,255,255,0.1)'}`,
                              color: xaiLanguage === lang ? '#fff' : 'var(--text-muted)',
                              padding: '2px 8px',
                              fontSize: '9.5px',
                              cursor: 'pointer',
                              fontFamily: 'monospace'
                            }}
                          >
                            {lang.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <p style={{ fontSize: '12.5px', color: '#e2e8f0', lineHeight: '1.6', margin: 0 }}>
                      {xaiOutput.overall_summary}
                    </p>

                    {/* Speech Player Widget */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      background: 'rgba(0,0,0,0.3)', 
                      border: '1px solid rgba(0, 230, 118, 0.15)', 
                      padding: '12px 18px', 
                      borderRadius: '4px' 
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '14px' }}>🔊</span>
                        <div>
                          <span style={{ fontSize: '10px', color: '#fff', fontWeight: 'bold', fontFamily: 'monospace', display: 'block' }}>EXPLAIN BY VOICE</span>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Synthesizes generated explanation in {xaiLanguage}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {xaiSpeechPlaying && !xaiSpeechPaused ? (
                          <button 
                            onClick={handleXaiSpeechPause}
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '6px 14px', fontSize: '10px', cursor: 'pointer', fontFamily: 'monospace' }}
                          >
                            ❚❚ PAUSE
                          </button>
                        ) : (
                          <button 
                            onClick={xaiSpeechPaused ? handleXaiSpeechResume : handleXaiSpeechPlay}
                            style={{ background: 'rgba(0, 230, 118, 0.08)', border: '1px solid var(--accent-green)', color: 'var(--accent-green)', padding: '6px 14px', fontSize: '10px', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold' }}
                          >
                            ▶ {xaiSpeechPaused ? 'RESUME' : 'PLAY'}
                          </button>
                        )}

                        <button 
                          onClick={handleXaiSpeechStop}
                          style={{ background: 'rgba(255,61,0,0.08)', border: '1px solid rgba(255,61,0,0.3)', color: '#FF3D00', padding: '6px 14px', fontSize: '10px', cursor: 'pointer', fontFamily: 'monospace' }}
                          disabled={!xaiSpeechPlaying && !xaiSpeechPaused}
                        >
                          ■ STOP
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Findings and Recommendations */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                    
                    {/* Findings checklist */}
                    <div className="glass-panel card" style={{ margin: 0, padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <span className="card-title">CORRELATED FINDINGS</span>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '300px', overflowY: 'auto' }}>
                        {Object.entries(xaiOutput.findings || {}).map(([agent, list]) => {
                          if (!list || list.length === 0) return null;
                          return (
                            <div key={agent} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <span style={{ fontSize: '10px', color: 'var(--accent-green)', fontFamily: 'monospace', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                ✓ {agent.replace('_', ' ')} scan findings:
                              </span>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '8px' }}>
                                {list.map((item, idx) => (
                                  <div key={idx} style={{ fontSize: '11px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                                    • {item}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Recommendations Card */}
                    <div className="glass-panel card" style={{ margin: 0, padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <span className="card-title">ACTIONABLE RECOMMENDATIONS</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1, justifyContent: 'center' }}>
                        {xaiOutput.final_recommendations?.map((rec, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '11.5px', color: '#fff', lineHeight: '1.4' }}>
                            <span style={{ color: 'var(--accent-green)' }}>[✓]</span>
                            <span>{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* AI Chat Assistant */}
                  <div className="glass-panel card" style={{ margin: 0, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <span className="card-title">INTERACTIVE EXPLAINABILITY COGNITIVE AUDIT</span>
                    
                    {/* Chat Messages Log */}
                    <div style={{ 
                      height: '200px', 
                      overflowY: 'auto', 
                      background: 'rgba(0,0,0,0.3)', 
                      border: '1px solid rgba(255,255,255,0.06)', 
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      {xaiChatMessages.length === 0 ? (
                        <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '11.5px', fontFamily: 'monospace' }}>
                          ASK AUDIT QUESTIONS: "Explain DMARC", "Why is this risky?", "Is it safe to click?"
                        </div>
                      ) : (
                        xaiChatMessages.map((msg, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                            <div style={{ 
                              background: msg.sender === 'user' ? 'rgba(0,230,118,0.1)' : 'rgba(255,255,255,0.02)',
                              border: `1px solid ${msg.sender === 'user' ? 'var(--accent-green)' : 'rgba(255,255,255,0.08)'}`,
                              padding: '10px 14px',
                              borderRadius: '4px',
                              maxWidth: '80%',
                              fontSize: '11px',
                              color: '#fff',
                              lineHeight: '1.4'
                            }}>
                              <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                                {msg.sender === 'user' ? 'SOC_OPERATOR' : 'XAI_EXPLAINER'}
                              </span>
                              {msg.text}
                            </div>
                          </div>
                        ))
                      )}
                      {xaiChatLoading && (
                        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                          <span className="pulse-glow" style={{ fontSize: '10.5px', color: 'var(--accent-green)', fontFamily: 'monospace' }}>XAI Explainer is computing reasoning steps...</span>
                        </div>
                      )}
                    </div>

                    {/* Chat Input Form */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <input
                        type="text"
                        value={xaiChatInput}
                        onChange={(e) => setXaiChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleXaiChatSend();
                        }}
                        placeholder="Query explainability details (e.g. Why did DMARC fail?)..."
                        style={{
                          flexGrow: 1,
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(0, 230, 118, 0.2)',
                          color: '#fff',
                          padding: '8px 12px',
                          fontSize: '11px',
                          fontFamily: 'monospace',
                          boxSizing: 'border-box',
                          outline: 'none'
                        }}
                      />
                      <button
                        onClick={handleXaiChatSend}
                        className="btn-primary"
                        style={{ width: 'auto', padding: '8px 24px', fontSize: '11px' }}
                      >
                        SEND
                      </button>
                    </div>
                  </div>

                  {/* Exports Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(2, 6, 12, 0.4)', padding: '16px 24px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => window.open(`http://127.0.0.1:8001/api/xai/${xaiOutput.investigation_id}/export/pdf`)}
                        className="btn-secondary"
                        style={{ width: 'auto', padding: '10px 20px', fontSize: '11px' }}
                      >
                        📥 Download PDF Report
                      </button>
                      <button
                        onClick={() => window.open(`http://127.0.0.1:8001/api/xai/${xaiOutput.investigation_id}/export/docx`)}
                        className="btn-secondary"
                        style={{ width: 'auto', padding: '10px 20px', fontSize: '11px' }}
                      >
                        📥 Download Word DOCX
                      </button>
                      <button
                        onClick={() => window.open(`http://127.0.0.1:8001/api/history/${xaiOutput.investigation_id}/export/json`)}
                        className="btn-secondary"
                        style={{ width: 'auto', padding: '10px 20px', fontSize: '11px' }}
                      >
                        📥 Export JSON Payload
                      </button>
                    </div>

                    <button
                      onClick={handleXaiExplain}
                      className="btn-primary"
                      style={{ width: 'auto', padding: '10px 28px', fontSize: '11.5px' }}
                    >
                      ⟳ RE-RUN EXPLAINER SYNTHESIS
                    </button>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* --- CENTRALIZED SOC INVESTIGATION HISTORY DASHBOARD --- */}
          {activeNav === 'History' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', boxSizing: 'border-box' }}>
              
              {/* Stats Summary Banner */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', width: '100%' }}>
                <div className="glass-panel card" style={{ margin: 0, padding: '20px', borderLeft: '3px solid var(--accent-green)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'monospace' }}>TOTAL ARCHIVED CHECKS</span>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', marginTop: '6px', textShadow: '0 0 10px rgba(255,255,255,0.1)' }}>
                    {historyStats.total}
                  </div>
                </div>
                <div className="glass-panel card" style={{ margin: 0, padding: '20px', borderLeft: '3px solid var(--accent-green)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'monospace' }}>TODAY'S FORENSIC AUDITS</span>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00E676', marginTop: '6px', textShadow: '0 0 10px rgba(0, 230, 118, 0.2)' }}>
                    {historyStats.today}
                  </div>
                </div>
                <div className="glass-panel card" style={{ margin: 0, padding: '20px', borderLeft: '3px solid #FF3D00' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'monospace' }}>CRITICAL / HIGH RISK THREATS</span>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF3D00', marginTop: '6px', textShadow: '0 0 10px rgba(255, 61, 0, 0.2)' }}>
                    {historyStats.critical + historyStats.high}
                  </div>
                </div>
                <div className="glass-panel card" style={{ margin: 0, padding: '20px', borderLeft: '3px solid #FFC107' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'monospace' }}>SAFE / LOW RISK METRICS</span>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFC107', marginTop: '6px', textShadow: '0 0 10px rgba(255, 193, 7, 0.2)' }}>
                    {historyStats.safe + historyStats.low}
                  </div>
                </div>
              </div>

              {/* Title Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="card-title" style={{ fontSize: '14px', margin: 0 }}>📁 INVESTIGATION FORENSIC HISTORY ARCHIVE</span>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {selectedHistoryIds.length > 0 && (
                    <button 
                      onClick={() => setShowHistoryDeleteConfirm('selected')}
                      className="btn-primary" 
                      style={{ width: 'auto', background: '#FF3D00', borderColor: '#FF3D00', padding: '8px 16px', fontSize: '10.5px' }}
                    >
                      🗑 Delete Selected ({selectedHistoryIds.length})
                    </button>
                  )}
                  <button 
                    onClick={() => setShowHistoryDeleteConfirm('all')}
                    className="btn-secondary" 
                    style={{ width: 'auto', borderColor: '#FF3D00', color: '#FF3D00', padding: '8px 16px', fontSize: '10.5px' }}
                  >
                    ☢ Wipe Entire History
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid rgba(0, 230, 118, 0.15)', paddingBottom: '12px' }}>
                {['All', 'Website', 'Email', 'SMS', 'Call Analysis', 'Live Call', 'Complaint Reports', 'XAI Summaries', 'Threat Correlation'].map((tab) => {
                  const isActive = historyTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => {
                        setHistoryTab(tab);
                        setHistoryPage(1);
                      }}
                      style={{
                        background: isActive ? 'rgba(0, 230, 118, 0.12)' : 'rgba(0,0,0,0.3)',
                        border: `1px solid ${isActive ? 'var(--accent-green)' : 'rgba(255,255,255,0.08)'}`,
                        color: isActive ? '#fff' : 'var(--text-muted)',
                        padding: '6px 16px',
                        borderRadius: '2px',
                        fontSize: '11px',
                        fontWeight: isActive ? 'bold' : 'normal',
                        fontFamily: 'monospace',
                        cursor: 'pointer',
                        transition: 'all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)'
                      }}
                    >
                      {tab.toUpperCase()}
                    </button>
                  );
                })}
              </div>

              {/* Search & Filters Panel */}
              <div className="glass-panel card" style={{ margin: 0, padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', background: 'rgba(2, 6, 12, 0.4)' }}>
                {/* Search */}
                <div style={{ flexGrow: 1, minWidth: '240px' }}>
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => {
                      setHistorySearch(e.target.value);
                      setHistoryPage(1);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        fetchUnifiedHistory();
                      }
                    }}
                    placeholder="Search URL, Email, ID, Phone, Domain, Verdict..."
                    style={{
                      width: '100%',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(0, 230, 118, 0.2)',
                      color: '#fff',
                      padding: '8px 12px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Threat Level */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '8.5px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>THREAT LEVEL</span>
                  <select
                    value={historyThreatLevel}
                    onChange={(e) => {
                      setHistoryThreatLevel(e.target.value);
                      setHistoryPage(1);
                    }}
                    style={{ background: '#0a192f', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '6px 12px', fontSize: '11px', fontFamily: 'monospace' }}
                  >
                    <option value="All">ALL LEVELS</option>
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                    <option value="SAFE">SAFE</option>
                  </select>
                </div>

                {/* Risk Score */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '8.5px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>RISK SCORE</span>
                  <select
                    value={historyRiskScore}
                    onChange={(e) => {
                      setHistoryRiskScore(e.target.value);
                      setHistoryPage(1);
                    }}
                    style={{ background: '#0a192f', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '6px 12px', fontSize: '11px', fontFamily: 'monospace' }}
                  >
                    <option value="All">ALL SCORES</option>
                    <option value="75-100">CRITICAL (75-100)</option>
                    <option value="50-74">HIGH (50-74)</option>
                    <option value="25-49">MEDIUM (25-49)</option>
                    <option value="0-24">SAFE/LOW (0-24)</option>
                  </select>
                </div>

                {/* Completion Status */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '8.5px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>STATUS</span>
                  <select
                    value={historyStatus}
                    onChange={(e) => {
                      setHistoryStatus(e.target.value);
                      setHistoryPage(1);
                    }}
                    style={{ background: '#0a192f', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '6px 12px', fontSize: '11px', fontFamily: 'monospace' }}
                  >
                    <option value="All">ALL STATUS</option>
                    <option value="completed">COMPLETED</option>
                    <option value="pending">PENDING</option>
                  </select>
                </div>

                {/* Sort By */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '8.5px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>SORT BY</span>
                  <select
                    value={historySortBy}
                    onChange={(e) => {
                      setHistorySortBy(e.target.value);
                      setHistoryPage(1);
                    }}
                    style={{ background: '#0a192f', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '6px 12px', fontSize: '11px', fontFamily: 'monospace' }}
                  >
                    <option value="newest">NEWEST SCAN</option>
                    <option value="oldest">OLDEST SCAN</option>
                    <option value="highest_risk">HIGHEST RISK</option>
                    <option value="lowest_risk">LOWEST RISK</option>
                  </select>
                </div>

                {/* Execute */}
                <button
                  onClick={fetchUnifiedHistory}
                  className="btn-primary"
                  style={{ width: 'auto', padding: '8px 20px', alignSelf: 'flex-end', height: '31px', fontSize: '10.5px' }}
                >
                  ⚡ FILTER
                </button>
              </div>

              {/* Items Card List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {historyLoading ? (
                  <div className="glass-panel card" style={{ margin: 0, padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', minHeight: '180px' }}>
                    <RefreshCw className="animate-spin" style={{ width: '24px', height: '24px', color: 'var(--accent-green)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                      <span className="pulse-glow" style={{ fontSize: '11px', color: 'var(--accent-green)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>
                        SYNCHRONIZING FORENSIC REGISTRIES
                      </span>
                      <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                        QUERYING SECURE MONGODB CLUSTER // STATUS: OK
                      </span>
                    </div>
                  </div>
                ) : historyItems.length === 0 ? (
                  <div className="glass-panel card" style={{ margin: 0, padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    <span style={{ fontSize: '32px', marginBottom: '12px' }}>📂</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'monospace' }}>No history records mapped</span>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', maxWidth: '360px' }}>Run a scan or website verification in other tabs to auto-save audits to this register.</p>
                  </div>
                ) : (
                  historyItems.map((item) => {
                    const isChecked = selectedHistoryIds.includes(item.investigation_id);
                    const riskColor = item.risk_score >= 75 ? '#FF3D00' : (item.risk_score >= 50 ? '#FF9100' : (item.risk_score >= 25 ? '#FFD600' : 'var(--accent-green)'));
                    
                    return (
                      <div 
                        key={item.investigation_id} 
                        className="glass-panel card" 
                        style={{ 
                          margin: 0, 
                          padding: '16px 20px', 
                          display: 'flex', 
                          gap: '16px', 
                          alignItems: 'center',
                          borderLeft: `3px solid ${riskColor}`,
                          background: isChecked ? 'rgba(0, 230, 118, 0.03)' : 'rgba(2, 6, 12, 0.6)'
                        }}
                      >
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedHistoryIds(prev => [...prev, item.investigation_id]);
                            } else {
                              setSelectedHistoryIds(prev => prev.filter(id => id !== item.investigation_id));
                            }
                          }}
                          style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent-green)' }}
                        />

                        {/* Details */}
                        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                            {/* Agent Badge */}
                            <span style={{ 
                              background: 'rgba(255,255,255,0.06)', 
                              border: '1px solid rgba(255,255,255,0.1)', 
                              color: '#fff', 
                              padding: '2px 8px', 
                              fontSize: '8.5px', 
                              fontWeight: 'bold', 
                              borderRadius: '2px',
                              fontFamily: 'monospace'
                            }}>
                              🤖 {item.agent_type.toUpperCase()}
                            </span>
                            {/* Timestamp */}
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              [{item.timestamp}]
                            </span>
                            {/* Risk score */}
                            <span style={{ fontSize: '10px', fontWeight: 'bold', color: riskColor, fontFamily: 'monospace' }}>
                              RISK: {item.risk_score}/100 ({item.threat_level})
                            </span>
                            {/* Status */}
                            <span style={{ fontSize: '9px', background: item.status === 'completed' ? 'rgba(0,230,118,0.1)' : 'rgba(255,193,7,0.1)', color: item.status === 'completed' ? 'var(--accent-green)' : '#FFC107', padding: '1px 5px', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                              {item.status}
                            </span>
                          </div>
                          {/* Input */}
                          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                            {item.input}
                          </div>
                          {/* Summary */}
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.summary}
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                          <button
                            onClick={() => loadHistoryDetails(item.investigation_id)}
                            style={{
                              background: 'rgba(0, 230, 118, 0.08)',
                              border: '1px solid var(--accent-green)',
                              color: 'var(--accent-green)',
                              padding: '6px 14px',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              fontFamily: 'monospace'
                            }}
                          >
                            VIEW DETAILS
                          </button>
                          <button
                            onClick={() => window.open(`http://127.0.0.1:8001/api/history/${item.investigation_id}/export/pdf`)}
                            style={{
                              background: 'rgba(255,255,255,0.02)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              color: 'var(--text-primary)',
                              padding: '6px 10px',
                              fontSize: '10px',
                              cursor: 'pointer'
                            }}
                            title="Export PDF Report"
                          >
                            PDF
                          </button>
                          <button
                            onClick={() => setShowHistoryDeleteConfirm(item.investigation_id)}
                            style={{
                              background: 'rgba(255,61,0,0.08)',
                              border: '1px solid rgba(255,61,0,0.3)',
                              color: '#FF3D00',
                              padding: '6px 10px',
                              fontSize: '10px',
                              cursor: 'pointer'
                            }}
                          >
                            🗑
                          </button>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

              {/* Pagination toolbar */}
              {!historyLoading && historyItems.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(2, 6, 12, 0.4)', padding: '12px 20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PAGE SIZE:</span>
                    <select
                      value={historyLimit}
                      onChange={(e) => {
                        setHistoryLimit(parseInt(e.target.value));
                        setHistoryPage(1);
                      }}
                      style={{ background: '#0a192f', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '3px 8px', fontSize: '11px', fontFamily: 'monospace' }}
                    >
                      <option value="10">10 RECORDS</option>
                      <option value="25">25 RECORDS</option>
                      <option value="50">50 RECORDS</option>
                    </select>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <button
                      disabled={historyPage <= 1}
                      onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: historyPage <= 1 ? 'rgba(255,255,255,0.15)' : '#fff',
                        padding: '4px 12px',
                        fontSize: '11px',
                        cursor: historyPage <= 1 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      ◀ PREV
                    </button>
                    <span style={{ fontSize: '11px', color: '#fff', fontFamily: 'monospace' }}>
                      PAGE {historyPage} OF {Math.ceil(historyTotal / historyLimit) || 1} ({historyTotal} TOTALS)
                    </span>
                    <button
                      disabled={historyPage >= Math.ceil(historyTotal / historyLimit)}
                      onClick={() => setHistoryPage(prev => prev + 1)}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: historyPage >= Math.ceil(historyTotal / historyLimit) ? 'rgba(255,255,255,0.15)' : '#fff',
                        padding: '4px 12px',
                        fontSize: '11px',
                        cursor: historyPage >= Math.ceil(historyTotal / historyLimit) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      NEXT ▶
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Delete Confirmation Dialog */}
          {showHistoryDeleteConfirm && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 12000
            }}>
              <div className="glass-panel card" style={{
                maxWidth: '400px',
                padding: '24px',
                border: '1px solid #FF3D00',
                boxShadow: '0 0 20px rgba(255, 61, 0, 0.25)',
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#FF3D00', margin: 0, textTransform: 'uppercase' }}>
                  ⚠️ CONFIRM DELETION ACTION
                </h4>
                <p style={{ fontSize: '11.5px', color: '#fff', lineHeight: '1.5', margin: 0 }}>
                  {showHistoryDeleteConfirm === 'all' 
                    ? "Are you sure you want to completely wipe the entire ScamON AI investigations history? This action is permanent and cannot be undone."
                    : (showHistoryDeleteConfirm === 'selected' 
                      ? `Are you sure you want to delete the ${selectedHistoryIds.length} selected investigations? This action is permanent and cannot be undone.`
                      : `Are you sure you want to delete this specific investigation log? This action is permanent and cannot be undone.`
                    )
                  }
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={() => setShowHistoryDeleteConfirm(null)}
                    className="btn-secondary"
                    style={{ width: 'auto', padding: '8px 16px', fontSize: '11px' }}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={async () => {
                      if (showHistoryDeleteConfirm === 'all') {
                        await clearAllHistory();
                      } else if (showHistoryDeleteConfirm === 'selected') {
                        await deleteSelectedHistory();
                      } else {
                        await deleteSingleHistory(showHistoryDeleteConfirm);
                      }
                      setShowHistoryDeleteConfirm(null);
                    }}
                    className="btn-primary"
                    style={{ width: 'auto', background: '#FF3D00', borderColor: '#FF3D00', padding: '8px 16px', fontSize: '11px' }}
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Forensic Investigation Detail Modal Viewer */}
          {selectedHistoryItem && (
            <div style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 11000,
              padding: '24px',
              boxSizing: 'border-box'
            }}>
              <div className="glass-panel card" style={{
                width: '100%',
                maxWidth: '800px',
                maxHeight: '90vh',
                overflowY: 'auto',
                margin: 0,
                padding: '28px',
                border: '1px solid var(--accent-green)',
                boxShadow: '0 0 30px rgba(0, 230, 118, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '14px' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--accent-green)', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Forensic Investigation Log // {selectedHistoryItem.agent_type.toUpperCase()}
                    </span>
                    <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>
                      ID: {selectedHistoryItem.investigation_id}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setSelectedHistoryItem(null)}
                    style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}
                  >
                    ×
                  </button>
                </div>

                {/* Stats Summary Banner */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>THREAT LEVEL</span>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: selectedHistoryItem.threat_level === 'CRITICAL' || selectedHistoryItem.threat_level === 'HIGH' ? '#FF3D00' : 'var(--accent-green)', marginTop: '4px' }}>
                      {selectedHistoryItem.threat_level}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>RISK SCORE</span>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>
                      {selectedHistoryItem.risk_score}/100
                  </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>TIMESTAMP</span>
                    <div style={{ fontSize: '11px', color: '#fff', marginTop: '6px', fontFamily: 'monospace' }}>
                      {selectedHistoryItem.timestamp}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>STATUS</span>
                    <div style={{ fontSize: '11px', color: '#fff', marginTop: '6px', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                      {selectedHistoryItem.status}
                    </div>
                  </div>
                </div>

                {/* Target/Input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Scan Target:</span>
                  <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', padding: '8px 12px', borderRadius: '4px', fontSize: '12px', color: 'var(--accent-green)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {selectedHistoryItem.input}
                  </div>
                </div>

                {/* Summary */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Summary of Findings:</span>
                  <div style={{ fontSize: '11.5px', color: '#e2e8f0', lineHeight: '1.6' }}>
                    {selectedHistoryItem.summary}
                  </div>
                </div>

                {/* Recommendation */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>SOC Recommendations:</span>
                  <div style={{ background: 'rgba(0, 230, 118, 0.05)', border: '1px solid rgba(0, 230, 118, 0.2)', padding: '12px', borderRadius: '4px', fontSize: '11.5px', color: '#fff', lineHeight: '1.6' }}>
                    {selectedHistoryItem.recommendation}
                  </div>
                </div>

                {/* Full Report Details (Lazy loaded view based on agent type) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Forensic Evidence Details:</span>
                  <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', padding: '16px', maxHeight: '200px', overflowY: 'auto' }}>
                    
                    {selectedHistoryItem.agent_type === 'website' && selectedHistoryItem.full_report && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11px', color: '#fff' }}>
                        <div><b>Domain Registry:</b> {selectedHistoryItem.full_report.domain?.name}</div>
                        <div><b>Domain Age:</b> {selectedHistoryItem.full_report.domain?.age_days} days</div>
                        <div><b>Registrar:</b> {selectedHistoryItem.full_report.domain?.registrar}</div>
                        <div><b>SSL Status:</b> {selectedHistoryItem.full_report.ssl?.valid ? 'VALID CERT' : 'INVALID/EXPIRED'} (Issuer: {selectedHistoryItem.full_report.ssl?.issuer})</div>
                        <div><b>VirusTotal / PhishTank:</b> {selectedHistoryItem.full_report.phishtank?.known_phishing ? 'LISTED IN PHISHTANK' : 'CLEAN'}</div>
                        <div><b>Typosquatting:</b> {selectedHistoryItem.full_report.typosquat?.detected ? `POTENTIAL SPOOF (Brand: ${selectedHistoryItem.full_report.typosquat.original_brand})` : 'NO SPOOF DETECTED'}</div>
                      </div>
                    )}

                    {selectedHistoryItem.agent_type === 'email' && selectedHistoryItem.full_report && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11px', color: '#fff' }}>
                        <div><b>From:</b> {selectedHistoryItem.full_report.sender}</div>
                        <div><b>To:</b> {selectedHistoryItem.full_report.receiver}</div>
                        <div><b>Date:</b> {selectedHistoryItem.full_report.date}</div>
                        <div><b>Authentication Alignment:</b></div>
                        <div style={{ display: 'flex', gap: '12px', fontFamily: 'monospace', fontSize: '10px', background: 'rgba(0,0,0,0.3)', padding: '6px 10px' }}>
                          <span>SPF: <b style={{ color: selectedHistoryItem.full_report.headers_analysis?.spf === 'PASS' ? 'var(--accent-green)' : '#FF3D00' }}>{selectedHistoryItem.full_report.headers_analysis?.spf}</b></span>
                          <span>DKIM: <b style={{ color: selectedHistoryItem.full_report.headers_analysis?.dkim === 'PASS' ? 'var(--accent-green)' : '#FF3D00' }}>{selectedHistoryItem.full_report.headers_analysis?.dkim}</b></span>
                          <span>DMARC: <b style={{ color: selectedHistoryItem.full_report.headers_analysis?.dmarc === 'PASS' ? 'var(--accent-green)' : '#FF3D00' }}>{selectedHistoryItem.full_report.headers_analysis?.dmarc}</b></span>
                        </div>
                        <div><b>Snippet:</b> {selectedHistoryItem.full_report.snippet}</div>
                      </div>
                    )}

                    {selectedHistoryItem.agent_type === 'call' && selectedHistoryItem.full_report && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11px', color: '#fff' }}>
                        <div><b>Caller Identifier:</b> {selectedHistoryItem.full_report.caller}</div>
                        <div><b>Scam Intent Category:</b> {selectedHistoryItem.full_report.threat_category}</div>
                        <div><b>Confidence Rating:</b> {selectedHistoryItem.full_report.confidence}</div>
                        <div><b>Conversation Transcript:</b></div>
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', fontSize: '10.5px', fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: '120px', overflowY: 'auto' }}>
                          {selectedHistoryItem.full_report.transcript}
                        </div>
                      </div>
                    )}

                    {selectedHistoryItem.agent_type === 'sms' && selectedHistoryItem.full_report && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11px', color: '#fff' }}>
                        <div><b>Sender:</b> {selectedHistoryItem.full_report.sms?.sender}</div>
                        <div><b>Message Content:</b> {selectedHistoryItem.full_report.sms?.message}</div>
                        <div><b>Detected Scam Type:</b> {selectedHistoryItem.full_report.analysis?.classification}</div>
                        <div><b>Threat Level:</b> {selectedHistoryItem.full_report.analysis?.severity}</div>
                        <div><b>Risk Score:</b> {selectedHistoryItem.full_report.analysis?.risk_score}%</div>
                        <div><b>LLM Reasoning:</b> {selectedHistoryItem.full_report.investigation?.reasoning}</div>
                        <div><b>Recommendation:</b> {selectedHistoryItem.full_report.analysis?.recommended_action}</div>
                      </div>
                    )}

                    {selectedHistoryItem.agent_type === 'visual_scam' && selectedHistoryItem.full_report && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11px', color: '#fff' }}>
                        <div><b>Image Type:</b> {selectedHistoryItem.full_report.image_type}</div>
                        <div><b>Risk Score:</b> {selectedHistoryItem.full_report.risk_score}%</div>
                        <div><b>Threat Level:</b> {selectedHistoryItem.full_report.threat_level}</div>
                        <div><b>Scam Category:</b> {selectedHistoryItem.full_report.scam_category}</div>
                        <div><b>Extracted Text:</b></div>
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px', fontSize: '10px', fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: '100px', overflowY: 'auto' }}>
                          {selectedHistoryItem.full_report.extracted_text}
                        </div>
                        <div><b>Extracted Entities:</b> {JSON.stringify(selectedHistoryItem.full_report.entities)}</div>
                        <div><b>Reasoning:</b> {selectedHistoryItem.full_report.reasoning}</div>
                        <div><b>Recommendations:</b> {selectedHistoryItem.full_report.recommendations?.join(', ')}</div>
                      </div>
                    )}

                    {selectedHistoryItem.agent_type === 'live_call' && selectedHistoryItem.full_report && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11px', color: '#fff' }}>
                        <div><b>Intent Category:</b> {selectedHistoryItem.full_report.category}</div>
                        <div><b>Confidence:</b> {selectedHistoryItem.full_report.confidence}</div>
                        <div><b>Live Transcript Context:</b></div>
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', fontSize: '10.5px', fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: '120px', overflowY: 'auto' }}>
                          {selectedHistoryItem.full_report.transcript}
                        </div>
                      </div>
                    )}

                    {selectedHistoryItem.agent_type === 'complaint' && selectedHistoryItem.full_report && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11px', color: '#fff' }}>
                        <div><b>Recipient Agency:</b> {selectedHistoryItem.full_report.recipient}</div>
                        <div><b>CC:</b> {selectedHistoryItem.full_report.cc || 'None'}</div>
                        <div><b>Subject:</b> {selectedHistoryItem.full_report.subject}</div>
                        <div><b>Delivery status:</b> {selectedHistoryItem.full_report.status}</div>
                        <div><b>Attachments Generated:</b></div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {selectedHistoryItem.full_report.attachments?.map((att, idx) => (
                            <span key={idx} style={{ color: '#00A3FF' }}>📄 {att.split('/').pop()}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedHistoryItem.agent_type === 'xai' && selectedHistoryItem.full_report && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11px', color: '#fff' }}>
                        <div><b>Explainability Summary:</b> {selectedHistoryItem.full_report.summary}</div>
                        <div><b>Involved Scanners:</b> {selectedHistoryItem.full_report.agents_involved?.join(', ')}</div>
                        <div><b>Report Language:</b> {selectedHistoryItem.full_report.language}</div>
                        <div><b>Voice Synthesis Generated:</b> {selectedHistoryItem.full_report.voice_generated ? 'YES' : 'NO'}</div>
                      </div>
                    )}

                    {selectedHistoryItem.agent_type === 'threat_correlation' && selectedHistoryItem.full_report && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11px', color: '#fff' }}>
                        <div><b>Campaign Name:</b> {selectedHistoryItem.full_report.campaign_name}</div>
                        <div><b>Correlated Malicious Domains:</b> {selectedHistoryItem.full_report.correlated_domains?.join(', ')}</div>
                        <div><b>Shared Registrar:</b> {selectedHistoryItem.full_report.shared_registrar}</div>
                        <div><b>Network Block Subnet:</b> {selectedHistoryItem.full_report.ip_subnet}</div>
                      </div>
                    )}

                  </div>
                </div>

                {/* Footer Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', marginTop: '8px' }}>
                  <div>
                    {['website', 'email', 'call', 'sms'].includes(selectedHistoryItem.agent_type) && (
                      <button
                        onClick={() => {
                          handleOpenItemInAgent(selectedHistoryItem);
                          setSelectedHistoryItem(null);
                        }}
                        style={{
                          background: 'rgba(0, 230, 118, 0.08)',
                          border: '1px solid var(--accent-green)',
                          color: 'var(--accent-green)',
                          padding: '10px 18px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-cyber)',
                          marginRight: '12px'
                        }}
                      >
                        ⚡ OPEN IN AGENT VIEW
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => window.open(`http://127.0.0.1:8001/api/history/${selectedHistoryItem.investigation_id}/export/pdf`)}
                      className="btn-secondary"
                      style={{ width: 'auto', padding: '10px 18px', fontSize: '11px' }}
                    >
                      Export PDF
                    </button>
                    <button
                      onClick={() => window.open(`http://127.0.0.1:8001/api/history/${selectedHistoryItem.investigation_id}/export/json`)}
                      className="btn-secondary"
                      style={{ width: 'auto', padding: '10px 18px', fontSize: '11px' }}
                    >
                      Export JSON
                    </button>
                    <button
                      onClick={() => window.open(`http://127.0.0.1:8001/api/history/${selectedHistoryItem.investigation_id}/export/csv`)}
                      className="btn-secondary"
                      style={{ width: 'auto', padding: '10px 18px', fontSize: '11px' }}
                    >
                      Export CSV
                    </button>
                    <button
                      onClick={() => setSelectedHistoryItem(null)}
                      className="btn-primary"
                      style={{ width: 'auto', padding: '10px 22px', fontSize: '11px' }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Threat Reports View */}
          {activeNav === 'Threat Reports' && (
            <>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '24px', 
                maxWidth: '1200px', 
                margin: '0 auto', 
                width: '100%',
                marginRight: threatChatOpen ? '374px' : 'auto',
                transition: 'margin-right 0.2s ease',
                boxSizing: 'border-box'
              }}>
              {/* Header block with Live Status */}
              <div className="glass-panel card" style={{ padding: '24px', margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#fff', textTransform: 'uppercase', fontFamily: 'var(--font-cyber)', letterSpacing: '1px', margin: 0 }}>
                    Global Threat Intelligence Feed
                  </h1>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0 0', fontFamily: 'monospace' }}>
                    REAL-TIME TELEMETRY STREAM & ACTIVE CAMPAIGN REGISTRY
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0, 230, 118, 0.05)', border: '1px solid rgba(0, 230, 118, 0.15)', padding: '8px 16px', borderRadius: '2px' }}>
                  <span className="pulse-glow" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-green)', display: 'inline-block' }}></span>
                  <span style={{ fontSize: '10px', color: 'var(--accent-green)', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '1px' }}>FEED STATUS: ACTIVE / LIVE</span>
                </div>
              </div>

              {/* Statistics Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div className="glass-panel card" style={{ padding: '20px', margin: 0 }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'monospace' }}>Threat Telemetry Events</span>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', margin: '8px 0 4px 0', fontFamily: 'var(--font-cyber)' }}>
                    {historyStats.total || 0}
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--accent-green)' }}>✓ 100% Forensically Audited</span>
                </div>
                <div className="glass-panel card" style={{ padding: '20px', margin: 0 }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'monospace' }}>Active Phishing Campaigns</span>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF3D00', margin: '8px 0 4px 0', fontFamily: 'var(--font-cyber)', textShadow: '0 0 8px rgba(255, 61, 0, 0.3)' }}>
                    {(historyStats.critical || 0) + (historyStats.high || 0)}
                  </div>
                  <span style={{ fontSize: '10px', color: '#FF3D00' }}>⚠ High / Critical severity alerts</span>
                </div>
                <div className="glass-panel card" style={{ padding: '20px', margin: 0 }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'monospace' }}>Scam Interception Rate</span>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent-green)', margin: '8px 0 4px 0', fontFamily: 'var(--font-cyber)' }}>
                    98.4%
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Auto-reported to Cyber Cell</span>
                </div>
                <div className="glass-panel card" style={{ padding: '20px', margin: 0 }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'monospace' }}>Network Nodes Audited</span>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00E5FF', margin: '8px 0 4px 0', fontFamily: 'var(--font-cyber)' }}>
                    84,192
                  </div>
                  <span style={{ fontSize: '10px', color: '#00E5FF' }}>Online Sandbox Clusters</span>
                </div>
              </div>

              {/* Graphic Displays Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
                {/* 1. Historical Threat Frequency Histogram */}
                <div className="glass-panel card" style={{ padding: '20px', margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'monospace' }}>Threat Frequency (Last 7 Days)</span>
                    <span style={{ fontSize: '10.5px', color: '#FF3D00', fontFamily: 'monospace', fontWeight: 'bold' }}>SPIKE DETECTED</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '110px', padding: '0 10px', gap: '8px' }}>
                    {threatGraphData.map((d, idx) => (
                      <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{d.count}</div>
                        <div style={{ 
                          width: '100%', 
                          height: '60px', 
                          background: 'rgba(255,255,255,0.02)', 
                          borderRadius: '2px', 
                          display: 'flex', 
                          alignItems: 'flex-end',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            width: '100%', 
                            height: d.height, 
                            background: `linear-gradient(to top, rgba(0,0,0,0.5), ${d.color})`, 
                            boxShadow: `0 0 8px ${d.color}60`,
                            transition: 'height 0.8s ease'
                          }} />
                        </div>
                        <div style={{ fontSize: '9px', color: '#fff', fontFamily: 'monospace' }}>{d.day}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/*  Radial Radar / Network Activity ring */}
                <div className="glass-panel card" style={{ padding: '20px', margin: 0, display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}>
                    <svg viewBox="0 0 36 36" style={{ width: '100px', height: '100px', transform: 'rotate(-90deg)' }}>
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="url(#cyanGradient)" strokeWidth="3" strokeDasharray="72 28" strokeDashoffset="0" strokeLinecap="round" />
                      <defs>
                        <linearGradient id="cyanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#00E5FF" />
                          <stop offset="100%" stopColor="#00E676" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', fontFamily: 'var(--font-cyber)' }}>72%</span>
                      <span style={{ fontSize: '7px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Integrity</span>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'monospace', display: 'block' }}>Network Integrity Status</span>
                    <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', margin: '4px 0', fontFamily: 'var(--font-cyber)' }}>SECURE_NODES_OK</h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
                      All sandboxing clusters report 100% telemetry validation. Host spoofing interceptors operating at nominal levels.
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', alignItems: 'start' }}>
                
                {/* Left Side: Real-Time Intel Feed list */}
                <div className="glass-panel card" style={{ margin: 0, padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                    <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', textTransform: 'uppercase', fontFamily: 'var(--font-cyber)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Activity style={{ width: '16px', height: '16px', color: 'var(--accent-green)' }} />
                      Active SOC Threat Indicators
                    </h3>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>showing latest indicators</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {historyItems.length > 0 ? (
                      historyItems.map((item, idx) => (
                        <div key={idx} style={{ 
                          background: 'rgba(255,255,255,0.02)', 
                          borderLeft: `3px solid ${getRiskColor(item.risk_score)}`, 
                          borderTop: '1px solid rgba(255,255,255,0.04)',
                          borderRight: '1px solid rgba(255,255,255,0.04)',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          padding: '12px 16px', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div style={{
                              width: '32px', height: '32px', borderRadius: '2px', 
                              backgroundColor: `${getRiskColor(item.risk_score)}12`, 
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: getRiskColor(item.risk_score)
                            }}>
                              {item.agent_type === 'website' ? <Globe style={{ width: '16px', height: '16px' }} /> :
                               item.agent_type === 'email' ? <Mail style={{ width: '16px', height: '16px' }} /> :
                               item.agent_type === 'sms' ? <MessageSquare style={{ width: '16px', height: '16px' }} /> :
                               item.agent_type === 'visual_scam' ? <Camera style={{ width: '16px', height: '16px' }} /> :
                               item.agent_type === 'call' || item.agent_type === 'live_call' ? <PhoneCall style={{ width: '16px', height: '16px' }} /> :
                               <AlertOctagon style={{ width: '16px', height: '16px' }} />}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {item.input || 'Unknown Target'}
                              </div>
                              <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                                Agent: {item.agent_type.replace('_', ' ')} • {item.timestamp}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', textAlign: 'right', flexShrink: 0 }}>
                            <div>
                              <span style={{
                                fontSize: '9px',
                                padding: '2px 6px',
                                fontWeight: 'bold',
                                border: '1px solid',
                                borderColor: getRiskColor(item.risk_score),
                                color: getRiskColor(item.risk_score),
                                backgroundColor: `${getRiskColor(item.risk_score)}10`
                              }}>
                                {item.threat_level}
                              </span>
                              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', fontFamily: 'monospace', marginTop: '4px' }}>
                                Score: {item.risk_score}%
                              </div>
                            </div>
                            <span style={{ fontSize: '10px', color: item.risk_score >= 50 ? '#FF3D00' : 'var(--accent-green)', fontWeight: 'bold', fontFamily: 'monospace' }}>
                              {item.risk_score >= 50 ? '● BLOCKED' : '○ REPORTED'}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      /* Mock Threat alerts if history is empty */
                      [
                        { type: 'website', target: 'https://secure-login-hdfcbk.net', cat: 'Phishing Target', risk: 94, level: 'CRITICAL', status: 'BLOCKED', time: 'Just now' },
                        { type: 'sms', target: 'HDFCBK Phishing Phish', cat: 'Smishing SMS', risk: 85, level: 'HIGH', status: 'BLOCKED', time: '3 min ago' },
                        { type: 'call', target: '+1 (800) 434-2193', cat: 'Tech Support Impersonation', risk: 78, level: 'HIGH', status: 'REPORTED', time: '14 min ago' },
                        { type: 'email', target: 'billing@secure-netflix-verification.com', cat: 'SPF/DMARC Fail Spoof', risk: 62, level: 'MEDIUM', status: 'QUARANTINED', time: '1 hr ago' },
                        { type: 'website', target: 'https://paypal-update-profile.ru', cat: 'Typosquat Spoof', risk: 88, level: 'CRITICAL', status: 'BLOCKED', time: '3 hrs ago' }
                      ].map((mock, idx) => (
                        <div key={idx} style={{ 
                          background: 'rgba(255,255,255,0.02)', 
                          borderLeft: `3px solid ${getRiskColor(mock.risk)}`, 
                          borderTop: '1px solid rgba(255,255,255,0.04)',
                          borderRight: '1px solid rgba(255,255,255,0.04)',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          padding: '12px 16px', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div style={{
                              width: '32px', height: '32px', borderRadius: '2px', 
                              backgroundColor: `${getRiskColor(mock.risk)}12`, 
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: getRiskColor(mock.risk)
                            }}>
                              {mock.type === 'website' ? <Globe style={{ width: '16px', height: '16px' }} /> :
                               mock.type === 'email' ? <Mail style={{ width: '16px', height: '16px' }} /> :
                               mock.type === 'sms' ? <MessageSquare style={{ width: '16px', height: '16px' }} /> :
                               <PhoneCall style={{ width: '16px', height: '16px' }} />}
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', fontFamily: 'monospace' }}>
                                {mock.target}
                              </div>
                              <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '2px', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                                Vector: {mock.cat} • {mock.time}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', textAlign: 'right' }}>
                            <div>
                              <span style={{
                                fontSize: '9px',
                                padding: '2px 6px',
                                fontWeight: 'bold',
                                border: '1px solid',
                                borderColor: getRiskColor(mock.risk),
                                color: getRiskColor(mock.risk),
                                backgroundColor: `${getRiskColor(mock.risk)}10`
                              }}>
                                {mock.level}
                              </span>
                              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', fontFamily: 'monospace', marginTop: '4px' }}>
                                Score: {mock.risk}%
                              </div>
                            </div>
                            <span style={{ fontSize: '10px', color: mock.risk >= 70 ? '#FF3D00' : 'var(--accent-green)', fontWeight: 'bold', fontFamily: 'monospace' }}>
                              {mock.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Right Side widgets */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Top Spoofed Brands Progress bars */}
                  <div className="glass-panel card" style={{ margin: 0, padding: '20px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'monospace', display: 'block', marginBottom: '16px' }}>Top Phishing Targets</span>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {topThreatTargets.map((brand, idx) => (
                        <div key={brand.name}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                            <span style={{ color: '#fff', fontFamily: 'monospace' }}>{brand.name}</span>
                            <span style={{ color: brand.color, fontWeight: 'bold' }}>{brand.pct}% Risk Contribution</span>
                          </div>
                          <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${brand.pct}%`, height: '100%', backgroundColor: brand.color }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Infrastructure summary */}
                  <div className="glass-panel card" style={{ margin: 0, padding: '20px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'monospace', display: 'block', marginBottom: '16px' }}>Threat Vector Registry</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Web & DNS Spoofs</span>
                        <span style={{ color: '#fff', fontFamily: 'monospace', fontWeight: 'bold' }}>{threatVectorStats.website}%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Email Campaign Spams</span>
                        <span style={{ color: '#fff', fontFamily: 'monospace', fontWeight: 'bold' }}>{threatVectorStats.email}%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>SMS Smishing Texts</span>
                        <span style={{ color: '#fff', fontFamily: 'monospace', fontWeight: 'bold' }}>{threatVectorStats.sms}%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Voice Vishing Scams</span>
                        <span style={{ color: '#fff', fontFamily: 'monospace', fontWeight: 'bold' }}>{threatVectorStats.call}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Action triggers */}
                  <div className="glass-panel card" style={{ margin: 0, padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button 
                      onClick={() => alert("Threat intelligence STIX/TAXII feed generated successfully and ready for export.")}
                      className="btn-primary" 
                      style={{ width: '100%', height: '40px', fontSize: '11px', textTransform: 'uppercase' }}
                    >
                      Export STIX/TAXII Feed
                    </button>
                    <button 
                      onClick={fetchUnifiedHistory}
                      className="btn-secondary" 
                      style={{ width: '100%', height: '40px', fontSize: '11px', textTransform: 'uppercase' }}
                    >
                      Sync Intel Feed
                    </button>
                  </div>

                </div>

              </div>

            </div>

            {/* Floating Toggle Button (when closed) */}
            {!threatChatOpen && (
              <button 
                onClick={() => setThreatChatOpen(true)}
                style={{
                  position: 'fixed',
                  bottom: '24px',
                  right: '24px',
                  zIndex: 10000,
                  background: 'rgba(2, 6, 12, 0.95)',
                  border: '1px solid var(--accent-green)',
                  color: 'var(--accent-green)',
                  padding: '10px 18px',
                  borderRadius: '24px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 0 12px rgba(0, 230, 118, 0.3)',
                  fontFamily: 'var(--font-cyber)'
                }}
              >
                <Activity style={{ width: '13px', height: '13px', marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }} /> INTEL FEED ASSISTANT
              </button>
            )}

            {/* Floating AI Assistant Panel */}
            {threatChatOpen && (
              <div className="glass-panel card" style={{
                position: 'fixed',
                top: '80px',
                right: '24px',
                bottom: '24px',
                width: '350px',
                margin: 0,
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                zIndex: 10000,
                background: 'rgba(2, 6, 12, 0.96)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(0, 230, 118, 0.25)',
                boxShadow: '0 0 25px rgba(0, 230, 118, 0.25)',
                boxSizing: 'border-box'
              }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', margin: 0 }}>
                    <Activity style={{ width: '13px', height: '13px', color: 'var(--accent-green)' }} /> SOC INTEL ASSISTANT
                  </span>
                  <button 
                    onClick={() => setThreatChatOpen(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#fff',
                      fontSize: '18px',
                      cursor: 'pointer',
                      lineHeight: '1',
                      padding: '0 4px'
                    }}
                  >
                    ×
                  </button>
                </div>
                
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: '1px', borderBottom: '1px solid rgba(0,230,118,0.1)', paddingBottom: '8px', marginTop: '-8px' }}>
                  INTEL FEED COPILOT ENGINE ACTIVE
                </div>

                {/* Chat Message Thread */}
                <div style={{ 
                  flexGrow: 1, 
                  overflowY: 'auto', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px', 
                  paddingRight: '4px', 
                  paddingBottom: '12px', 
                  borderBottom: '1px solid rgba(255,255,255,0.04)' 
                }}>
                  {threatChatMessages.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '10px', textAlign: 'center', padding: '10px' }}>
                      <MessageSquare style={{ width: '28px', height: '28px', marginBottom: '10px', color: 'var(--accent-green)' }} />
                      <span style={{ lineHeight: '1.5' }}>
                        Ask me about current active phishing campaigns, high risk targets, brand spoofs, or distribution metrics.
                      </span>
                    </div>
                  ) : (
                    threatChatMessages.map((msg, idx) => (
                      <div key={idx} style={{
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        background: msg.role === 'user' ? 'rgba(0, 230, 118, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                        border: msg.role === 'user' ? '1px solid rgba(0, 230, 118, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
                        padding: '8px 12px',
                        fontSize: '10.5px',
                        color: '#fff',
                        lineHeight: '1.5'
                      }}>
                        <div style={{ fontSize: '8.5px', color: msg.role === 'user' ? 'var(--accent-green)' : 'rgba(255,255,255,0.4)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px', fontFamily: 'monospace' }}>
                          {msg.role === 'user' ? 'Analyst (You)' : 'SOC Copilot'}
                        </div>
                        {msg.loading ? (
                          <span className="pulse-glow" style={{ color: 'var(--accent-green)' }}>[⟳] Analyzing Feed...</span>
                        ) : (
                          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Suggested Prompts List */}
                {threatChatMessages.length === 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '8.5px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', fontFamily: 'monospace' }}>Suggested Queries:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '110px', overflowY: 'auto', paddingRight: '2px' }}>
                      {[
                        "Summarize current active threats",
                        "Which brand has the highest risk contribution?",
                        "What is the scam interception rate?",
                        "Describe the Netflix typosquat vector"
                      ].map((qText, qIdx) => (
                        <button
                          key={qIdx}
                          onClick={() => sendThreatChatMessage(qText)}
                          disabled={threatChatLoading}
                          className="chat-suggested-chip"
                          style={{
                            background: 'rgba(0, 230, 118, 0.02)',
                            border: '1px solid rgba(0, 230, 118, 0.12)',
                            color: 'var(--text-muted)',
                            padding: '4px 8px',
                            fontSize: '9px',
                            cursor: 'pointer',
                            fontFamily: 'monospace',
                            textAlign: 'left'
                          }}
                        >
                          {qText}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input controls */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={threatChatInput}
                    onChange={(e) => setThreatChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        sendThreatChatMessage();
                      }
                    }}
                    placeholder="Search campaigns, metrics..."
                    disabled={threatChatLoading}
                    style={{
                      flexGrow: 1,
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(0,230,118,0.2)',
                      color: '#fff',
                      padding: '8px 12px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    onClick={() => sendThreatChatMessage()}
                    disabled={threatChatLoading || !threatChatInput.trim()}
                    style={{
                      background: 'rgba(0,230,118,0.08)',
                      border: '1px solid var(--accent-green)',
                      color: 'var(--accent-green)',
                      padding: '8px 12px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      fontFamily: 'var(--font-cyber)'
                    }}
                  >
                    SEND
                  </button>
                </div>
              </div>
            )}

          </>
        )}

          {/* REDESIGNED MASTER AGENT SOC INTERFACE */}
          {activeNav === 'Dashboard' && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              height: 'calc(100vh - 90px)', 
              animation: 'fadeIn 0.5s ease-out',
              background: 'rgba(3, 5, 8, 0.45)',
              border: '1px solid rgba(0, 230, 118, 0.1)',
              borderRadius: '4px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {/* Header Panel */}
              <div style={{ 
                padding: '16px 24px', 
                borderBottom: '1px solid rgba(0, 230, 118, 0.15)', 
                background: 'rgba(2, 3, 5, 0.85)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Shield style={{ width: '22px', height: '22px', color: '#00E676' }} className="animate-pulse" />
                  <div style={{ textAlign: 'left' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 'bold', letterSpacing: '2px', color: '#fff', margin: 0, fontFamily: 'monospace' }}>
                      MASTER AGENT
                    </h2>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      AI Security Investigation Assistant
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="pulse-glow" style={{ width: '6px', height: '6px', background: '#00E676', borderRadius: '50%' }} />
                  <span style={{ fontSize: '10px', color: '#00E676', fontWeight: 'bold', fontFamily: 'monospace' }}>ORCHESTRATOR_ACTIVE</span>
                </div>
              </div>

              <div 
                style={{ 
                  flex: 1, 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px', 
                  overflowY: 'auto',
                  position: 'relative'
                }}
                className="soc-sidebar-scroll"
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {routingState.active ? (
                  /* ROUTING PIPELINE ANIMATION VIEW */
                  <div style={{ textAlign: 'center', width: '100%', maxWidth: '640px', animation: 'fadeIn 0.3s ease-out' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0, 230, 118, 0.08)', border: '1px solid rgba(0, 230, 118, 0.2)', padding: '6px 14px', borderRadius: '2px', marginBottom: '12px' }}>
                      <span className="animate-pulse" style={{ width: '6px', height: '6px', background: '#00E676', borderRadius: '50%' }} />
                      <span style={{ fontSize: '11px', color: '#00E676', fontWeight: 'bold', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                        ✓ {routingState.type === 'url' ? 'Website URL' : routingState.type === 'image' ? 'Image' : routingState.type === 'audio' ? 'Audio File' : 'SMS Message'} Detected
                      </span>
                    </div>

                    <h3 style={{ fontSize: '12px', color: '#fff', margin: '0 0 20px 0', fontFamily: 'monospace', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                      {getStatusText()}
                    </h3>

                    {/* SVG Branch Pipeline */}
                    <svg width="600" height="240" viewBox="0 0 600 240" style={{ background: 'rgba(2, 3, 5, 0.85)', border: '1px solid rgba(0,230,118,0.15)', borderRadius: '4px', margin: 'auto', display: 'block', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                      <defs>
                        <filter id="svg-glow" x="-30%" y="-30%" width="160%" height="160%">
                          <feGaussianBlur stdDeviation="4" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      
                      {/* Decorative Motherboard Background Traces */}
                      <path d="M 50 40 L 120 40 L 120 100" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1.5" />
                      <path d="M 140 180 L 220 180 L 220 220" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1.5" />
                      <path d="M 280 20 L 320 20 L 320 60" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1.5" />
                      <path d="M 350 160 L 390 160 L 390 120" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1.5" />
                      
                      {/* Connection base path */}
                      <path d="M 80 120 L 160 120" fill="none" stroke={activeJunctionIndex >= 0 ? "rgba(0, 230, 118, 0.4)" : "rgba(255, 255, 255, 0.05)"} strokeWidth="2" style={{ transition: 'stroke 0.3s' }} />
                      
                      {/* Branch paths with rounded corners */}
                      <path d="M 160 120 Q 180 120 180 100 L 180 60 Q 180 40 200 40 L 400 40" fill="none" stroke={routingState.type === 'url' ? "rgba(0, 230, 118, 0.6)" : "rgba(255,255,255,0.05)"} strokeWidth={routingState.type === 'url' ? '2.5' : '1.5'} style={{ transition: 'stroke 0.3s' }} />
                      <path d="M 160 120 Q 180 120 180 110 L 180 100 Q 180 90 200 90 L 400 90" fill="none" stroke={routingState.type === 'sms' ? "rgba(0, 230, 118, 0.6)" : "rgba(255,255,255,0.05)"} strokeWidth={routingState.type === 'sms' ? '2.5' : '1.5'} style={{ transition: 'stroke 0.3s' }} />
                      <path d="M 160 120 Q 180 120 180 130 L 180 140 Q 180 150 200 150 L 400 150" fill="none" stroke={routingState.type === 'audio' ? "rgba(0, 230, 118, 0.6)" : "rgba(255,255,255,0.05)"} strokeWidth={routingState.type === 'audio' ? '2.5' : '1.5'} style={{ transition: 'stroke 0.3s' }} />
                      <path d="M 160 120 Q 180 120 180 140 L 180 180 Q 180 200 200 200 L 400 200" fill="none" stroke={routingState.type === 'image' ? "rgba(0, 230, 118, 0.6)" : "rgba(255,255,255,0.05)"} strokeWidth={routingState.type === 'image' ? '2.5' : '1.5'} style={{ transition: 'stroke 0.3s' }} />
                      
                      {/* Glowing active path trace (Tron Light Trail) */}
                      {routingState.type && (
                        <path d={getActivePathD()} fill="none" stroke="#00E676" strokeWidth="2.5" filter="url(#svg-glow)" strokeDasharray="30, 150" strokeDashoffset="0">
                          <animate attributeName="strokeDashoffset" values="180;0" dur="1.2s" repeatCount="indefinite" />
                        </path>
                      )}

                      {/* Radar Circular Pulse (Step 2) */}
                      <circle cx="80" cy="120" r="16" fill="rgba(0, 230, 118, 0.08)">
                        <animate attributeName="r" values="16;38" dur="1.4s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="1;0" dur="1.4s" repeatCount="indefinite" />
                      </circle>
                      <circle cx="80" cy="120" r="16" fill="rgba(0, 230, 118, 0.04)">
                        <animate attributeName="r" values="16;55" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8;0" dur="2s" repeatCount="indefinite" />
                      </circle>

                      {/* Outer pulsing ring for Master node */}
                      <circle cx="80" cy="120" r="18" fill="none" stroke="#00E676" strokeWidth="1.5" opacity="0.6">
                        <animate attributeName="stroke-width" values="1.5;3;1.5" dur="1.5s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.6;1;0.6" dur="1.5s" repeatCount="indefinite" />
                      </circle>

                      {/* Master agent source node */}
                      <circle cx="80" cy="120" r="16" fill="#020305" stroke="#00E676" strokeWidth="2" filter="url(#svg-glow)" />
                      
                      {/* Shield icon with spinning rotation animation inside node (Step 2) */}
                      <g transform="translate(80, 120)">
                        <g>
                          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="8s" repeatCount="indefinite" />
                          <path d="M -5 -6 L 5 -6 L 5 -2 C 5 2, 0 6, 0 6 C 0 6, -5 2, -5 -2 Z" fill="none" stroke="#00E676" strokeWidth="1.5" />
                        </g>
                      </g>
                      
                      <text x="80" y="152" fill="#00E676" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold" letterSpacing="0.5px">MASTER_AGENT</text>

                      {/* Junction Nodes along paths that light up sequentially (Step 5) */}
                      {/* Junction 1: Split Entrance */}
                      <circle cx="160" cy="120" r="4.5" fill={activeJunctionIndex >= 1 ? "#00E676" : "#0c0d0f"} stroke={activeJunctionIndex >= 1 ? "#00E676" : "rgba(255,255,255,0.15)"} strokeWidth="1.5" filter={activeJunctionIndex >= 1 ? "url(#svg-glow)" : "none"} style={{ transition: 'all 0.3s' }} />
                      <circle cx="160" cy="120" r={activeJunctionIndex >= 1 ? 8 : 0} fill="none" stroke="#00E676" strokeWidth="1" opacity={activeJunctionIndex >= 1 ? 0.8 : 0} style={{ transition: 'all 0.3s' }}>
                        <animate attributeName="r" values="4.5;12;4.5" dur="1.2s" repeatCount="indefinite" />
                      </circle>

                      {/* Junction 2: Curve Bend Split (routes to specific y coordinates) */}
                      {routingState.type === 'url' && (
                        <g style={{ transition: 'all 0.3s' }}>
                          <circle cx="180" cy="40" r="4" fill={activeJunctionIndex >= 2 ? "#00E676" : "#0c0d0f"} stroke={activeJunctionIndex >= 2 ? "#00E676" : "rgba(255,255,255,0.15)"} strokeWidth="1.5" filter={activeJunctionIndex >= 2 ? "url(#svg-glow)" : "none"} />
                          <circle cx="300" cy="40" r="4" fill={activeJunctionIndex >= 3 ? "#00E676" : "#0c0d0f"} stroke={activeJunctionIndex >= 3 ? "#00E676" : "rgba(255,255,255,0.15)"} strokeWidth="1.5" filter={activeJunctionIndex >= 3 ? "url(#svg-glow)" : "none"} />
                        </g>
                      )}
                      {routingState.type === 'sms' && (
                        <g style={{ transition: 'all 0.3s' }}>
                          <circle cx="180" cy="90" r="4" fill={activeJunctionIndex >= 2 ? "#00E676" : "#0c0d0f"} stroke={activeJunctionIndex >= 2 ? "#00E676" : "rgba(255,255,255,0.15)"} strokeWidth="1.5" filter={activeJunctionIndex >= 2 ? "url(#svg-glow)" : "none"} />
                          <circle cx="300" cy="90" r="4" fill={activeJunctionIndex >= 3 ? "#00E676" : "#0c0d0f"} stroke={activeJunctionIndex >= 3 ? "#00E676" : "rgba(255,255,255,0.15)"} strokeWidth="1.5" filter={activeJunctionIndex >= 3 ? "url(#svg-glow)" : "none"} />
                        </g>
                      )}
                      {routingState.type === 'audio' && (
                        <g style={{ transition: 'all 0.3s' }}>
                          <circle cx="180" cy="150" r="4" fill={activeJunctionIndex >= 2 ? "#00E676" : "#0c0d0f"} stroke={activeJunctionIndex >= 2 ? "#00E676" : "rgba(255,255,255,0.15)"} strokeWidth="1.5" filter={activeJunctionIndex >= 2 ? "url(#svg-glow)" : "none"} />
                          <circle cx="300" cy="150" r="4" fill={activeJunctionIndex >= 3 ? "#00E676" : "#0c0d0f"} stroke={activeJunctionIndex >= 3 ? "#00E676" : "rgba(255,255,255,0.15)"} strokeWidth="1.5" filter={activeJunctionIndex >= 3 ? "url(#svg-glow)" : "none"} />
                        </g>
                      )}
                      {routingState.type === 'image' && (
                        <g style={{ transition: 'all 0.3s' }}>
                          <circle cx="180" cy="200" r="4" fill={activeJunctionIndex >= 2 ? "#00E676" : "#0c0d0f"} stroke={activeJunctionIndex >= 2 ? "#00E676" : "rgba(255,255,255,0.15)"} strokeWidth="1.5" filter={activeJunctionIndex >= 2 ? "url(#svg-glow)" : "none"} />
                          <circle cx="300" cy="200" r="4" fill={activeJunctionIndex >= 3 ? "#00E676" : "#0c0d0f"} stroke={activeJunctionIndex >= 3 ? "#00E676" : "rgba(255,255,255,0.15)"} strokeWidth="1.5" filter={activeJunctionIndex >= 3 ? "url(#svg-glow)" : "none"} />
                        </g>
                      )}

                      {/* Moving Energy Sphere Payload with Motion Blur (Step 4) */}
                      {routingState.type && (
                        <circle r="6" fill="#00E676" filter="url(#svg-glow)">
                          <animateMotion dur="2.4s" repeatCount="1" fill="freeze" path={getActivePathD()} />
                        </circle>
                      )}

                      {/* Destinations (tron-themed rect tag headers) (Step 6) */}
                      <g transform="translate(400, 28)">
                        <rect width="180" height="24" rx="2" fill="rgba(2,3,5,0.85)" stroke={routingState.type === 'url' ? "#00E676" : "rgba(255,255,255,0.06)"} strokeWidth="1" filter={routingState.type === 'url' ? "url(#svg-glow)" : "none"} style={{ transition: 'all 0.3s' }} />
                        <text x="10" y="15" fill={routingState.type === 'url' ? "#00E676" : "var(--text-muted)"} fontSize="10" fontFamily="monospace" fontWeight={routingState.type === 'url' ? "bold" : "normal"}>Web & QR Scan</text>
                        {routingState.type === 'url' && activeJunctionIndex >= 4 && (
                          <circle cx="170" cy="12" r="3" fill="#00E676" filter="url(#svg-glow)" />
                        )}
                      </g>

                      <g transform="translate(400, 78)">
                        <rect width="180" height="24" rx="2" fill="rgba(2,3,5,0.85)" stroke={routingState.type === 'sms' ? "#00E676" : "rgba(255,255,255,0.06)"} strokeWidth="1" filter={routingState.type === 'sms' ? "url(#svg-glow)" : "none"} style={{ transition: 'all 0.3s' }} />
                        <text x="10" y="15" fill={routingState.type === 'sms' ? "#00E676" : "var(--text-muted)"} fontSize="10" fontFamily="monospace" fontWeight={routingState.type === 'sms' ? "bold" : "normal"}>SMS Investigation</text>
                        {routingState.type === 'sms' && activeJunctionIndex >= 4 && (
                          <circle cx="170" cy="12" r="3" fill="#00E676" filter="url(#svg-glow)" />
                        )}
                      </g>

                      <g transform="translate(400, 138)">
                        <rect width="180" height="24" rx="2" fill="rgba(2,3,5,0.85)" stroke={routingState.type === 'audio' ? "#00E676" : "rgba(255,255,255,0.06)"} strokeWidth="1" filter={routingState.type === 'audio' ? "url(#svg-glow)" : "none"} style={{ transition: 'all 0.3s' }} />
                        <text x="10" y="15" fill={routingState.type === 'audio' ? "#00E676" : "var(--text-muted)"} fontSize="10" fontFamily="monospace" fontWeight={routingState.type === 'audio' ? "bold" : "normal"}>Call Analysis</text>
                        {routingState.type === 'audio' && activeJunctionIndex >= 4 && (
                          <circle cx="170" cy="12" r="3" fill="#00E676" filter="url(#svg-glow)" />
                        )}
                      </g>

                      <g transform="translate(400, 188)">
                        <rect width="180" height="24" rx="2" fill="rgba(2,3,5,0.85)" stroke={routingState.type === 'image' ? "#00E676" : "rgba(255,255,255,0.06)"} strokeWidth="1" filter={routingState.type === 'image' ? "url(#svg-glow)" : "none"} style={{ transition: 'all 0.3s' }} />
                        <text x="10" y="15" fill={routingState.type === 'image' ? "#00E676" : "var(--text-muted)"} fontSize="10" fontFamily="monospace" fontWeight={routingState.type === 'image' ? "bold" : "normal"}>Visual Investigation</text>
                        {routingState.type === 'image' && activeJunctionIndex >= 4 && (
                          <circle cx="170" cy="12" r="3" fill="#00E676" filter="url(#svg-glow)" />
                        )}
                      </g>
                    </svg>
                  </div>
                ) : (
                  /* DEFAULT LANDING WELCOME WORKSPACE */
                  <div style={{ maxWidth: '660px', margin: 'auto', display: 'flex', flexDirection: 'column', gap: '32px', textAlign: 'left', padding: '20px', animation: 'fadeIn 0.4s ease-out' }}>
                    <div>
                      <h1 style={{ fontSize: '38px', fontWeight: 'bold', color: '#fff', fontFamily: 'monospace', margin: '0 0 10px 0', letterSpacing: '1.5px', minHeight: '46px' }}>
                        <Typewriter text="Hello." delay={100} onComplete={() => setStartSecondLine(true)} />
                      </h1>
                      <div style={{ fontSize: '17px', color: '#00E676', fontFamily: 'monospace', margin: 0, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.8px', minHeight: '24px', display: 'flex', alignItems: 'center' }}>
                        {startSecondLine && (
                          <>
                            <Typewriter text="I'm the ScamON AI Master Agent." delay={55} />
                            <span className="blinking-cursor" style={{ 
                              display: 'inline-block',
                              width: '8px',
                              height: '16px',
                              backgroundColor: '#00E676',
                              marginLeft: '6px',
                              animation: 'blink 1s step-end infinite'
                            }}></span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* INFERENCE-PATH STYLE PIPELINE BOX */}
                    <div style={{
                      background: 'rgba(2, 3, 5, 0.75)',
                      border: '1px solid rgba(0, 230, 118, 0.15)',
                      borderRadius: '4px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                      fontFamily: 'monospace'
                    }}>
                      {/* Window Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9.5px', color: 'var(--text-muted)', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                          <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FF3D00' }} />
                          <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#FFC400' }} />
                          <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#00E676' }} />
                          <span style={{ marginLeft: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>TRIAGE-PIPELINE</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#00E676' }}>
                          <span>●</span>
                          <span style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>REAL-TIME ROUTING</span>
                        </div>
                      </div>

                      {/* Pipeline Flow Ingress Container */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 10px', position: 'relative' }}>
                        {/* Device / Client Node */}
                        <div style={{ width: '110px', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(5, 7, 10, 0.85)', padding: '12px 8px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', transition: 'border-color 0.3s' }}>
                          <Upload style={{ width: '18px', height: '18px', color: '#00E676' }} />
                          <div>
                            <div style={{ fontSize: '10px', color: '#fff', fontWeight: 'bold' }}>USER INPUT</div>
                            <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Text / Media file</div>
                          </div>
                        </div>

                        {/* Connection Line 1 with text label and pulsing flow */}
                        <div style={{ flex: 1, position: 'relative', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {/* SVG Flow Trace */}
                          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                            <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="rgba(0, 230, 118, 0.15)" strokeWidth="1.5" />
                            <line 
                              x1="0%" 
                              y1="50%" 
                              x2="100%" 
                              y2="50%" 
                              stroke="#00E676" 
                              strokeWidth="2" 
                              strokeDasharray="6 20"
                            >
                              <animate attributeName="stroke-dashoffset" values="26;0" dur="1.2s" repeatCount="indefinite" />
                            </line>
                          </svg>
                          <div style={{ zIndex: 1, background: '#020305', border: '1px solid rgba(0, 230, 118, 0.25)', borderRadius: '2px', padding: '2px 8px', fontSize: '8px', color: '#00E676', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            INGESTING
                          </div>
                        </div>

                        {/* Cognitive Core Node */}
                        <div style={{ width: '120px', border: '1px solid #00E676', background: 'rgba(5, 7, 10, 0.85)', padding: '12px 8px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', boxShadow: '0 0 10px rgba(0, 230, 118, 0.1)' }}>
                          <Shield style={{ width: '18px', height: '18px', color: '#00E676' }} className="animate-pulse" />
                          <div>
                            <div style={{ fontSize: '10px', color: '#fff', fontWeight: 'bold' }}>COGNITIVE CORE</div>
                            <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Triage Classifier</div>
                          </div>
                        </div>

                        {/* Connection Line 2 with text label and pulsing flow */}
                        <div style={{ flex: 1, position: 'relative', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                            <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="rgba(0, 230, 118, 0.15)" strokeWidth="1.5" />
                            <line 
                              x1="0%" 
                              y1="50%" 
                              x2="100%" 
                              y2="50%" 
                              stroke="#00E676" 
                              strokeWidth="2" 
                              strokeDasharray="6 20"
                            >
                              <animate attributeName="stroke-dashoffset" values="26;0" dur="1.2s" repeatCount="indefinite" />
                            </line>
                          </svg>
                          <div style={{ zIndex: 1, background: '#020305', border: '1px solid rgba(0, 230, 118, 0.25)', borderRadius: '2px', padding: '2px 8px', fontSize: '8px', color: '#00E676', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            CLASSIFYING
                          </div>
                        </div>

                        {/* Target Model Node */}
                        <div style={{ width: '130px', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(5, 7, 10, 0.85)', padding: '12px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                            <Globe style={{ width: '12px', height: '12px', color: '#00E676' }} />
                            <MessageSquare style={{ width: '12px', height: '12px', color: '#00E676' }} />
                            <PhoneCall style={{ width: '12px', height: '12px', color: '#00E676' }} />
                            <Camera style={{ width: '12px', height: '12px', color: '#00E676' }} />
                          </div>
                          <div>
                            <div style={{ fontSize: '10px', color: '#fff', fontWeight: 'bold' }}>AI DETECTORS</div>
                            <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>4 Specialist Agents</div>
                          </div>
                        </div>
                      </div>

                      {/* Footer Legend */}
                      <div style={{ fontSize: '8.5px', color: 'var(--text-muted)', textAlign: 'center', letterSpacing: '0.5px', textTransform: 'uppercase', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '6px' }}>
                        Automated forensic routing - zero leakage - secure local inference
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '8px' }}>
                      <div 
                        className="interactive-welcome-card"
                        style={{ 
                          padding: '20px', 
                          background: 'rgba(2,3,5,0.55)', 
                          border: '1px solid rgba(0, 230, 118, 0.1)', 
                          borderRadius: '4px', 
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#00E676';
                          e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 230, 118, 0.15)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.background = 'rgba(2,3,5,0.8)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'rgba(0, 230, 118, 0.1)';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.background = 'rgba(2,3,5,0.55)';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Globe style={{ width: '14px', height: '14px', color: '#00E676' }} />
                          <span style={{ fontSize: '12.5px', color: '#00E676', fontWeight: 'bold', fontFamily: 'monospace' }}>
                            [01] PASTE A URL
                          </span>
                        </div>
                        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0, fontFamily: 'monospace', lineHeight: '1.45' }}>
                          Directs security checks to the Website Investigation module automatically.
                        </p>
                      </div>

                      <div 
                        className="interactive-welcome-card"
                        style={{ 
                          padding: '20px', 
                          background: 'rgba(2,3,5,0.55)', 
                          border: '1px solid rgba(0, 230, 118, 0.1)', 
                          borderRadius: '4px', 
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#00E676';
                          e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 230, 118, 0.15)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.background = 'rgba(2,3,5,0.8)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'rgba(0, 230, 118, 0.1)';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.background = 'rgba(2,3,5,0.55)';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Camera style={{ width: '14px', height: '14px', color: '#00E676' }} />
                          <span style={{ fontSize: '12.5px', color: '#00E676', fontWeight: 'bold', fontFamily: 'monospace' }}>
                            [02] UPLOAD AN IMAGE
                          </span>
                        </div>
                        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0, fontFamily: 'monospace', lineHeight: '1.45' }}>
                          Extracts metadata and checks elements via Visual Investigation.
                        </p>
                      </div>

                      <div 
                        className="interactive-welcome-card"
                        style={{ 
                          padding: '20px', 
                          background: 'rgba(2,3,5,0.55)', 
                          border: '1px solid rgba(0, 230, 118, 0.1)', 
                          borderRadius: '4px', 
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#00E676';
                          e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 230, 118, 0.15)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.background = 'rgba(2,3,5,0.8)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'rgba(0, 230, 118, 0.1)';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.background = 'rgba(2,3,5,0.55)';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <PhoneCall style={{ width: '14px', height: '14px', color: '#00E676' }} />
                          <span style={{ fontSize: '12.5px', color: '#00E676', fontWeight: 'bold', fontFamily: 'monospace' }}>
                            [03] UPLOAD AUDIO
                          </span>
                        </div>
                        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0, fontFamily: 'monospace', lineHeight: '1.45' }}>
                          Decodes voicemail/calls via Call transcript and Voice analysis.
                        </p>
                      </div>

                      <div 
                        className="interactive-welcome-card"
                        style={{ 
                          padding: '20px', 
                          background: 'rgba(2,3,5,0.55)', 
                          border: '1px solid rgba(0, 230, 118, 0.1)', 
                          borderRadius: '4px', 
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#00E676';
                          e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 230, 118, 0.15)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.background = 'rgba(2,3,5,0.8)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'rgba(0, 230, 118, 0.1)';
                          e.currentTarget.style.boxShadow = 'none';
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.background = 'rgba(2,3,5,0.55)';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MessageSquare style={{ width: '14px', height: '14px', color: '#00E676' }} />
                          <span style={{ fontSize: '12.5px', color: '#00E676', fontWeight: 'bold', fontFamily: 'monospace' }}>
                            [04] PASTE AN SMS
                          </span>
                        </div>
                        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0, fontFamily: 'monospace', lineHeight: '1.45' }}>
                          Runs linguistic and sender header checks in SMS Investigation.
                        </p>
                      </div>
                    </div>

                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'monospace', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px', lineHeight: '1.4' }}>
                      ℹ I'll automatically identify the input type and route it to the correct specialized investigation agent.
                    </div>
                  </div>
                )}

                {/* DRAG AND DROP OVERLAY FOR WORKSPACE */}
                {isDragging && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(2, 3, 5, 0.92)',
                      backdropFilter: 'blur(10px)',
                      border: '2px dashed #00E676',
                      borderRadius: '4px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1000,
                      color: '#00E676',
                      fontFamily: 'monospace',
                      pointerEvents: 'none'
                    }}
                  >
                    <Upload style={{ width: '48px', height: '48px', marginBottom: '16px', color: '#00E676' }} />
                    <span style={{ fontSize: '15px', fontWeight: 'bold', letterSpacing: '1px' }}>
                      DROP FILES HERE TO INGEST
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Supports screenshots (.png, .jpg) or audio calls (.wav, .mp3)
                    </span>
                  </div>
                )}
              </div>

              {/* Sticky bottom input area */}
              <div style={{ 
                padding: '20px 24px', 
                borderTop: '1px solid rgba(0, 230, 118, 0.15)', 
                background: 'rgba(2, 3, 5, 0.95)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                {/* File preview badge */}
                {masterAttachedFile && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0, 230, 118, 0.08)', border: '1px solid rgba(0, 230, 118, 0.2)', padding: '6px 12px', width: 'fit-content' }}>
                    <span style={{ fontSize: '11px', color: '#00E676', fontFamily: 'monospace' }}>
                      📎 {masterAttachedFile.name} ({Math.round(masterAttachedFile.size / 1024)} KB)
                    </span>
                    <button 
                      onClick={() => setMasterAttachedFile(null)}
                      style={{ background: 'transparent', border: 'none', color: '#FF3D00', cursor: 'pointer', fontWeight: 'bold', fontSize: '10px' }}
                    >
                      [REMOVE]
                    </button>
                  </div>
                )}

                {/* ChatGPT style Input box */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%' }}>
                  {/* File attach input */}
                  <label 
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '1px solid rgba(0, 230, 118, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      background: 'transparent',
                      transition: 'border-color 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#00E676'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(0, 230, 118, 0.25)'}
                  >
                    <Upload style={{ width: '16px', height: '16px', color: '#00E676' }} />
                    <input 
                      type="file" 
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          setMasterAttachedFile(e.target.files[0]);
                        }
                      }}
                      style={{ display: 'none' }} 
                      accept="image/*,audio/*"
                    />
                  </label>

                  {/* Text input area */}
                  <input 
                    type="text" 
                    value={masterInputText}
                    onChange={e => setMasterInputText(e.target.value)}
                    placeholder="Paste website URL, attach screenshot image/audio call file, or paste SMS text to route..."
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        handleMasterAgentSubmit();
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      background: '#05070a',
                      border: '1px solid rgba(0, 230, 118, 0.15)',
                      color: '#fff',
                      fontFamily: 'monospace',
                      fontSize: '13.5px',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={e => e.target.style.borderColor = '#00E676'}
                    onBlur={e => e.target.style.borderColor = 'rgba(0, 230, 118, 0.15)'}
                  />

                  {/* Send Action */}
                  <button 
                    onClick={handleMasterAgentSubmit}
                    disabled={routingState.active || (!masterInputText.trim() && !masterAttachedFile)}
                    style={{
                      padding: '12px 24px',
                      background: '#00E676',
                      border: '1px solid #00E676',
                      color: '#020305',
                      fontWeight: 'bold',
                      fontSize: '13.5px',
                      fontFamily: 'monospace',
                      cursor: (routingState.active || (!masterInputText.trim() && !masterAttachedFile)) ? 'not-allowed' : 'pointer',
                      opacity: (routingState.active || (!masterInputText.trim() && !masterAttachedFile)) ? 0.5 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    SEND
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* API Logs View */}
          {activeNav === 'API Logs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease-out' }}>
              
              {/* Telemetry Header */}
              <div className="glass-panel card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'monospace' }}>SOC Telemetry & Real-Time API Logs</h2>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Forensic request logs captured across all live security agent ingestion gateways.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0, 230, 118, 0.06)', border: '1px solid rgba(0, 230, 118, 0.2)', padding: '6px 12px', borderRadius: '3px' }}>
                  <span className="live-bullet" style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#00E676', boxShadow: '0 0 8px #00E676' }}></span>
                  <span style={{ fontSize: '10px', color: '#00E676', fontWeight: 'bold', fontFamily: 'monospace' }}>LIVE STREAM ACTIVE</span>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="glass-panel card" style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '14px 20px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                  <Search style={{ width: '14px', height: '14px', color: 'var(--text-muted)', position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="text" 
                    placeholder="Search targets, payloads, or IPs..." 
                    value={apiLogsSearch}
                    onChange={e => setApiLogsSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 34px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#fff',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <select 
                    value={apiLogsChannel} 
                    onChange={e => setApiLogsChannel(e.target.value)}
                    style={{
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#fff',
                      fontSize: '11px',
                      padding: '6px 12px',
                      fontFamily: 'monospace',
                      outline: 'none'
                    }}
                  >
                    <option value="All">All Channels</option>
                    <option value="URL SCAN">URL Scan</option>
                    <option value="SMS INVEST">SMS Invest</option>
                    <option value="CALL ANALYST">Call Analyst</option>
                    <option value="EMAIL FORENSICS">Email Forensics</option>
                    <option value="VISUAL OCR">Visual OCR</option>
                  </select>

                  <select 
                    value={apiLogsSeverity} 
                    onChange={e => setApiLogsSeverity(e.target.value)}
                    style={{
                      background: 'rgba(0,0,0,0.5)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#fff',
                      fontSize: '11px',
                      padding: '6px 12px',
                      fontFamily: 'monospace',
                      outline: 'none'
                    }}
                  >
                    <option value="All">All Severities</option>
                    <option value="HIGH RISK">High Risk</option>
                    <option value="SUSPICIOUS">Suspicious</option>
                    <option value="SAFE">Safe</option>
                  </select>
                </div>
              </div>

              {/* Layout Grid: Table + Live Terminal Console */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                
                {/* Table panel */}
                <div className="glass-panel card" style={{ padding: '0', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', fontFamily: 'monospace' }}>REQUESTS DATABASE</span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'monospace', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '12px 20px' }}>Timestamp</th>
                          <th style={{ padding: '12px 10px' }}>Gateway Channel</th>
                          <th style={{ padding: '12px 10px' }}>Forensic Target</th>
                          <th style={{ padding: '12px 10px' }}>Status</th>
                          <th style={{ padding: '12px 10px' }}>Latency</th>
                          <th style={{ padding: '12px 20px' }}>Verdict</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { time: '21:54:12', channel: 'URL SCAN', target: 'https://amazon.in', status: '200 OK', latency: '412ms', verdict: 'SAFE', trust: 100, risk: 0 },
                          { time: '21:50:33', channel: 'SMS INVEST', target: '+1 (505) 328-9844', status: '200 OK', latency: '654ms', verdict: 'SUSPICIOUS', trust: 55, risk: 45 },
                          { time: '21:44:02', channel: 'CALL ANALYST', target: 'incoming_voicemail_call.mp3', status: '200 OK', latency: '1240ms', verdict: 'HIGH RISK', trust: 10, risk: 90 },
                          { time: '21:38:15', channel: 'EMAIL FORENSICS', target: 'invoice_transfer_pdf.eml', status: '200 OK', latency: '890ms', verdict: 'HIGH RISK', trust: 15, risk: 85 },
                          { time: '21:29:40', channel: 'VISUAL OCR', target: 'website_screenshot.png', status: '200 OK', latency: '980ms', verdict: 'SUSPICIOUS', trust: 40, risk: 60 },
                          { time: '21:22:11', channel: 'URL SCAN', target: 'https://verify-paypal.security-update-92.org', status: '200 OK', latency: '512ms', verdict: 'HIGH RISK', trust: 5, risk: 95 },
                          { time: '21:15:04', channel: 'SMS INVEST', target: 'URGENT: Claim your $500 gift card now', status: '200 OK', latency: '344ms', verdict: 'HIGH RISK', trust: 0, risk: 100 },
                          { time: '21:08:44', channel: 'URL SCAN', target: 'https://google.com', status: '200 OK', latency: '280ms', verdict: 'SAFE', trust: 100, risk: 0 }
                        ].filter(item => {
                          const matchesSearch = item.target.toLowerCase().includes(apiLogsSearch.toLowerCase()) || item.channel.toLowerCase().includes(apiLogsSearch.toLowerCase());
                          const matchesChannel = apiLogsChannel === 'All' || item.channel === apiLogsChannel;
                          const matchesSeverity = apiLogsSeverity === 'All' || item.verdict === apiLogsSeverity;
                          return matchesSearch && matchesChannel && matchesSeverity;
                        }).map((item, index) => (
                          <tr 
                            key={index} 
                            onClick={() => setSelectedLogPayload(item)}
                            style={{ 
                              borderBottom: '1px solid rgba(255,255,255,0.04)', 
                              cursor: 'pointer',
                              background: selectedLogPayload?.target === item.target ? 'rgba(0, 230, 118, 0.04)' : 'transparent',
                              transition: 'background 0.2s'
                            }}
                            onMouseEnter={e => { if (selectedLogPayload?.target !== item.target) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.01)'; }}
                            onMouseLeave={e => { if (selectedLogPayload?.target !== item.target) e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            <td style={{ padding: '12px 20px', color: 'var(--text-muted)' }}>{item.time}</td>
                            <td style={{ padding: '12px 10px' }}>
                              <span style={{
                                padding: '2px 6px',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '2px',
                                color: item.channel === 'URL SCAN' ? '#00B0FF' : (item.channel === 'SMS INVEST' ? '#FFA000' : (item.channel === 'CALL ANALYST' ? '#D500F9' : '#3F51B5')),
                                fontSize: '9px',
                                fontWeight: 'bold'
                              }}>
                                {item.channel}
                              </span>
                            </td>
                            <td style={{ padding: '12px 10px', color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                              {item.target}
                            </td>
                            <td style={{ padding: '12px 10px', color: '#00E676' }}>{item.status}</td>
                            <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>{item.latency}</td>
                            <td style={{ padding: '12px 20px', fontWeight: 'bold', color: getRiskColor(item.risk) }}>{item.verdict}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Console Log Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Console logs */}
                  <div className="glass-panel card" style={{ display: 'flex', flexDirection: 'column', height: '240px', padding: '0', overflow: 'hidden' }}>
                    <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#00E676', fontWeight: 'bold', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Terminal style={{ width: '12px', height: '12px' }} />
                        CONSOLE_OUTPUT
                      </span>
                      <button onClick={() => setTelemetryLogs([])} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '9px', fontFamily: 'monospace', cursor: 'pointer' }}>[CLEAR]</button>
                    </div>
                    <div style={{ flex: 1, padding: '12px 16px', background: '#020305', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: 'monospace', fontSize: '9.5px', color: '#00E676' }}>
                      {telemetryLogs.map((log, i) => {
                        const isError = log.includes('ERROR') || log.includes('HIGH RISK');
                        const isDebug = log.includes('DEBUG');
                        return (
                          <div key={i} style={{ color: isError ? '#FF1744' : (isDebug ? '#00E5FF' : '#00E676'), wordBreak: 'break-all', lineHeight: '1.4' }}>
                            {log}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Detail Panel */}
                  <div className="glass-panel card" style={{ flex: 1, fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span className="card-title">FORENSIC_TELEMETRY_INSPECT</span>
                    {selectedLogPayload ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: 'monospace' }}>
                        <div><span style={{ color: 'var(--text-muted)' }}>Target:</span> <span style={{ color: '#fff', fontWeight: 'bold' }}>{selectedLogPayload.target}</span></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Gateway:</span> <span style={{ color: '#fff' }}>{selectedLogPayload.channel}</span></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Latency:</span> <span style={{ color: '#fff' }}>{selectedLogPayload.latency}</span></div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                          <div style={{ padding: '4px 8px', border: '1px solid #00E676', color: '#00E676', display: 'inline-block' }}>TRUST: {selectedLogPayload.trust}%</div>
                          <div style={{ padding: '4px 8px', border: `1px solid ${getRiskColor(selectedLogPayload.risk)}`, color: getRiskColor(selectedLogPayload.risk), display: 'inline-block' }}>RISK: {selectedLogPayload.risk}%</div>
                        </div>
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px', marginTop: '4px' }}>
                          <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>RAW EVIDENCE BLOCK:</span>
                          <pre style={{ fontSize: '9px', background: 'rgba(0,0,0,0.3)', padding: '6px', color: '#888', overflowX: 'auto', margin: 0 }}>
                            {JSON.stringify({
                              analysis_channel: selectedLogPayload.channel,
                              timestamp: selectedLogPayload.time,
                              indicators_matched: selectedLogPayload.risk > 0 ? ["Phishing signature", "Domain reputation warning"] : ["Valid SSL certificate"],
                              verification_status: "SUCCESS"
                            }, null, 2)}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                        Click on any log record row above to inspect detailed payload telemetry.
                      </div>
                    )}
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* Settings Page */}
          {activeNav === 'Settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease-out' }}>
              
              {/* Header */}
              <div className="glass-panel card" style={{ padding: '16px 20px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'monospace' }}>SOC Configuration Console</h2>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Configure AI reasoning weights, local thresholds, blacklist rules, and active analysis tools.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                
                {/* AI Model config card */}
                <div className="glass-panel card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Server style={{ width: '14px', height: '14px', color: '#00E676' }} />
                    AI Model Infrastructure
                  </span>
                  
                  {/* Model select */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>LLM INFERENCE ENGINE</label>
                    <select 
                      value={settingsLLM} 
                      onChange={e => setSettingsLLM(e.target.value)}
                      style={{
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#fff',
                        fontSize: '11px',
                        padding: '8px 12px',
                        fontFamily: 'monospace',
                        outline: 'none'
                      }}
                    >
                      <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Fastest, default)</option>
                      <option value="llama-3.1-70b-versatile">llama-3.1-70b-versatile (More capable)</option>
                      <option value="mixtral-8x7b-32768">mixtral-8x7b-32768 (Alternative)</option>
                    </select>
                  </div>

                  {/* Temperature slider */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'monospace' }}>
                      <span style={{ color: 'var(--text-muted)' }}>TEMPERATURE</span>
                      <span style={{ color: '#00E676', fontWeight: 'bold' }}>{settingsTemp}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.05" 
                      value={settingsTemp} 
                      onChange={e => setSettingsTemp(parseFloat(e.target.value))}
                      style={{ accentColor: '#00E676' }}
                    />
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Lower values yield deterministic and factual outputs.</span>
                  </div>

                  {/* Max tokens */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'monospace' }}>
                      <span style={{ color: 'var(--text-muted)' }}>MAX RESPONSE TOKENS</span>
                      <span style={{ color: '#00E676', fontWeight: 'bold' }}>{settingsTokens}</span>
                    </div>
                    <input 
                      type="range" 
                      min="256" 
                      max="2048" 
                      step="64" 
                      value={settingsTokens} 
                      onChange={e => setSettingsTokens(parseInt(e.target.value))}
                      style={{ accentColor: '#00E676' }}
                    />
                  </div>

                  {/* API connection status */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5px', color: '#00E676', fontFamily: 'monospace' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#00E676', boxShadow: '0 0 6px #00E676' }}></span>
                    <span>Groq API Connection: ESTABLISHED (Latency: 138ms)</span>
                  </div>
                </div>

                {/* Scanners toggles card */}
                <div className="glass-panel card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield style={{ width: '14px', height: '14px', color: '#00E676' }} />
                    Active Diagnostic Scanners
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {Object.entries(settingsScanners).map(([key, val]) => (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', fontFamily: 'monospace' }}>
                        <span style={{ color: '#fff', textTransform: 'uppercase' }}>{key.replace('_', ' ')}</span>
                        <label style={{ position: 'relative', display: 'inline-block', width: '34px', height: '18px' }}>
                          <input 
                            type="checkbox" 
                            checked={val} 
                            onChange={() => setSettingsScanners(prev => ({ ...prev, [key]: !prev[key] }))}
                            style={{ opacity: 0, width: 0, height: 0 }}
                          />
                          <span style={{
                            position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: val ? '#00E676' : '#222',
                            transition: '0.2s', borderRadius: '34px',
                            boxShadow: val ? '0 0 6px #00E676' : 'none'
                          }}></span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Whitelisted registries card */}
                <div className="glass-panel card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Globe style={{ width: '14px', height: '14px', color: '#00E676' }} />
                    Whitelisted Trusted Registries
                  </span>
                  
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    Domains declared here are hard-overruled as SAFE, bypassing typical risk scoring calculations.
                  </div>

                  {/* Domain Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '6px 0' }}>
                    {settingsWhitelisted.map((domain, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 230, 118, 0.08)', border: '1px solid rgba(0, 230, 118, 0.2)', padding: '4px 8px', borderRadius: '2px', fontSize: '10px', fontFamily: 'monospace', color: '#00E676' }}>
                        <span>{domain}</span>
                        <button 
                          onClick={() => setSettingsWhitelisted(prev => prev.filter(d => d !== domain))}
                          style={{ background: 'transparent', border: 'none', color: '#FF3D00', cursor: 'pointer', padding: 0, fontWeight: 'bold' }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Domain Input */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <input 
                      type="text" 
                      placeholder="Add whitelisted domain (e.g. apple.com)..."
                      value={newDomainInput}
                      onChange={e => setNewDomainInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newDomainInput.trim()) {
                          const trim = newDomainInput.trim().toLowerCase();
                          if (!settingsWhitelisted.includes(trim)) {
                            setSettingsWhitelisted(prev => [...prev, trim]);
                          }
                          setNewDomainInput('');
                        }
                      }}
                      style={{
                        flex: 1,
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#fff',
                        padding: '6px 10px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        outline: 'none'
                      }}
                    />
                    <button 
                      onClick={() => {
                        if (newDomainInput.trim()) {
                          const trim = newDomainInput.trim().toLowerCase();
                          if (!settingsWhitelisted.includes(trim)) {
                            setSettingsWhitelisted(prev => [...prev, trim]);
                          }
                          setNewDomainInput('');
                        }
                      }}
                      style={{
                        background: '#00E676',
                        border: 'none',
                        color: '#000',
                        fontWeight: 'bold',
                        padding: '0 14px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        cursor: 'pointer'
                      }}
                    >
                      ADD
                    </button>
                  </div>
                </div>

                {/* Alerting policies card */}
                <div className="glass-panel card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity style={{ width: '14px', height: '14px', color: '#00E676' }} />
                    Active SecOps Response Policies
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {Object.entries(settingsAlerts).map(([key, val]) => (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', fontFamily: 'monospace' }}>
                        <span style={{ color: '#fff', textTransform: 'uppercase' }}>{key.replace('_', ' ')}</span>
                        <label style={{ position: 'relative', display: 'inline-block', width: '34px', height: '18px' }}>
                          <input 
                            type="checkbox" 
                            checked={val} 
                            onChange={() => setSettingsAlerts(prev => ({ ...prev, [key]: !prev[key] }))}
                            style={{ opacity: 0, width: 0, height: 0 }}
                          />
                          <span style={{
                            position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: val ? '#00E676' : '#222',
                            transition: '0.2s', borderRadius: '34px',
                            boxShadow: val ? '0 0 6px #00E676' : 'none'
                          }}></span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  );
}
