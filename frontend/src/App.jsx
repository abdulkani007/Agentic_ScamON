import React, { useState, useEffect } from 'react';
import { 
  Shield, LayoutDashboard, FileText, History, AlertOctagon, 
  Terminal, Settings, Upload, Activity, Server, Globe, 
  FileAudio, RefreshCw, Layers, ChevronRight, Play, AlertTriangle, Search, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

export default function App() {
  // Sidebar State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Navigation State
  const [activeNav, setActiveNav] = useState('Web & QR Scan');

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
  
  // PROTECTION ENGINE STATES
  const [protectionStatus, setProtectionStatus] = useState({ status: "Active", total_blocked: 0, blocked_domains: [] });
  const [protectionHistory, setProtectionHistory] = useState([]);
  const [blockingLoading, setBlockingLoading] = useState(false);
  const [protectionError, setProtectionError] = useState("");
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

    const response = await fetch('http://127.0.0.1:8000/call-analysis', {
      method: 'POST',
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

    const response = await fetch('http://127.0.0.1:8001/website-analysis', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to analyze the website/QR.');
    }
    return await response.json();
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

  useEffect(() => {
    fetchDashboardStatsAndHistory();
    fetchProtectionData();
    fetchBlockedWebsitesList();
  }, [activeNav]);

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
        if (webResult && webResult.domain.name === domain) {
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
        if (webResult && webResult.domain.name === domain) {
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

  return (
    <div className="app-container">
      
      {/* SIDEBAR */}
      <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div>
          {/* Logo brand section */}
          <div className="sidebar-header">
            <span className="pulse-glow" style={{ marginRight: '2px' }}></span>
            {!sidebarCollapsed ? (
              <span className="sidebar-logo-text">• ScamON</span>
            ) : (
              <span className="sidebar-logo-text">•</span>
            )}
          </div>

          {/* Navigation Items */}
          <div className="nav-list">
            {[
              { name: 'Dashboard', icon: LayoutDashboard },
              { name: 'Call Analysis', icon: Activity },
              { name: 'Web & QR Scan', icon: Globe },
              { name: 'Protection', icon: Shield },
              { name: 'History', icon: History },
              { name: 'Threat Reports', icon: AlertOctagon },
              { name: 'API Logs', icon: Terminal },
              { name: 'Settings', icon: Settings }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveNav(item.name)}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Collapse Toggle */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(0, 230, 118, 0.08)' }}>
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              background: 'transparent',
              border: '1px solid var(--accent-green-dim)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-cyber)',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            {sidebarCollapsed ? <ChevronRight style={{ width: '14px', height: '14px' }} /> : 'COLLAPSE PANEL'}
          </button>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="main-layout">
        
        {/* NAVBAR */}
        <header className="navbar">
          <div className="navbar-left">
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1.5px' }}>SYSTEM CONTROL</span>
            <div style={{ height: '16px', width: '1px', background: 'var(--accent-green-dim)' }}></div>
            
            <div className="status-pill">
              <Server style={{ width: '12px', height: '12px' }} />
              <span>SOC_ACTIVE</span>
            </div>

            <div className="status-pill" style={{ borderColor: 'transparent', background: 'transparent' }}>
              <span className="pulse-glow"></span>
              <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>LIVE FEED</span>
            </div>
          </div>

          <div className="navbar-right">
            <div className="user-badge">
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff' }}>ANALYST_732</span>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>SOC Level 3</span>
              </div>
              <div className="user-avatar">A</div>
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <main className="content-area">
          
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
                          INTERCEPT_SOURCE: {callSelectedFile ? callSelectedFile.name : 'RAW_TRANSCRIPT_PAYLOAD'} // ID: {callResult.investigation_id.substring(0, 18)}
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
                        border: `3px solid ${getRiskColor(callResult.risk_score)}`, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        boxShadow: `0 0 12px ${getRiskColor(callResult.risk_score)}`
                      }}>
                        <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff' }}>{100 - callResult.risk_score}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>/100</span>
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h3 style={{ 
                            fontSize: '18px', 
                            fontWeight: 'bold', 
                            color: getRiskColor(callResult.risk_score),
                            textShadow: '0 0 8px ' + getRiskColor(callResult.risk_score)
                          }}>
                            {callResult.ai_analysis.final_decision}
                          </h3>
                          <span style={{ 
                            background: 'rgba(255,255,255,0.05)', 
                            border: '1px solid rgba(255,255,255,0.1)', 
                            color: 'var(--text-muted)', 
                            fontSize: '9px', 
                            padding: '2px 6px',
                            fontFamily: 'var(--font-cyber)'
                          }}>
                            CONFIDENCE: {callResult.ai_analysis.confidence_rating}%
                          </span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '6px' }}>
                          Threat Category: <span style={{ color: '#fff', fontWeight: 'bold' }}>{callResult.ai_analysis.threat_category}</span>
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
                      {callResult.memory_history.has_history ? (
                        <>
                          <div style={{ color: '#FF3D00', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', textShadow: '0 0 6px #FF3D00' }}>
                            <AlertOctagon style={{ width: '12px', height: '12px' }} />
                            <span>CALLER_REGISTRY_MATCH</span>
                          </div>
                          <div style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '10px' }}>
                            Total Prior Reports: {callResult.memory_history.total_reports}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                            Previous Verdict Risk: {callResult.memory_history.last_risk_score}%
                          </div>
                          <div style={{ color: '#FFA000', fontWeight: 'bold', fontSize: '10px', marginTop: '4px' }}>
                            Scam Trend: {callResult.memory_history.last_scam_type}
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
                      {Object.entries(callResult.emotion_timeline).map(([emotion, score]) => (
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
                          {callResult.ai_analysis.summary}
                        </p>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', marginTop: '4px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Investigative Scam Indicators
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {callResult.ai_analysis.reasoning_steps.map((step, i) => (
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
                        {callResult.keywords.map(k => <span key={k} className="glass-badge">{k}</span>)}
                        {callResult.keywords.length === 0 && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No suspicious keywords detected.</span>}
                      </div>
                    </div>

                    <div className="glass-panel card">
                      <span className="card-title">MOD_ENTITIES_SCAN</span>
                      <div className="entities-grid">
                        {Object.entries(callResult.entities).map(([k, v]) => (
                          <div key={k} className="entity-card">
                            <div className="entity-card-header">{k}</div>
                            {v.length > 0 ? v.map((item, i) => <div key={i} className="entity-val">{item}</div>) : <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>None Mapped</div>}
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
                        <div><span style={{ color: 'var(--text-muted)' }}>Investigation ID:</span> <span style={{ color: '#fff', fontFamily: 'monospace' }}>{callResult.investigation_id}</span></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Timestamp:</span> <span style={{ color: '#fff' }}>{callResult.timestamp}</span></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Detected Language:</span> <span style={{ color: '#fff' }}>{callResult.detected_language}</span></div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div><span style={{ color: 'var(--text-muted)' }}>Forensic Verdict:</span> <span style={{ color: getRiskColor(callResult.risk_score), fontWeight: 'bold' }}>{callResult.ai_analysis.final_decision}</span></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Speaker Count:</span> <span style={{ color: '#fff' }}>{callResult.speaker_count} unique voice nodes</span></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Speaking Duration:</span> <span style={{ color: '#fff' }}>{callResult.call_duration} seconds</span></div>
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
                          borderColor: getRiskColor(callResult.risk_score),
                          color: getRiskColor(callResult.risk_score),
                          boxShadow: `0 0 8px ${getRiskColor(callResult.risk_score)}20`,
                          textTransform: 'uppercase',
                          fontWeight: 'bold',
                          padding: '6px 14px',
                          cursor: 'default'
                        }}>
                          {callResult.ai_analysis.recommended_action}
                        </button>
                        <button className="btn-secondary" style={{ fontSize: '11px', textTransform: 'uppercase' }} onClick={() => alert("Forwarded call telemetry data registry to national Cyber Crime Portal.")}>
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

                      <button onClick={runCallAnalysis} className="btn-primary">
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
                          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', textTransform: 'lowercase' }}>{webResult.domain.name}</h2>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Website Safety Report</p>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px', wordBreak: 'break-all' }}>
                            {webResult.url}
                          </p>
                          <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px' }}>
                            Scanned: {webResult.timestamp} • ID: {webResult.investigation_id.substring(0, 18)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {renderVisualEvidence(false, webResult)}

                  </div>

                  {/* Safety Score & AI Decision Panel */}
                  <div className="glass-panel card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                      
                      {/* Safety Circle Index */}
                      <div style={{ 
                        width: '90px', 
                        height: '90px', 
                        borderRadius: '50%', 
                        border: `3px solid ${getRiskColor(webResult.risk_score)}`, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        boxShadow: `0 0 12px ${getRiskColor(webResult.risk_score)}`
                      }}>
                        <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff' }}>{100 - webResult.risk_score}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>/100</span>
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h3 style={{ 
                            fontSize: '18px', 
                            fontWeight: 'bold', 
                            color: getRiskColor(webResult.risk_score),
                            textShadow: '0 0 8px ' + getRiskColor(webResult.risk_score)
                          }}>
                            {webResult.ai_reasoning.final_decision}
                          </h3>
                          <span style={{ 
                            background: 'rgba(255,255,255,0.05)', 
                            border: '1px solid rgba(255,255,255,0.1)', 
                            color: 'var(--text-muted)', 
                            fontSize: '9px', 
                            padding: '2px 6px',
                            fontFamily: 'var(--font-cyber)'
                          }}>
                            CONFIDENCE: {webResult.ai_reasoning.confidence_rating}%
                          </span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '6px' }}>
                          Threat Category: <span style={{ color: '#fff', fontWeight: 'bold' }}>{webResult.ai_reasoning.threat_category}</span>
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
                      {webResult.memory_history.has_history ? (
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
                          {webResult.ai_reasoning.summary}
                        </p>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', marginTop: '4px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Explainable Indicators
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {webResult.ai_reasoning.reasoning_steps.map((step, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11.5px', color: 'var(--text-primary)' }}>
                            <span style={{ color: 'var(--accent-green)' }}>&gt;</span>
                            <span>{step}</span>
                          </div>
                        ))}
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
                        <div><span style={{ color: 'var(--text-muted)' }}>Investigation ID:</span> <span style={{ color: '#fff', fontFamily: 'monospace' }}>{webResult.investigation_id}</span></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Timestamp:</span> <span style={{ color: '#fff' }}>{webResult.timestamp}</span></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Target URL:</span> <span style={{ color: '#fff', wordBreak: 'break-all' }}>{webResult.url}</span></div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div><span style={{ color: 'var(--text-muted)' }}>Threat Category:</span> <span style={{ color: 'var(--accent-green)' }}>{webResult.ai_reasoning.threat_category}</span></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Verdict:</span> <span style={{ color: getRiskColor(webResult.risk_score), fontWeight: 'bold' }}>{webResult.ai_reasoning.final_decision}</span></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>HTTP Status:</span> <span style={{ color: '#fff' }}>{webResult.http_status || 'Unknown'} (Hops: {webResult.redirect_history.length - 1})</span></div>
                      </div>
                    </div>

                    {/* Redirect path visual */}
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--accent-green)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                        Visual Redirect Chain Hop Sequence
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', background: '#020305', padding: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        {webResult.redirect_history.map((hop, idx) => (
                          <React.Fragment key={idx}>
                            {idx > 0 && <ChevronRight style={{ width: '12px', height: '12px', color: 'var(--text-muted)' }} />}
                            <span style={{ 
                              fontSize: '10.5px', 
                              fontFamily: 'monospace', 
                              color: idx === webResult.redirect_history.length - 1 ? 'var(--accent-green)' : 'var(--text-muted)',
                              textShadow: idx === webResult.redirect_history.length - 1 ? 'var(--accent-green-glow)' : 'none'
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
                          {Object.entries(webResult.security_headers).map(([header, status]) => {
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
                            <span style={{ color: '#fff' }}>{webResult.html_metadata.title}</span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>Description: </span>
                            <span style={{ color: 'var(--text-muted)' }}>{webResult.html_metadata.description}</span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>Keywords: </span>
                            <span style={{ color: 'var(--text-muted)' }}>{webResult.html_metadata.keywords}</span>
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
                            const domainName = webResult.domain.name;
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
                        {!webResult.is_blocked && !unblockedDomains.has(webResult.domain.name) && (
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
                            onClick={() => handleBlockWebsite(webResult.domain.name)}
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
                            onClick={() => handleUnblockWebsite(webResult.domain.name)}
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
                            onClick={() => alert(`SOC Logged. Phishing report successfully compiled and dispatched for target: ${webResult.domain.name}`)}
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
                        {webResult.ai_reasoning.recommended_action}
                      </button>
                      <button onClick={() => setWebResult(null)} className="btn-primary" style={{ width: 'auto', minWidth: '120px', padding: '6px 20px' }}>
                        NEW SCAN
                      </button>
                    </div>
                  </div>
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
                          <button onClick={runWebAnalysis} className="btn-primary" style={{ width: '180px', height: '42px', flexShrink: 0 }}>
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
                                          Unblock
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
            </>
          )}

          {/* Dashboard (Stats and History list) */}
          {activeNav === 'Dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
                {[
                  { label: "Total Scans", val: stats.total_scans },
                  { label: "High Risk Websites", val: stats.high_risk_websites, color: '#FF3D00' },
                  { label: "Blocked Websites", val: stats.blocked_websites, color: '#FFA000' },
                  { label: "Safe Websites", val: stats.safe_websites, color: 'var(--accent-green)' },
                  { label: "Investigations Today", val: stats.investigations_today }
                ].map((stat, i) => (
                  <div key={i} className="glass-panel card" style={{ margin: 0 }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>{stat.label}</span>
                    <p style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold', 
                      color: stat.color || '#fff', 
                      textShadow: stat.color ? `0 0 8px ${stat.color}40` : 'none',
                      marginTop: '8px' 
                    }}>{stat.val}</p>
                  </div>
                ))}
              </div>

              {/* Log Activity table */}
              <div className="glass-panel card">
                <span className="card-title">RECENT INTERCEPTION ACTIVITY LOG</span>
                <div style={{ overflowX: 'auto' }}>
                  <table className="logs-table">
                    <thead>
                      <tr>
                        <th>Scan ID</th>
                        <th>Agent Model</th>
                        <th>Scan Type</th>
                        <th>Timestamp</th>
                        <th>Threat Verdict</th>
                        <th>Risk Score</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scanHistory.map((log) => (
                        <tr key={log.id}>
                          <td style={{ fontFamily: 'var(--font-cyber)', fontWeight: 'bold', color: 'var(--text-muted)' }}>#SH-{log.id}</td>
                          <td>{log.agent}</td>
                          <td>{log.type}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{log.date}</td>
                          <td>
                            <span style={{ 
                              padding: '2px 8px', 
                              fontSize: '10px', 
                              fontWeight: 'bold',
                              border: '1px solid transparent',
                              background: log.status === 'Critical' ? 'rgba(255,61,0,0.1)' : (log.status === 'Warning' ? 'rgba(255,160,0,0.1)' : 'rgba(0,230,118,0.1)'),
                              color: log.status === 'Critical' ? '#FF3D00' : (log.status === 'Warning' ? '#FFA000' : '#00E676'),
                              borderColor: log.status === 'Critical' ? 'rgba(255,61,0,0.2)' : (log.status === 'Warning' ? 'rgba(255,160,0,0.2)' : 'rgba(0,230,118,0.2)'),
                            }}>
                              {log.category}
                            </span>
                          </td>
                          <td style={{ fontWeight: 'bold', color: getRiskColor(log.score) }}>{log.score}%</td>
                          <td style={{ textAlign: 'right' }}>
                            <button 
                              onClick={() => {
                                if (log.agent === "Call Analysis") setActiveNav('Call Analysis');
                                else setActiveNav('Web & QR Scan');
                              }}
                              style={{ background: 'transparent', border: 'none', color: 'var(--accent-green)', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                              INSPECT
                            </button>
                          </td>
                        </tr>
                      ))}
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

          {/* Other Nav items fallback */}
          {['History', 'Threat Reports', 'API Logs', 'Settings'].includes(activeNav) && (
            <div className="glass-panel card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '360px', padding: '40px' }}>
              <Shield style={{ width: '40px', height: '40px', color: 'var(--text-muted)', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', textTransform: 'uppercase' }}>{activeNav} Module</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>This module node represents {activeNav}. Under configuration.</p>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
