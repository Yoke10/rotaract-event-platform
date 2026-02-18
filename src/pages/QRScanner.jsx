import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { eventService } from '../services/eventService';
import { Link, useNavigate } from 'react-router-dom';
import {
    CheckCircle, XCircle, AlertCircle, Loader2, ArrowLeft, Lock,
    Camera, CameraOff, RefreshCw, SwitchCamera, Scan, ChevronRight, X
} from 'lucide-react';

const SCANNER_ID = 'qr-scanner-viewport';

export default function QRScanner() {
    const navigate = useNavigate();
    // ── Access Code State ──────────────────────────────────────────────
    const [accessCode, setAccessCode] = useState('');
    const [isAccessGranted, setIsAccessGranted] = useState(false);
    const [activeEvent, setActiveEvent] = useState(null);
    const [authError, setAuthError] = useState('');
    const [authLoading, setAuthLoading] = useState(false);

    // ── Category State ─────────────────────────────────────────────────
    const [selectedCategory, setSelectedCategory] = useState('');
    const selectedCategoryRef = useRef(''); // Ref to access state inside stale callbacks

    // Keep ref in sync
    useEffect(() => {
        selectedCategoryRef.current = selectedCategory;
    }, [selectedCategory]);

    // ── Camera / Scanner State ─────────────────────────────────────────
    const [cameraState, setCameraState] = useState('idle'); // idle | requesting | active | error | denied
    const [cameraError, setCameraError] = useState('');
    const [cameras, setCameras] = useState([]);
    const [activeCameraIndex, setActiveCameraIndex] = useState(0);

    // ── Scan Result State ──────────────────────────────────────────────
    const [scanResult, setScanResult] = useState(null);
    const [scanError, setScanError] = useState(null);
    const [scanLoading, setScanLoading] = useState(false);

    const html5QrcodeRef = useRef(null);
    const isScanningRef = useRef(false); // Prevent duplicate scans

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    // ── Access Code Handler ────────────────────────────────────────────
    const handleAccessSubmit = async (e) => {
        e.preventDefault();
        setAuthLoading(true);
        setAuthError('');

        try {
            const events = await eventService.getAllEvents();
            const normalizedInput = accessCode.trim().toUpperCase();
            const event = events.find(ev =>
                ev.accessCode &&
                ev.accessCode.trim().toUpperCase() === normalizedInput
            );

            if (event) {
                // Determine the correct initial category
                const getFirstCat = (ev) => {
                    if (ev.categories && ev.categories.length > 0) {
                        const first = ev.categories[0];
                        return typeof first === 'object' ? first.name : first;
                    }
                    return 'Entry';
                }

                setActiveEvent(event);
                setIsAccessGranted(true);

                const initialCat = getFirstCat(event);
                console.log("[QR Scanner] Access Granted. Auto-selected category:", initialCat);
                setSelectedCategory(initialCat);
            } else {
                setAuthError('Invalid Access Code. Please try again.');
            }
        } catch (error) {
            console.error('Access verification error:', error);
            setAuthError('Failed to verify code. Connection error?');
        } finally {
            setAuthLoading(false);
        }
    };

    // ── Camera Lifecycle ───────────────────────────────────────────────
    const stopCamera = useCallback(async () => {
        if (html5QrcodeRef.current) {
            try {
                const state = html5QrcodeRef.current.getState();
                // State 2 = SCANNING, State 3 = PAUSED
                if (state === 2 || state === 3) {
                    await html5QrcodeRef.current.stop();
                }
                html5QrcodeRef.current.clear();
            } catch (e) {
                // Ignore errors on cleanup
            }
            html5QrcodeRef.current = null;
        }
        isScanningRef.current = false;
        setCameraState('idle');
    }, []);

    const startCamera = useCallback(async (cameraId) => {
        setCameraState('requesting');
        setCameraError('');
        setScanResult(null);
        setScanError(null);

        // Stop any existing scanner first
        await stopCamera();

        // Small delay to let DOM settle
        await new Promise(r => setTimeout(r, 150));

        try {
            const scanner = new Html5Qrcode(SCANNER_ID, {
                formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                verbose: false,
            });
            html5QrcodeRef.current = scanner;

            const config = {
                fps: 15,
                qrbox: (viewfinderWidth, viewfinderHeight) => {
                    const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                    const size = Math.floor(minEdge * 0.7);
                    return { width: size, height: size };
                },
                aspectRatio: 1.0,
                disableFlip: false,
            };

            await scanner.start(
                cameraId,
                config,
                (decodedText) => {
                    if (!isScanningRef.current) {
                        isScanningRef.current = true;
                        handleScan(decodedText);
                    }
                },
                () => { /* Ignore scan failures */ }
            );

            setCameraState('active');
        } catch (err) {
            console.error('Camera start error:', err);
            html5QrcodeRef.current = null;

            const msg = err.message || '';
            if (msg.includes('Permission') || msg.includes('NotAllowed') || msg.includes('denied')) {
                setCameraState('denied');
                setCameraError('Camera permission was denied. Please allow camera access in your browser settings and try again.');
            } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
                setCameraState('error');
                setCameraError('No camera found on this device.');
            } else {
                setCameraState('error');
                setCameraError(`Could not start camera: ${msg}`);
            }
        }
    }, [stopCamera]);

    const requestCameraAccess = async () => {
        setCameraState('requesting');
        try {
            // First, enumerate cameras
            const deviceList = await Html5Qrcode.getCameras();
            if (!deviceList || deviceList.length === 0) {
                setCameraState('error');
                setCameraError('No camera found on this device.');
                return;
            }
            setCameras(deviceList);

            // Prefer back camera on mobile
            const backCameraIndex = deviceList.findIndex(d =>
                d.label.toLowerCase().includes('back') ||
                d.label.toLowerCase().includes('rear') ||
                d.label.toLowerCase().includes('environment')
            );
            const preferredIndex = backCameraIndex >= 0 ? backCameraIndex : 0;
            setActiveCameraIndex(preferredIndex);

            await startCamera(deviceList[preferredIndex].id);
        } catch (err) {
            console.error('Get cameras error:', err);
            const msg = err.message || '';
            if (msg.includes('Permission') || msg.includes('NotAllowed') || msg.includes('denied')) {
                setCameraState('denied');
                setCameraError('Camera permission was denied. Please allow camera access in your browser settings and try again.');
            } else {
                setCameraState('error');
                setCameraError('Could not access camera. Please check your device settings.');
            }
        }
    };

    const switchCamera = async () => {
        if (cameras.length < 2) return;
        const nextIndex = (activeCameraIndex + 1) % cameras.length;
        setActiveCameraIndex(nextIndex);
        await startCamera(cameras[nextIndex].id);
    };

    // ── Scan Handler ───────────────────────────────────────────────────
    const handleScan = async (rawValue) => {
        setScanLoading(true);
        setScanError(null);
        setScanResult(null);

        try {
            // ── Layer 1: Format Validation ──────────────────────────────
            // Our ticket IDs always follow the pattern: TKT_<timestamp>_<random>
            // Reject anything that doesn't match this format immediately.
            const trimmed = (rawValue || '').trim();
            if (!trimmed.startsWith('TKT_') || trimmed.split('_').length < 3) {
                throw new Error('Invalid QR Code — This is not a valid event ticket.');
            }

            // ── Layer 2: Database Lookup & Event Ownership ────────────────
            const ticket = await eventService.getTicketById(trimmed);

            const tId = ticket ? String(ticket.eventId || '').trim() : '';
            const aId = activeEvent ? String(activeEvent.id || '').trim() : '';

            // Check existence AND event ownership immediately
            if (!ticket || (activeEvent && tId !== aId)) {
                if (ticket) {
                    console.log(`[QR DEBUG] Cross-Event Scan Rejected. TicketEvent: '${tId}' | ActiveEvent: '${aId}'`);
                }
                throw new Error('Invalid QR Code — This ticket does not belong to this event.');
            }

            // ── Layer 3: Ticket Status Check ────────────────────────────
            if (ticket.status && ticket.status !== 'valid') {
                setScanError({
                    type: 'INVALID_STATUS',
                    message: 'Ticket Invalid',
                    details: `Current status: ${ticket.status.toUpperCase()}`,
                    ticket
                });
                return;
            }

            // (Layer 4 Event Match is now covered in Layer 2)

            // ── Layer 5: Category / Already Scanned Check ───────────────
            // Use ref to avoid stale closure issues in scanner callback
            const catCheck = (selectedCategoryRef.current || 'Entry').trim();
            console.log(`[QR DEBUG] Checking Category: '${catCheck}' | Existing Scans:`, ticket.scans);

            // Check if scanned in THIS category
            const alreadyScannedAt = ticket.scans && ticket.scans[catCheck];

            if (alreadyScannedAt) {
                setScanError({
                    type: 'ALREADY_SCANNED',
                    message: 'Already Checked In', // Used by frontend to show yellow warning
                    details: `Scanned for '${catCheck}' at ${new Date(alreadyScannedAt).toLocaleTimeString()} (Ticket Event: ${tId})`,
                    ticket,
                });
                return;
            }

            // ── All checks passed — Mark as scanned ─────────────────────
            console.log(`[QR DEBUG] Marking valid scan for '${catCheck}'`);
            const result = await eventService.markTicketScanned(ticket.firestoreId, catCheck);

            setScanResult({
                type: 'SUCCESS',
                ticket: { ...ticket, ...result }, // update ticket with new scan data
                scannedCategory: catCheck
            });

        } catch (error) {
            console.error("Scan error:", error);
            setScanError({
                type: 'ERROR',
                message: 'Processing Error',
                details: error.message || "Unknown error occurred",
            });
        } finally {
            setScanLoading(false);
            // Always reset the scanning lock so the next scan can proceed
            isScanningRef.current = false;

            // Re-focus or optional haptic feedback could go here
        }
    };

    const resetScan = () => {
        setScanResult(null);
        setScanError(null);
        // Ensure scanning lock is released when user dismisses result
        isScanningRef.current = false;
    };

    const changeEvent = async () => {
        await stopCamera();
        setIsAccessGranted(false);
        setActiveEvent(null);
        setSelectedCategory('');
        setAccessCode('');
        setScanResult(null);
        setScanError(null);
    };

    // ══════════════════════════════════════════════════════════════════
    // ─── ACCESS CODE VIEW ─────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════
    if (!isAccessGranted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-950">
                <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/30">
                            <Scan className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Event Scanner</h1>
                        <p className="text-gray-400 mt-2 text-sm">Enter the event access code to begin scanning tickets.</p>
                    </div>

                    <form onSubmit={handleAccessSubmit} className="space-y-4">
                        <input
                            type="text"
                            value={accessCode}
                            onChange={(e) => setAccessCode(e.target.value)}
                            placeholder="Enter Access Code"
                            autoCapitalize="characters"
                            className="w-full bg-gray-800 border border-gray-700 text-white text-center text-xl tracking-[0.3em] uppercase rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-600 placeholder:tracking-normal placeholder:text-base"
                        />
                        {authError && (
                            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {authError}
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={authLoading || !accessCode.trim()}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-indigo-500/30 transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                        >
                            {authLoading ? (
                                <><Loader2 className="animate-spin w-5 h-5" /> Verifying...</>
                            ) : (
                                <><Lock className="w-5 h-5" /> Unlock Scanner</>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link to="/" className="text-gray-500 hover:text-indigo-400 transition-colors flex items-center justify-center gap-2 text-sm">
                            <ArrowLeft className="w-4 h-4" /> Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ══════════════════════════════════════════════════════════════════
    // ─── CATEGORY SELECTION VIEW ──────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════

    // Categories can be stored as strings ["Entry"] or objects [{name: "Entry"}]
    // Always normalize to plain strings so the `scans` map key is consistent
    const normalizeCat = (cat) => {
        if (typeof cat === 'string') return cat;
        if (typeof cat === 'object' && cat !== null && cat.name) return cat.name;
        return String(cat);
    };
    const eventCategories = activeEvent?.categories?.length > 0
        ? activeEvent.categories.map(normalizeCat)
        : ['Entry'];

    if (!selectedCategory) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
                <div className="max-w-lg w-full">
                    <div className="text-center mb-8">
                        <p className="text-indigo-400 text-sm font-medium uppercase tracking-widest mb-2">Now Scanning</p>
                        <h1 className="text-3xl font-bold text-white">{activeEvent.name}</h1>
                        <button onClick={changeEvent} className="text-gray-500 hover:text-gray-300 text-sm mt-2 transition-colors">
                            Change Event
                        </button>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-white mb-2">Select Check-in Station</h2>
                        <p className="text-gray-400 text-sm mb-5">Choose which checkpoint you are scanning for:</p>
                        <div className="space-y-3">
                            {eventCategories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className="w-full flex items-center justify-between p-4 bg-gray-800 hover:bg-indigo-600/20 border border-gray-700 hover:border-indigo-500 rounded-xl transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center group-hover:bg-indigo-500/30 transition-colors">
                                            <Scan className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <span className="text-white font-semibold">{category}</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-indigo-400 transition-colors" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }


    // ══════════════════════════════════════════════════════════════════
    // ─── SCANNER VIEW ─────────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════════
    return (
        <div className="min-h-screen bg-gray-950 flex flex-col">
            {/* Top Bar */}
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800 bg-gray-900/80 backdrop-blur-md sticky top-0 z-50">
                <div className="min-w-0 flex-1 mr-4">
                    <p className="text-xs text-gray-500 uppercase tracking-widest">Scanning</p>
                    <h1 className="text-white font-bold text-lg leading-tight truncate">{activeEvent.name}</h1>
                    <p className="text-indigo-400 text-sm font-medium truncate">{selectedCategory} Station</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                    <button
                        onClick={() => { stopCamera(); setSelectedCategory(''); }}
                        className="text-xs text-gray-400 hover:text-white bg-gray-800 border border-gray-700 py-2 px-3 rounded-lg transition-colors whitespace-nowrap"
                    >
                        Change Station
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 border border-red-600 py-2 px-3 rounded-lg transition-colors shadow-lg shadow-red-900/20 whitespace-nowrap"
                    >
                        <X className="w-4 h-4" /> Close
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col md:flex-row gap-0 md:gap-6 p-4 md:p-6 max-w-4xl mx-auto w-full">

                {/* Camera Panel */}
                <div className="flex-1 flex flex-col">
                    {/* Viewport */}
                    <div className="relative bg-black rounded-2xl overflow-hidden aspect-square md:aspect-auto md:flex-1 min-h-[300px]">
                        {/* The scanner mounts here */}
                        <div id={SCANNER_ID} className="w-full h-full" />

                        {/* Overlay when idle/error/denied */}
                        {cameraState !== 'active' && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 rounded-2xl">
                                {cameraState === 'idle' && (
                                    <>
                                        <div className="w-24 h-24 border-4 border-dashed border-gray-700 rounded-2xl mb-6 flex items-center justify-center">
                                            <Camera className="w-10 h-10 text-gray-600" />
                                        </div>
                                        <p className="text-gray-400 text-sm mb-6 text-center px-4">
                                            Camera is off. Tap the button below to start scanning.
                                        </p>
                                        <button
                                            onClick={requestCameraAccess}
                                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-indigo-500/30"
                                        >
                                            <Camera className="w-5 h-5" /> Start Camera
                                        </button>
                                    </>
                                )}

                                {cameraState === 'requesting' && (
                                    <>
                                        <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
                                        <p className="text-gray-300 font-medium">Requesting camera access...</p>
                                        <p className="text-gray-500 text-sm mt-2 text-center px-4">
                                            Please allow camera permission when prompted by your browser.
                                        </p>
                                    </>
                                )}

                                {cameraState === 'denied' && (
                                    <>
                                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                                            <CameraOff className="w-8 h-8 text-red-400" />
                                        </div>
                                        <p className="text-red-400 font-bold text-lg mb-2">Camera Access Denied</p>
                                        <p className="text-gray-400 text-sm text-center px-6 mb-6">{cameraError}</p>
                                        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mx-4 text-sm text-gray-400 mb-4">
                                            <p className="font-semibold text-gray-300 mb-2">How to fix:</p>
                                            <ul className="space-y-1 list-disc list-inside">
                                                <li>Click the camera icon in your browser's address bar</li>
                                                <li>Select "Allow" for camera access</li>
                                                <li>Refresh the page</li>
                                            </ul>
                                        </div>
                                        <button
                                            onClick={requestCameraAccess}
                                            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-5 py-2.5 rounded-xl transition-colors text-sm"
                                        >
                                            <RefreshCw className="w-4 h-4" /> Try Again
                                        </button>
                                    </>
                                )}

                                {cameraState === 'error' && (
                                    <>
                                        <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
                                            <AlertCircle className="w-8 h-8 text-yellow-400" />
                                        </div>
                                        <p className="text-yellow-400 font-bold text-lg mb-2">Camera Error</p>
                                        <p className="text-gray-400 text-sm text-center px-6 mb-6">{cameraError}</p>
                                        <button
                                            onClick={requestCameraAccess}
                                            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-5 py-2.5 rounded-xl transition-colors text-sm"
                                        >
                                            <RefreshCw className="w-4 h-4" /> Retry
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Scanning overlay (corner brackets) */}
                        {cameraState === 'active' && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                <div className="relative w-56 h-56">
                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg" />
                                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg" />
                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg" />
                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-400 rounded-br-lg" />
                                    {/* Scanning line animation */}
                                    <div className="absolute left-0 right-0 h-0.5 bg-indigo-400/70 animate-scan-line" style={{ top: '50%' }} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Camera Controls */}
                    {cameraState === 'active' && (
                        <div className="flex items-center justify-between mt-3 px-1">
                            <p className="text-gray-500 text-xs">Point camera at a ticket QR code</p>
                            <div className="flex gap-2">
                                {cameras.length > 1 && (
                                    <button
                                        onClick={switchCamera}
                                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        <SwitchCamera className="w-3.5 h-3.5" /> Flip
                                    </button>
                                )}
                                <button
                                    onClick={stopCamera}
                                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-400 bg-gray-800 border border-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    <CameraOff className="w-3.5 h-3.5" /> Stop
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Result Panel */}
                <div className="md:w-80 flex flex-col gap-4 mt-4 md:mt-0">
                    {/* Idle state */}
                    {!scanResult && !scanError && !scanLoading && (
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center flex-1 min-h-[200px]">
                            <div className="w-16 h-16 border-4 border-dashed border-gray-700 rounded-xl mb-4 flex items-center justify-center">
                                <Scan className="w-8 h-8 text-gray-600" />
                            </div>
                            <p className="text-gray-500 font-medium">Waiting for scan</p>
                            <p className="text-gray-600 text-sm mt-1">Point the camera at a QR code</p>
                        </div>
                    )}

                    {/* Loading */}
                    {scanLoading && (
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center flex-1 min-h-[200px]">
                            <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
                            <p className="text-white font-medium">Verifying ticket...</p>
                        </div>
                    )}

                    {/* Success */}
                    {scanResult && (
                        <div className="bg-green-500/10 border border-green-500/40 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                    <CheckCircle className="w-7 h-7 text-green-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-green-400">Valid Ticket!</h3>
                                    <p className="text-green-600 text-xs">{new Date().toLocaleTimeString()}</p>
                                </div>
                            </div>

                            <div className="space-y-3 bg-gray-900/60 rounded-xl p-4 mb-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm">Attendee</span>
                                    <span className="text-white font-bold text-sm">{scanResult.ticket.participantName}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm">Club</span>
                                    <span className="text-white text-sm">{scanResult.ticket.participantClub || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm">Station</span>
                                    <span className="text-indigo-300 font-medium text-sm">{selectedCategory}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400 text-sm">Ticket ID</span>
                                    <span className="text-gray-300 font-mono text-xs">{scanResult.ticket.ticketId?.substring(0, 12)}...</span>
                                </div>
                            </div>

                            <button
                                onClick={resetScan}
                                className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-colors"
                            >
                                Scan Next
                            </button>
                        </div>
                    )}

                    {/* Error */}
                    {scanError && (
                        <div className={`rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4 ${scanError.type === 'ALREADY_SCANNED'
                            ? 'bg-yellow-500/10 border border-yellow-500/40'
                            : 'bg-red-500/10 border border-red-500/40'
                            }`}>
                            <div className="flex items-center gap-3 mb-5">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${scanError.type === 'ALREADY_SCANNED' ? 'bg-yellow-500/20' : 'bg-red-500/20'
                                    }`}>
                                    <XCircle className={`w-7 h-7 ${scanError.type === 'ALREADY_SCANNED' ? 'text-yellow-400' : 'text-red-400'
                                        }`} />
                                </div>
                                <div>
                                    <h3 className={`text-xl font-bold ${scanError.type === 'ALREADY_SCANNED' ? 'text-yellow-400' : 'text-red-400'
                                        }`}>
                                        {scanError.message}
                                    </h3>
                                    <p className="text-gray-400 text-xs">{scanError.details}</p>
                                </div>
                            </div>

                            {scanError.ticket && (
                                <div className="space-y-3 bg-gray-900/60 rounded-xl p-4 mb-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 text-sm">Attendee</span>
                                        <span className="text-white font-bold text-sm">{scanError.ticket.participantName}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 text-sm">Club</span>
                                        <span className="text-white text-sm">{scanError.ticket.participantClub || '-'}</span>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={resetScan}
                                className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors"
                            >
                                Dismiss
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
