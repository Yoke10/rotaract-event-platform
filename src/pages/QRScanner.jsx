import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { eventService } from '../services/eventService';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle, XCircle, AlertCircle, Loader2, ArrowLeft, Lock,
  Camera, CameraOff, RefreshCw, SwitchCamera, Scan, ChevronRight, X
} from 'lucide-react';

const SCANNER_ID = 'qr-scanner-viewport';
// The global Navbar is fixed at top:0 and is h-20 (80px).
// All sticky/fixed elements inside the scanner must offset by 80px.
const NAV_H = 80;

// ─── Helpers ───────────────────────────────────────────────────────────────
function InfoRow({ label, value, accent, mono }) {
  return (
    <div className="flex justify-between items-start gap-3 py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs font-semibold text-gray-400 shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm font-semibold text-right break-all leading-snug ${mono ? 'font-mono text-xs' : ''} ${accent ? 'text-purple-700' : 'text-gray-800'}`}>
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ type }) {
  const map = {
    SUCCESS:         { dot: 'bg-emerald-500', text: 'text-emerald-700', label: 'Valid'     },
    ALREADY_SCANNED: { dot: 'bg-amber-500',   text: 'text-amber-700',   label: 'Duplicate' },
    ERROR:           { dot: 'bg-red-500',     text: 'text-red-700',     label: 'Invalid'   },
    INVALID_STATUS:  { dot: 'bg-red-500',     text: 'text-red-700',     label: 'Invalid'   },
  };
  const cfg = map[type] || map.ERROR;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white border ${cfg.text}`}
      style={{ border: '1px solid currentColor' }}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Scanner camera CSS — injected once ───────────────────────────────────
const CAMERA_CSS = `
#${SCANNER_ID} video {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  display: block !important;
}
#${SCANNER_ID} > div {
  width: 100% !important;
  height: 100% !important;
}
`;

// ─── Main component ────────────────────────────────────────────────────────
export default function QRScanner() {
  const navigate = useNavigate();

  // Auth state
  const [accessCode, setAccessCode]     = useState('');
  const [isAccessGranted, setIsAccess]  = useState(false);
  const [activeEvent, setActiveEvent]   = useState(null);
  const [authError, setAuthError]       = useState('');
  const [authLoading, setAuthLoading]   = useState(false);

  // Category
  const [selectedCategory, setSelectedCategory] = useState('');
  const selectedCategoryRef = useRef('');
  const activeEventRef      = useRef(null);
  useEffect(() => { selectedCategoryRef.current = selectedCategory; }, [selectedCategory]);
  useEffect(() => { activeEventRef.current = activeEvent; }, [activeEvent]);

  // Camera
  const [cameraState, setCameraState]   = useState('idle');
  const [cameraError, setCameraError]   = useState('');
  const [cameras, setCameras]           = useState([]);
  const [activeCamIdx, setActiveCamIdx] = useState(0);

  // Scan result
  const [scanResult,  setScanResult]    = useState(null);
  const [scanError,   setScanError]     = useState(null);
  const [scanLoading, setScanLoading]   = useState(false);

  const qrRef       = useRef(null);
  const scanningRef = useRef(false);

  // Inject camera CSS once
  useEffect(() => {
    const tag = document.createElement('style');
    tag.textContent = CAMERA_CSS;
    document.head.appendChild(tag);
    return () => document.head.removeChild(tag);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => { stopCamera(); }, []);

  // Auto-start camera when scanner view is active
  useEffect(() => {
    if (isAccessGranted && selectedCategory && cameraState === 'idle') {
      requestCameraAccess();
    }
  }, [isAccessGranted, selectedCategory]);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const handleAccessSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const events = await eventService.getAllEvents();
      const input  = accessCode.trim().toUpperCase();
      const event  = events.find(ev => ev.accessCode?.trim().toUpperCase() === input);
      if (event) {
        const firstCat = (ev) => {
          if (!ev.categories?.length) return 'Entry';
          const c = ev.categories[0];
          return (typeof c === 'object') ? c.name : String(c);
        };
        setActiveEvent(event);
        setIsAccess(true);
        setSelectedCategory(firstCat(event));
      } else {
        setAuthError('Invalid access code. Please try again.');
      }
    } catch {
      setAuthError('Connection error. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  // ── Camera ────────────────────────────────────────────────────────────────
  const stopCamera = useCallback(async () => {
    if (qrRef.current) {
      try {
        const s = qrRef.current.getState();
        if (s === 2 || s === 3) await qrRef.current.stop();
        qrRef.current.clear();
      } catch {}
      qrRef.current = null;
    }
    scanningRef.current = false;
    setCameraState('idle');
  }, []);

  const startCamera = useCallback(async (cameraId) => {
    setCameraState('requesting');
    setCameraError('');
    setScanResult(null);
    setScanError(null);
    if (qrRef.current) {
      try {
        const s = qrRef.current.getState();
        if (s === 2 || s === 3) await qrRef.current.stop();
        qrRef.current.clear();
      } catch {}
      qrRef.current = null;
    }
    await new Promise(r => setTimeout(r, 200));
    try {
      const scanner = new Html5Qrcode(SCANNER_ID, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      qrRef.current = scanner;
      await scanner.start(
        cameraId,
        {
          fps: 15,
          qrbox: (w, h) => {
            const side = Math.floor(Math.min(w, h) * 0.65);
            return { width: side, height: side };
          },
          aspectRatio: 1.0,
          disableFlip: false,
        },
        (text) => {
          if (!scanningRef.current) {
            scanningRef.current = true;
            handleScan(text);
          }
        },
        () => {}
      );
      setCameraState('active');
    } catch (err) {
      qrRef.current = null;
      const msg = err.message || '';
      if (/Permission|NotAllowed|denied/i.test(msg)) {
        setCameraState('denied');
        setCameraError('Camera permission denied.');
      } else if (/NotFound|DevicesNotFound/i.test(msg)) {
        setCameraState('error');
        setCameraError('No camera found on this device.');
      } else {
        setCameraState('error');
        setCameraError('Could not start camera. ' + msg);
      }
    }
  }, [stopCamera]);

  const requestCameraAccess = async () => {
    setCameraState('requesting');
    try {
      const list = await Html5Qrcode.getCameras();
      if (!list?.length) {
        setCameraState('error');
        setCameraError('No camera found on this device.');
        return;
      }
      setCameras(list);
      const backIdx = list.findIndex(d => /back|rear|environment/i.test(d.label));
      const idx = backIdx >= 0 ? backIdx : 0;
      setActiveCamIdx(idx);
      await startCamera(list[idx].id);
    } catch (err) {
      const msg = err.message || '';
      if (/Permission|NotAllowed|denied/i.test(msg)) {
        setCameraState('denied');
        setCameraError('Camera permission denied.');
      } else {
        setCameraState('error');
        setCameraError('Could not access camera.');
      }
    }
  };

  const switchCamera = async () => {
    if (cameras.length < 2) return;
    const next = (activeCamIdx + 1) % cameras.length;
    setActiveCamIdx(next);
    await startCamera(cameras[next].id);
  };

  // ── Scan handler ──────────────────────────────────────────────────────────
  const handleScan = async (raw) => {
    setScanLoading(true);
    setScanError(null);
    setScanResult(null);
    try {
      const trimmed = (raw || '').trim();
      if (!trimmed.startsWith('TKT_') || trimmed.split('_').length < 3)
        throw new Error('Not a valid event ticket QR code.');
      const ticket    = await eventService.getTicketById(trimmed);
      const liveEvent = activeEventRef.current;
      const tId = String(ticket?.eventId || '').trim();
      const aId = String(liveEvent?.id   || '').trim();
      if (!ticket || !liveEvent || tId !== aId)
        throw new Error('Ticket does not belong to this event.');
      if (ticket.status && ticket.status !== 'valid') {
        setScanError({ type: 'INVALID_STATUS', message: 'Ticket Invalid', details: 'Status: ' + ticket.status, ticket });
        return;
      }
      const cat = (selectedCategoryRef.current || 'Entry').trim();
      if (ticket.scans?.[cat]) {
        setScanError({ type: 'ALREADY_SCANNED', message: 'Already Checked In', details: 'Checked in at ' + new Date(ticket.scans[cat]).toLocaleTimeString(), ticket });
        return;
      }
      const result = await eventService.markTicketScanned(ticket.firestoreId, cat);
      setScanResult({ type: 'SUCCESS', ticket: { ...ticket, ...result }, scannedCategory: cat });
    } catch (err) {
      setScanError({ type: 'ERROR', message: 'Scan Failed', details: err.message || 'Unknown error.' });
    } finally {
      setScanLoading(false);
      scanningRef.current = false;
    }
  };

  const resetScan   = () => { setScanResult(null); setScanError(null); scanningRef.current = false; };
  const changeEvent = async () => {
    await stopCamera();
    setIsAccess(false);
    setActiveEvent(null);
    setSelectedCategory('');
    setAccessCode('');
    setScanResult(null);
    setScanError(null);
  };

  // ════════════════════════════════════════════════════════════════════════════
  // VIEW 1 — ACCESS CODE
  // ════════════════════════════════════════════════════════════════════════════
  if (!isAccessGranted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
        style={{ background: '#f7f7f9', paddingTop: `${NAV_H + 32}px` }}>
        <div className="w-full max-w-sm">
          {/* Brand header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-md"
              style={{ background: 'linear-gradient(135deg,#400763,#ed0775)' }}>
              <Scan className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-extrabold text-gray-900">Event Scanner</h1>
            <p className="text-sm text-gray-500 mt-1">Enter your event access code to begin</p>
          </div>

          {/* Card */}
          <div className="card-elevated rounded-2xl p-6">
            <form onSubmit={handleAccessSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                  Access Code
                </label>
                <input
                  type="text"
                  value={accessCode}
                  onChange={e => setAccessCode(e.target.value)}
                  placeholder="e.g. CONF2025"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full text-center text-lg font-bold tracking-widest uppercase rounded-xl px-4 py-3.5 outline-none transition-all"
                  style={{ border: '2px solid #e5e5e5', background: '#fafafa', color: '#1a1a1a', letterSpacing: '0.25em' }}
                  onFocus={e => e.target.style.borderColor = '#400763'}
                  onBlur={e  => e.target.style.borderColor = '#e5e5e5'}
                />
              </div>

              {authError && (
                <div className="flex items-start gap-2 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <button type="submit" disabled={authLoading || !accessCode.trim()} className="btn-primary w-full py-3 text-sm">
                {authLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Verifying…</>
                  : <><Lock className="w-4 h-4" />Unlock Scanner</>}
              </button>
            </form>
          </div>

          <div className="mt-5 text-center">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft className="w-4 h-4" />Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // VIEW 2 — CATEGORY SELECTION
  // ════════════════════════════════════════════════════════════════════════════
  const normalizeCat = c => (typeof c === 'object' && c?.name) ? c.name : String(c);
  const categories   = activeEvent?.categories?.length
    ? activeEvent.categories.map(normalizeCat)
    : ['Entry'];

  if (!selectedCategory) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
        style={{ background: '#f7f7f9', paddingTop: `${NAV_H + 32}px` }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-5">
            <span className="inline-block text-xs font-bold uppercase tracking-widest mb-1"
              style={{ color: '#ed0775' }}>Now Scanning</span>
            <h1 className="text-xl font-extrabold text-gray-900 leading-tight">{activeEvent.name}</h1>
            <button onClick={changeEvent} className="text-xs text-gray-400 hover:text-gray-600 transition-colors mt-1.5">
              ← Change event
            </button>
          </div>

          <div className="card-elevated rounded-2xl p-5">
            <p className="text-sm font-bold text-gray-800 mb-0.5">Select Check-in Station</p>
            <p className="text-xs text-gray-400 mb-4">Choose which checkpoint you are scanning</p>
            <div className="space-y-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl text-left transition-all group"
                  style={{ background: '#f7f7f9', border: '1px solid #ebebeb' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(64,7,99,0.05)'; e.currentTarget.style.borderColor = '#400763'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#f7f7f9'; e.currentTarget.style.borderColor = '#ebebeb'; }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(64,7,99,0.08)' }}>
                      <Scan className="w-4 h-4" style={{ color: '#400763' }} />
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{cat}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-600 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // VIEW 3 — SCANNER
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f7f7f9', paddingTop: `${NAV_H}px` }}>

      {/* ── Sub-header: sits immediately below the global Navbar ─────────── */}
      <header className="sticky z-40 bg-white border-b border-gray-100 shadow-sm"
        style={{ top: `${NAV_H}px` }}>
        <div className="max-w-xl mx-auto flex items-center justify-between px-4 h-12">
          <div className="min-w-0 flex-1 mr-3">
            <p className="text-xs font-bold uppercase tracking-widest leading-none"
              style={{ color: '#ed0775' }}>Live Scanning</p>
            <p className="text-sm font-extrabold text-gray-900 truncate leading-snug">
              {activeEvent.name}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
              style={{ background: 'linear-gradient(135deg,#400763,#ed0775)' }}>
              {selectedCategory}
            </span>
            <button
              onClick={() => { stopCamera(); setSelectedCategory(''); }}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
              Change
            </button>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors">
              <X className="w-3.5 h-3.5" />Exit
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-4 flex flex-col gap-4">

        {/* ── Camera card ─────────────────────────────────────────────────── */}
        <div className="card-elevated rounded-2xl overflow-hidden">

          {/*
            CAMERA VIEWPORT:
            - Always in DOM so html5-qrcode can mount its <video> element.
            - We force it square with aspect-ratio:1/1 and let the injected CSS
              make the inner <video> cover the square area.
            - On mobile the square fills the full card width.
            - On larger screens we cap it at 360px.
          */}
          <div
            id={SCANNER_ID}
            style={{
              display: cameraState === 'active' ? 'block' : 'none',
              width: '100%',
              aspectRatio: '1 / 1',
              maxWidth: '360px',
              maxHeight: '360px',
              margin: '0 auto',
              overflow: 'hidden',
              background: '#000',
              borderRadius: '0',
            }}
          />

          {/* State overlay (shown instead of the camera when not active) */}
          {cameraState !== 'active' && (
            <div className="flex flex-col items-center justify-center text-center px-6 py-10 gap-4">

              {cameraState === 'idle' && (
                <>
                  <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center">
                    <Camera className="w-7 h-7 text-gray-300" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-700">Camera is off</p>
                    <p className="text-xs text-gray-400 mt-0.5">Tap below to start scanning</p>
                  </div>
                  <button onClick={requestCameraAccess} className="btn-primary text-sm py-2.5 px-7">
                    <Camera className="w-4 h-4" />Start Camera
                  </button>
                </>
              )}

              {cameraState === 'requesting' && (
                <>
                  <Loader2 className="w-9 h-9 animate-spin" style={{ color: '#680b56' }} />
                  <div>
                    <p className="text-sm font-bold text-gray-700">Starting camera…</p>
                    <p className="text-xs text-gray-400 mt-0.5">Allow camera access when prompted</p>
                  </div>
                </>
              )}

              {cameraState === 'denied' && (
                <>
                  <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                    <CameraOff className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-red-600">Camera Access Denied</p>
                    <p className="text-xs text-gray-500 mt-1 max-w-xs">
                      {cameraError} Click the 🔒 icon in your browser address
                      bar → set Camera to Allow → tap Try Again.
                    </p>
                  </div>
                  <button onClick={requestCameraAccess} className="btn-secondary text-sm py-2 px-5">
                    <RefreshCw className="w-4 h-4" />Try Again
                  </button>
                </>
              )}

              {cameraState === 'error' && (
                <>
                  <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-600">Camera Error</p>
                    <p className="text-xs text-gray-400 mt-0.5">{cameraError}</p>
                  </div>
                  <button onClick={requestCameraAccess} className="btn-secondary text-sm py-2 px-5">
                    <RefreshCw className="w-4 h-4" />Retry
                  </button>
                </>
              )}
            </div>
          )}

          {/* Camera bottom controls bar */}
          {cameraState === 'active' && (
            <div className="flex items-center justify-between px-4 py-2 bg-white border-t border-gray-100">
              <p className="text-xs text-gray-400">Point at a ticket QR code</p>
              <div className="flex gap-2">
                {cameras.length > 1 && (
                  <button onClick={switchCamera}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                    <SwitchCamera className="w-3.5 h-3.5" />Flip
                  </button>
                )}
                <button onClick={stopCamera}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                  <CameraOff className="w-3.5 h-3.5" />Stop
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Result card ─────────────────────────────────────────────────── */}
        <div className="card-elevated rounded-2xl p-4">

          {/* Idle state */}
          {!scanResult && !scanError && !scanLoading && (
            <div className="flex flex-col items-center justify-center text-center py-6 gap-3">
              <div className="w-12 h-12 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center">
                <Scan className="w-5 h-5 text-gray-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Waiting for scan</p>
                <p className="text-xs text-gray-400 mt-0.5">Point the camera at a QR code</p>
              </div>
            </div>
          )}

          {/* Loading */}
          {scanLoading && (
            <div className="flex flex-col items-center justify-center text-center py-6 gap-3">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#680b56' }} />
              <p className="text-sm font-semibold text-gray-700">Verifying ticket…</p>
            </div>
          )}

          {/* Success */}
          {scanResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-emerald-700 leading-tight">Valid Ticket!</p>
                    <p className="text-xs text-gray-400">{new Date().toLocaleTimeString()}</p>
                  </div>
                </div>
                <StatusBadge type="SUCCESS" />
              </div>

              <div className="bg-gray-50 rounded-xl px-4 py-0.5">
                <InfoRow label="Name"    value={scanResult.ticket.participantName} />
                <InfoRow label="Club"    value={scanResult.ticket.participantClub || '—'} />
                <InfoRow label="Station" value={selectedCategory} accent />
                <InfoRow label="Ticket"  value={(scanResult.ticket.ticketId || '').slice(0, 18) + '…'} mono />
              </div>

              <button onClick={resetScan} className="btn-primary w-full py-2.5 text-sm">
                Scan Next Ticket
              </button>
            </div>
          )}

          {/* Error / Already scanned */}
          {scanError && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${scanError.type === 'ALREADY_SCANNED' ? 'bg-amber-50' : 'bg-red-50'}`}>
                    <XCircle className={`w-5 h-5 ${scanError.type === 'ALREADY_SCANNED' ? 'text-amber-600' : 'text-red-600'}`} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-extrabold leading-tight ${scanError.type === 'ALREADY_SCANNED' ? 'text-amber-700' : 'text-red-700'}`}>
                      {scanError.message}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{scanError.details}</p>
                  </div>
                </div>
                <StatusBadge type={scanError.type} />
              </div>

              {scanError.ticket && (
                <div className="bg-gray-50 rounded-xl px-4 py-0.5">
                  <InfoRow label="Name" value={scanError.ticket.participantName} />
                  <InfoRow label="Club" value={scanError.ticket.participantClub || '—'} />
                </div>
              )}

              <button onClick={resetScan}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                Dismiss
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}