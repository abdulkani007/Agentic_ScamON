import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Shield, ShieldAlert, Volume2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LiveCallDetector() {
  const [isListening, setIsListening] = useState(false);
  const [timer, setTimer] = useState(0);
  const [micStatus, setMicStatus] = useState('STANDBY');
  const [transcript, setTranscript] = useState('');
  
  // AI analysis states
  const [analysis, setAnalysis] = useState({
    risk_score: 0,
    confidence: 'N/A',
    category: 'Analyzing...',
    reasoning: 'Awaiting conversation audio to perform forensic scan...',
    recommendation: 'Awaiting call data...'
  });

  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const soundIntervalRef = useRef(null);
  const transcriptEndRef = useRef(null);
  const chunksRef = useRef([]);

  // Auto-scroll transcript panel
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript]);

  // Audio timer handler
  useEffect(() => {
    if (isListening) {
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
      setTimer(0);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [isListening]);

  // High risk alarm sound trigger
  useEffect(() => {
    if (isListening && analysis.risk_score > 70) {
      // Play alarm beep every 2 seconds
      soundIntervalRef.current = setInterval(() => {
        playWarningBeep();
      }, 2000);
    } else {
      clearInterval(soundIntervalRef.current);
    }
    return () => clearInterval(soundIntervalRef.current);
  }, [isListening, analysis.risk_score]);

  // Web Audio Warning synthesizer
  const playWarningBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(988, audioCtx.currentTime); // B5 note
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.warn("Failed to synthesize warning sound:", e);
    }
  };

  const startListening = async () => {
    try {
      setMicStatus('REQUESTING PERMISSION...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Initialize WebSocket connection to Call Agent port 8000
      const wsUrl = `ws://127.0.0.1:8000/api/live-call/ws`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsListening(true);
        setMicStatus('LISTENING...');
        setTranscript('Connection established. Capturing audio from microphone...\n');
        chunksRef.current = [];

        // Start media recorder
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
            const completeBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(completeBlob);
            }
          }
        };

        // Stream audio in 3-second slices
        mediaRecorder.start(3000);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'transcript') {
            setTranscript(payload.text);
          } else if (payload.type === 'analysis') {
            setAnalysis(payload.data);
          }
        } catch (err) {
          console.error("Error parsing WebSocket packet:", err);
        }
      };

      wsRef.current.onclose = () => {
        stopListening();
      };

      wsRef.current.onerror = (err) => {
        console.error("WebSocket error:", err);
        stopListening();
      };

    } catch (err) {
      console.error("Failed to start live listening:", err);
      setMicStatus('PERMISSION DENIED OR DEVICE ERROR');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    setIsListening(false);
    setMicStatus('STANDBY');
    
    // Stop recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      } catch (e) {
        console.warn("Failed to stop media recorder stream:", e);
      }
    }
    mediaRecorderRef.current = null;

    // Close WebSocket
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send("STOP");
      }
      try {
        wsRef.current.close();
      } catch (e) {}
    }
    wsRef.current = null;
    
    clearInterval(timerIntervalRef.current);
    clearInterval(soundIntervalRef.current);
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const getRiskColor = (score) => {
    if (score >= 71) return '#FF3D00'; // Red
    if (score >= 31) return '#FFA000'; // Yellow
    return '#00E676'; // Green
  };

  const getRiskLevel = (score) => {
    if (score >= 71) return 'Scam Detected';
    if (score >= 31) return 'Suspicious';
    return 'Safe';
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Risk Alert Banner */}
      <AnimatePresence>
        {isListening && analysis.risk_score > 70 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              background: 'rgba(255, 61, 0, 0.15)',
              border: '1px solid #FF3D00',
              color: '#FF3D00',
              padding: '16px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 0 15px rgba(255, 61, 0, 0.2)'
            }}
          >
            <ShieldAlert style={{ width: '24px', height: '24px', animation: 'pulse 1s infinite' }} />
            <div>
              <strong style={{ display: 'block', fontSize: '14px', letterSpacing: '1px' }}>🚨 HIGH RISK SCAM DETECTED</strong>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                Urgent warning: Do not share OTPs, credit cards, or security pin numbers. Recommendation: {analysis.recommendation}.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Smartphone animation column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          
          <div style={{ position: 'relative' }}>
            {/* Pulsing glow ring when listening */}
            {isListening && (
              <div 
                className="pulse-glow" 
                style={{ 
                  position: 'absolute', 
                  top: '-20px', 
                  left: '-20px', 
                  right: '-20px', 
                  bottom: '-20px', 
                  borderRadius: '36px',
                  boxShadow: `0 0 40px ${getRiskColor(analysis.risk_score)}30`,
                  border: `1px solid ${getRiskColor(analysis.risk_score)}20`,
                  animation: 'pulse 1.5s infinite ease-in-out'
                }}
              />
            )}

            {/* Smartphone Shell Frame */}
            <div 
              style={{
                width: '240px',
                height: '420px',
                background: '#04070a',
                border: `3px solid ${isListening ? getRiskColor(analysis.risk_score) : 'rgba(255,255,255,0.15)'}`,
                borderRadius: '32px',
                boxShadow: isListening ? `0 0 25px ${getRiskColor(analysis.risk_score)}20` : 'none',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '20px 12px',
                boxSizing: 'border-box',
                transition: 'border-color 0.5s ease'
              }}
            >
              {/* Speaker Notch */}
              <div style={{ width: '60px', height: '4px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px', marginBottom: '16px' }} />
              
              {/* Active Call UI */}
              <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}>
                
                <div>
                  <h4 style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', textAlign: 'center', margin: 0 }}>
                    {isListening ? 'INVESTIGATOR MONITORING' : 'AGENT STANDBY'}
                  </h4>
                  <p style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', textAlign: 'center', marginTop: '6px' }}>
                    {isListening ? 'Laptop Microphone' : 'No Active Feed'}
                  </p>
                </div>

                {/* Pulsing avatar */}
                <div 
                  style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    background: isListening ? `rgba(${analysis.risk_score > 70 ? '255,61,0' : '0,230,118'}, 0.1)` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isListening ? getRiskColor(analysis.risk_score) : 'rgba(255,255,255,0.1)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: isListening ? 'pulse 2s infinite' : 'none'
                  }}
                >
                  <Phone style={{ width: '32px', height: '32px', color: isListening ? getRiskColor(analysis.risk_score) : 'var(--text-muted)' }} />
                </div>

                {/* Live timer / wave display */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  {isListening && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: getRiskColor(analysis.risk_score), fontSize: '11px', fontWeight: 'bold' }}>
                      <Clock style={{ width: '12px', height: '12px' }} />
                      <span>{formatTimer(timer)}</span>
                    </div>
                  )}
                  
                  {/* Wave Animation */}
                  <div style={{ display: 'flex', gap: '4px', height: '24px', alignItems: 'center' }}>
                    {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
                      <div 
                        key={bar}
                        style={{
                          width: '3px',
                          height: isListening ? '100%' : '4px',
                          background: isListening ? getRiskColor(analysis.risk_score) : 'rgba(255,255,255,0.2)',
                          borderRadius: '1.5px',
                          animation: isListening ? `pulse ${0.6 + bar * 0.1}s infinite alternate ease-in-out` : 'none'
                        }}
                      />
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>

          <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', textTransform: 'uppercase', letterSpacing: '1px', margin: '8px 0 0 0' }}>
            Live Call Detector (Beta)
          </h3>

          <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
            {!isListening ? (
              <button 
                onClick={startListening}
                className="btn-primary"
                style={{ flex: 1, height: '40px', background: 'rgba(0, 230, 118, 0.1)', borderColor: 'var(--accent-green)', color: '#fff' }}
              >
                <Phone style={{ width: '14px', height: '14px', marginRight: '8px' }} />
                START LISTENING
              </button>
            ) : (
              <button 
                onClick={stopListening}
                className="btn-primary"
                style={{ flex: 1, height: '40px', background: 'rgba(255, 61, 0, 0.1)', borderColor: '#FF3D00', color: '#fff' }}
              >
                <PhoneOff style={{ width: '14px', height: '14px', marginRight: '8px' }} />
                STOP LISTENING
              </button>
            )}
          </div>

          <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            STATUS: {micStatus}
          </span>

        </div>

        {/* Right side transcript and analysis logs panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '420px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', flex: 1 }}>
            
            {/* Live Transcript scroll box */}
            <div className="glass-panel card" style={{ margin: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <span className="card-title">LIVE CONVERSATION TRANSCRIPT</span>
              <div 
                style={{
                  flex: 1,
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.03)',
                  padding: '16px',
                  borderRadius: '4px',
                  overflowY: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  lineHeight: '1.6',
                  color: '#fff',
                  whiteSpace: 'pre-wrap',
                  marginTop: '12px'
                }}
              >
                {transcript || "Waiting for audio feed to transcribe conversation text..."}
                <div ref={transcriptEndRef} />
              </div>
            </div>

            {/* Live AI Analysis details card */}
            <div 
              className="glass-panel card" 
              style={{ 
                margin: 0, 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%',
                border: analysis.risk_score > 70 ? '1px solid rgba(255, 61, 0, 0.3)' : '1px solid rgba(255,255,255,0.06)',
                boxShadow: analysis.risk_score > 70 ? '0 0 20px rgba(255, 61, 0, 0.1)' : 'none',
                animation: analysis.risk_score > 70 ? 'pulse 2s infinite' : 'none'
              }}
            >
              <span className="card-title">LIVE FORENSIC MONITORING</span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px', flex: 1 }}>
                
                {/* Risk score meter */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)', padding: '12px', borderLeft: `4px solid ${getRiskColor(analysis.risk_score)}` }}>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>SCAM RISK SCORE</span>
                    <strong style={{ display: 'block', fontSize: '20px', color: '#fff', marginTop: '4px' }}>{analysis.risk_score}%</strong>
                  </div>
                  <div style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 'bold', color: getRiskColor(analysis.risk_score), background: `${getRiskColor(analysis.risk_score)}15`, padding: '4px 10px', border: `1px solid ${getRiskColor(analysis.risk_score)}` }}>
                    {getRiskLevel(analysis.risk_score)}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>SCAM CATEGORY</span>
                    <strong style={{ display: 'block', fontSize: '11px', color: '#fff', marginTop: '4px', textTransform: 'uppercase' }}>{analysis.category}</strong>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CONFIDENCE RATING</span>
                    <strong style={{ display: 'block', fontSize: '11px', color: '#fff', marginTop: '4px', textTransform: 'uppercase' }}>{analysis.confidence}</strong>
                  </div>
                </div>

                <div style={{ flex: 1, background: 'rgba(255,255,255,0.01)', padding: '12px', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '4px', overflowY: 'auto' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>FORENSIC EVIDENCE & REASONING</span>
                  <p style={{ fontSize: '11.5px', color: '#b2c0d2', marginTop: '8px', lineHeight: '1.5', margin: '8px 0 0 0' }}>
                    {analysis.reasoning}
                  </p>
                </div>

                <div style={{ background: 'rgba(255, 61, 0, 0.05)', border: `1px dashed ${getRiskColor(analysis.risk_score)}`, padding: '12px', borderRadius: '4px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Volume2 style={{ width: '12px', height: '12px' }} /> AI ACTION RECOMMENDATION
                  </span>
                  <strong style={{ display: 'block', fontSize: '12px', color: analysis.risk_score > 70 ? '#FF3D00' : '#fff', marginTop: '6px', textTransform: 'uppercase' }}>
                    {analysis.recommendation}
                  </strong>
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
