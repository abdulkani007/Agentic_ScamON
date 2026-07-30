import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Cpu, Globe, Mail, MessageSquare, PhoneCall, Camera, 
  Database, Activity, FileText, Settings, Play, ArrowRight, Lock, 
  Terminal, RefreshCw, Layers, Server, AlertOctagon, HelpCircle
} from 'lucide-react';

// Helper component for counting numbers from 0 on load
const Counter = ({ value, duration = 1.5 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(value);
    if (start === end || isNaN(end)) {
      setCount(value);
      return;
    }
    
    const totalMiliseconds = duration * 1000;
    const incrementTime = Math.max(Math.floor(totalMiliseconds / end), 15);
    
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start === end) clearInterval(timer);
    }, incrementTime);
    
    return () => clearInterval(timer);
  }, [value, duration]);
  
  return <span>{count}</span>;
};

// Section observer wrapper for smooth scroll fade-in/slide-up
const FadeInSection = ({ children }) => {
  const [isVisible, setVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    
    const currentRef = domRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <div
      ref={domRef}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'none' : 'translateY(24px)',
        transition: 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {children}
    </div>
  );
};

export default function LandingPage({ onStartAnalysis }) {
  const [view, setView] = useState('landing'); // 'landing', 'boot'
  const [bootStep, setBootStep] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Handle mouse reactive glow coordinates
  const handleMouseMove = (e) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  // SOC Boot Sequence steps
  const bootLogs = [
    { text: "INITIALIZING SOC THREAT ARCHITECTURE...", delay: 200 },
    { text: "PLANNER: Establishing secure replica connection...", delay: 400 },
    { text: "Loading Master Orchestrator Agent (PID 43900)... OK", delay: 300 },
    { text: "Loading Website Investigation Agent (Port 8001)... OK", delay: 250 },
    { text: "Loading Email Investigation Agent (Port 8001)... OK", delay: 200 },
    { text: "Loading SMS Investigation Agent (Status: Passive Collector Active)... OK", delay: 300 },
    { text: "Loading Call Analysis Agent (Port 8000)... OK", delay: 250 },
    { text: "Loading Visual Investigation Agent... OK", delay: 200 },
    { text: "Connecting Evidence Vault Decryptor... OK", delay: 350 },
    { text: "Synchronizing Threat Correlation logs... OK", delay: 200 },
    { text: "COMPILING DASHBOARD CONSOLE STATE...", delay: 300 }
  ];

  useEffect(() => {
    if (view === 'boot') {
      let currentStep = 0;
      const runBoot = () => {
        if (currentStep < bootLogs.length) {
          setBootStep(currentStep + 1);
          const nextDelay = bootLogs[currentStep].delay;
          currentStep += 1;
          setTimeout(runBoot, nextDelay);
        } else {
          // Finish and callback
          setTimeout(() => {
            onStartAnalysis();
          }, 400);
        }
      };
      runBoot();
    }
  }, [view]);

  if (view === 'boot') {
    return (
      <div 
        style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: '#05070A',
          color: '#00E676',
          fontFamily: 'monospace',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          boxSizing: 'border-box'
        }}
      >
        <div 
          style={{
            width: '100%',
            maxWidth: '640px',
            border: '1px solid rgba(0, 230, 118, 0.3)',
            background: 'rgba(5, 7, 10, 0.85)',
            boxShadow: '0 0 30px rgba(0, 230, 118, 0.1)',
            padding: '30px',
            boxSizing: 'border-box'
          }}
        >
          {/* Top Panel Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,230,118,0.2)', paddingBottom: '12px', marginBottom: '20px' }}>
            <span style={{ fontSize: '11px', letterSpacing: '2px', fontWeight: 'bold' }}>[SCAMON SOC CONSOLE BOOT]</span>
            <span className="animate-pulse" style={{ fontSize: '11px', color: '#fff' }}>SYSTEM INITIALIZING</span>
          </div>

          {/* Terminal Logs */}
          <div style={{ height: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', textAlign: 'left', lineHeight: '1.5' }}>
            {bootLogs.slice(0, bootStep).map((log, idx) => (
              <div key={idx} style={{ color: log.text.includes("OK") ? '#00E676' : '#fff' }}>
                <span style={{ color: 'rgba(0, 230, 118, 0.5)', marginRight: '8px' }}>❯</span>
                {log.text}
              </div>
            ))}
            {bootStep < bootLogs.length && (
              <div className="animate-pulse" style={{ color: '#00E676' }}>
                <span style={{ marginRight: '8px' }}>❯</span>█
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div style={{ marginTop: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(0, 230, 118, 0.7)', marginBottom: '6px' }}>
              <span>LOADING AGENT REGISTRIES...</span>
              <span>{Math.round((bootStep / bootLogs.length) * 100)}%</span>
            </div>
            <div style={{ height: '8px', background: 'rgba(0, 230, 118, 0.05)', border: '1px solid rgba(0, 230, 118, 0.2)', padding: '2px' }}>
              <div 
                style={{
                  height: '100%',
                  backgroundColor: '#00E676',
                  width: `${(bootStep / bootLogs.length) * 100}%`,
                  transition: 'width 0.2s ease-out'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={{
        backgroundColor: '#05070A',
        color: '#fff',
        minHeight: '100vh',
        position: 'relative',
        overflowX: 'hidden',
        fontFamily: 'monospace'
      }}
    >
      {/* Background Grid Pattern */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(rgba(0, 230, 118, 0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 230, 118, 0.035) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          backgroundPosition: 'center',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      {/* Mouse Reactive Radial Glow */}
      <div 
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 230, 118, 0.04) 0%, transparent 70%)',
          left: `${mousePosition.x - 250}px`,
          top: `${mousePosition.y - 250}px`,
          pointerEvents: 'none',
          transform: 'translate3d(0,0,0)',
          zIndex: 2,
          transition: 'transform 0.05s ease-out'
        }}
      />

      {/* Header / Top Navigation */}
      <header 
        style={{
          borderBottom: '1px solid rgba(0, 230, 118, 0.15)',
          background: 'rgba(5, 7, 10, 0.85)',
          backdropFilter: 'blur(10px)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: '16px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield style={{ width: '20px', height: '20px', color: '#00E676' }} />
          <span style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '4px', color: '#fff' }}>
            SCAM<span style={{ color: '#00E676' }}>ON</span>
          </span>
        </div>
        
        <nav style={{ display: 'flex', gap: '30px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          <a href="#features" className="nav-link-hover" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Features</a>
          <a href="#agents" className="nav-link-hover" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>AI Agents</a>
          <a href="#workflow" className="nav-link-hover" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Workflow</a>
          <a href="#tech" className="nav-link-hover" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>Technology</a>
        </nav>

        <button 
          onClick={() => setView('boot')}
          style={{
            background: 'transparent',
            border: '1px solid #00E676',
            color: '#00E676',
            padding: '8px 20px',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 0 10px rgba(0,230,118,0.05)'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(0, 230, 118, 0.08)';
            e.target.style.boxShadow = '0 0 15px rgba(0,230,118,0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'transparent';
            e.target.style.boxShadow = '0 0 10px rgba(0,230,118,0.05)';
          }}
        >
          Analyze Threats
        </button>
      </header>

      {/* Hero Section */}
      <section 
        style={{
          padding: '160px 40px 100px 40px',
          maxWidth: '1200px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 10,
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '40px',
          alignItems: 'center'
        }}
      >
        {/* Left Side Info */}
        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00E676' }} className="animate-pulse" />
            <span style={{ fontSize: '11px', letterSpacing: '3px', color: '#00E676', fontWeight: 'bold' }}>SYSTEM ONLINE</span>
          </div>
          
          <h1 style={{ fontSize: '42px', fontWeight: '900', color: '#fff', letterSpacing: '-1px', margin: 0, lineHeight: '1.1' }}>
            Multi-Agent AI Cyber Fraud Detection Platform
          </h1>
          
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6', maxWidth: '560px', margin: 0 }}>
            ScamON orchestrates autonomous, specialized AI agents to scan, analyze, and correlation-verify fraud vectors in real time, rendering deep forensics telemetry and automated authority reports.
          </p>

          {/* Checklist Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px', margin: '10px 0' }}>
            {[
              "Scam Websites", "Phishing Emails", "Fraud Calls", "SMS Scams", 
              "Fake QR Codes", "Fake APKs", "Social Engineering", "Image Based Scams"
            ].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#fff' }}>
                <span style={{ color: '#00E676', fontWeight: 'bold' }}>✓</span>
                <span style={{ color: 'rgba(255,255,255,0.85)' }}>{item}</span>
              </div>
            ))}
          </div>

          {/* Action Trigger Button */}
          <div style={{ marginTop: '10px' }}>
            <button 
              onClick={() => setView('boot')}
              style={{
                background: '#00E676',
                border: '1px solid #00E676',
                color: '#05070A',
                padding: '16px 40px',
                fontSize: '13px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.3s ease',
                boxShadow: '0 0 20px rgba(0, 230, 118, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#00C853';
                e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 230, 118, 0.4)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#00E676';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 230, 118, 0.2)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <Activity style={{ width: '16px', height: '16px' }} />
              ANALYZE THREATS
            </button>
          </div>

          {/* Animated Statistics */}
          <div style={{ display: 'flex', gap: '30px', marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px' }}>
            <div>
              <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#00E676' }}>
                <Counter value={9} />
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginTop: '4px' }}>AI Agents</div>
            </div>
            <div>
              <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#fff' }}>
                24/7
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginTop: '4px' }}>Monitoring</div>
            </div>
            <div>
              <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#fff' }}>
                <Counter value={99} />%
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginTop: '4px' }}>Detection Rate</div>
            </div>
            <div>
              <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#fff' }}>
                100%
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginTop: '4px' }}>Integrity</div>
            </div>
          </div>
        </div>

        {/* Right Side Cyber security Animation */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div 
            style={{
              position: 'relative',
              width: '320px',
              height: '320px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Outer radar rotating border */}
            <div 
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                border: '1px dashed rgba(0, 230, 118, 0.25)',
                borderRadius: '50%',
                animation: 'spin 40s linear infinite'
              }}
            />
            {/* Inner radar sweeping line */}
            <div 
              style={{
                position: 'absolute',
                width: '80%',
                height: '88%',
                border: '1px solid rgba(0, 230, 118, 0.1)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              {/* Radar sweep indicator */}
              <div 
                style={{
                  position: 'absolute',
                  width: '50%',
                  height: '50%',
                  top: 0,
                  left: '50%',
                  background: 'linear-gradient(90deg, rgba(0, 230, 118, 0.15) 0%, transparent 100%)',
                  transformOrigin: 'bottom left',
                  animation: 'spin 4s linear infinite'
                }}
              />
            </div>

            {/* Glowing Center Shield Logo */}
            <div 
              style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                background: '#05070A',
                border: '2px solid #00E676',
                boxShadow: '0 0 25px rgba(0, 230, 118, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 5
              }}
            >
              <Shield style={{ width: '36px', height: '36px', color: '#00E676' }} className="animate-pulse" />
            </div>

            {/* Simulated Nodes orbiting */}
            {[
              { top: '15%', left: '20%', label: "WEB_AGT" },
              { top: '80%', left: '15%', label: "SMS_AGT" },
              { top: '30%', left: '80%', label: "CALL_AGT" },
              { top: '75%', left: '75%', label: "CORRELATOR" }
            ].map((node, i) => (
              <div 
                key={i} 
                style={{
                  position: 'absolute',
                  top: node.top,
                  left: node.left,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  zIndex: 6
                }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00E676', boxShadow: '0 0 10px #00E676' }} />
                <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{node.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Agents Section */}
      <section id="agents" style={{ padding: '80px 40px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <FadeInSection>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <span style={{ fontSize: '11px', color: '#00E676', letterSpacing: '2px', fontWeight: 'bold' }}>ORCHESTRATED DEFENSE LAYER</span>
              <h2 style={{ fontSize: '30px', fontWeight: 'bold', color: '#fff', letterSpacing: '-0.5px', marginTop: '8px', textTransform: 'uppercase' }}>Autonomous AI Multi-Agents</h2>
              <div style={{ width: '40px', height: '2px', backgroundColor: '#00E676', margin: '16px auto 0 auto' }} />
            </div>

            {/* Agents Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
              {[
                { name: "Master Orchestrator", icon: Cpu, desc: "Triggers and dynamically forwards threats across pipeline registries." },
                { name: "Website Investigation", icon: Globe, desc: "Scans SSL, WHOIS age, domain redirection, and brand spoofing." },
                { name: "Email Investigation", icon: Mail, desc: "Audits headers, DKIM authenticity, and phishing link indexes." },
                { name: "SMS Investigation", icon: MessageSquare, desc: "Monitors and intercepts text fraud and smishing link chains." },
                { name: "Call Analysis", icon: PhoneCall, desc: "Transcribes phone call voice vectors and highlights verbal scams." },
                { name: "Live Call Detector", icon: Activity, desc: "Performs real-time audio scans and generates instant risk metrics." },
                { name: "Visual Investigation", icon: Camera, desc: "Captures screenshots and checks visual impersonation markers." },
                { name: "Complaint Agent", icon: FileText, desc: "Compiles complete timeline reports and drafts authority letters." },
                { name: "Explainability (XAI)", icon: HelpCircle, desc: "Provides transparent reasoning detailing risk indicators." }
              ].map((agent, index) => {
                const IconComponent = agent.icon;
                return (
                  <div 
                    key={index}
                    style={{
                      border: '1px solid rgba(0, 230, 118, 0.15)',
                      background: 'rgba(5, 7, 10, 0.4)',
                      padding: '24px',
                      textAlign: 'left',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#00E676';
                      e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 230, 118, 0.1)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(0, 230, 118, 0.15)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                      <div style={{ width: '32px', height: '32px', border: '1px solid rgba(0,230,118,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,230,118,0.03)' }}>
                        <IconComponent style={{ width: '16px', height: '16px', color: '#00E676' }} />
                      </div>
                      <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', margin: 0, textTransform: 'uppercase', fontFamily: 'monospace' }}>{agent.name}</h4>
                    </div>
                    <p style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: '1.5' }}>{agent.desc}</p>
                  </div>
                );
              })}
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" style={{ padding: '80px 40px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <FadeInSection>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <span style={{ fontSize: '11px', color: '#00E676', letterSpacing: '2px', fontWeight: 'bold' }}>DATA FLOW PIPELINE</span>
              <h2 style={{ fontSize: '30px', fontWeight: 'bold', color: '#fff', letterSpacing: '-0.5px', marginTop: '8px', textTransform: 'uppercase' }}>Threat Hunting Pipeline</h2>
              <div style={{ width: '40px', height: '2px', backgroundColor: '#00E676', margin: '16px auto 0 auto' }} />
            </div>

            {/* Pipeline Flowchart Layout */}
            <div 
              style={{
                display: 'flex', 
                flexDirection: 'column', 
                gap: '24px', 
                alignItems: 'center',
                background: 'rgba(5, 7, 10, 0.4)',
                border: '1px solid rgba(0, 230, 118, 0.1)',
                padding: '40px',
                position: 'relative'
              }}
            >
              {/* Flow Path */}
              {[
                { step: "USER INPUT", details: "Scam URL, email campaign, voice call, or visual QR sequence" },
                { step: "MASTER ORCHESTRATOR", details: "Initial threat triage & pipeline scheduling" },
                { step: "SPECIALIZED AGENT AUDITING", details: "Website Scanner, Email Checker, SMS Collector, Call Analyzer, Visual Impersonation Scan" },
                { step: "THREAT CORRELATION & VAULT HISTORY", details: "Cross-vector data linkage & immutable SHA-256 archiving" },
                { step: "EXPLAINABLE DECISION & COMPLAINT SYSTEM", details: "Interactive AI audit logs & regulatory authority ready briefs" },
                { step: "CYBER SECURITY DASHBOARD", details: "Unified live analytics telemetry monitoring console" }
              ].map((flow, index, arr) => (
                <React.Fragment key={index}>
                  <div 
                    style={{
                      width: '100%',
                      maxWidth: '480px',
                      border: '1px solid rgba(0,230,118,0.2)',
                      background: '#05070A',
                      padding: '16px 20px',
                      textAlign: 'center',
                      position: 'relative',
                      boxShadow: '0 0 15px rgba(0,0,0,0.5)'
                    }}
                  >
                    <div style={{ fontSize: '10px', color: '#00E676', fontFamily: 'monospace', fontWeight: 'bold', marginBottom: '4px' }}>STEP 0{index + 1}</div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px' }}>{flow.step}</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>{flow.details}</div>
                  </div>
                  {index < arr.length - 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '1px', height: '20px', backgroundColor: '#00E676', opacity: 0.5 }} />
                      <span style={{ fontSize: '9px', color: '#00E676', fontWeight: 'bold' }}>▼</span>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* Features Section */}
      <section id="tech" style={{ padding: '80px 40px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <FadeInSection>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <span style={{ fontSize: '11px', color: '#00E676', letterSpacing: '2px', fontWeight: 'bold' }}>SYSTEM SPECS & CAPABILITIES</span>
              <h2 style={{ fontSize: '30px', fontWeight: 'bold', color: '#fff', letterSpacing: '-0.5px', marginTop: '8px', textTransform: 'uppercase' }}>Platform Features</h2>
              <div style={{ width: '40px', height: '2px', backgroundColor: '#00E676', margin: '16px auto 0 auto' }} />
            </div>

            {/* Features list */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {[
                { title: "Real Time Monitoring", desc: "Passive interceptors listen for incoming SMS streams and call alerts instantly." },
                { title: "AI Powered Detection", desc: "Evaluates threat urgency using fine-tuned Llama security configurations." },
                { title: "Evidence Collection", desc: "Builds structured case files with permanent screenshots and source metrics." },
                { title: "Digital Forensics", desc: "Performs deep SSL socket handshakes, typosquat analysis, and DNS queries." },
                { title: "Government Complaint Generation", desc: "Automates reporting templates tailored for cybercrime authorities." },
                { title: "Multi Agent Reasoning", desc: "Cross-checks verdict variables between specialized pipelines automatically." },
                { title: "Explainable AI (XAI)", desc: "Dumps complete logs detailing why the agent flagged a threat." },
                { title: "Visual Scam Detection", desc: "Scrapes layout screenshots and decodes visual QR codes dynamically." }
              ].map((feat, index) => (
                <div 
                  key={index}
                  style={{
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(5, 7, 10, 0.25)',
                    padding: '24px',
                    textAlign: 'left'
                  }}
                >
                  <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>{feat.title}</h4>
                  <p style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: '1.5' }}>{feat.desc}</p>
                </div>
              ))}
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* Footer */}
      <footer 
        style={{
          borderTop: '1px solid rgba(0, 230, 118, 0.15)',
          background: '#020305',
          padding: '40px',
          textAlign: 'center',
          fontSize: '11px',
          color: 'rgba(255,255,255,0.5)',
          letterSpacing: '1px',
          lineHeight: '1.8'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Shield style={{ width: '16px', height: '16px', color: '#00E676' }} />
          <span style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '3px', color: '#fff' }}>
            SCAM<span style={{ color: '#00E676' }}>ON</span>
          </span>
        </div>
        <div>AI Multi-Agent Cyber Security Platform</div>
        <div style={{ color: '#00E676', fontWeight: 'bold', marginTop: '6px' }}>Built for Cyber Safety • © 2026</div>
      </footer>
    </div>
  );
}
