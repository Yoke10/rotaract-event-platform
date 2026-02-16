import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { eventService } from '../services/eventService';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle, Loader2, ArrowLeft, Lock } from 'lucide-react';

export default function QRScanner() {
    // State for Access Code flow
    const [accessCode, setAccessCode] = useState('');
    const [isAccessGranted, setIsAccessGranted] = useState(false);
    const [activeEvent, setActiveEvent] = useState(null);
    const [authError, setAuthError] = useState('');

    // State for Scanner flow
    const [scanResult, setScanResult] = useState(null);
    const [scanError, setScanError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scannerReady, setScannerReady] = useState(false);

    useEffect(() => {
        if (isAccessGranted) {
            startScanner();
        }
        return () => {
            // Cleanup handled by Html5QrcodeScanner
            try {
                // Manually stop if needed, or rely on lib
                const element = document.getElementById("reader");
                if (element) element.innerHTML = "";
            } catch (e) { }
        };
    }, [isAccessGranted]);

    const handleAccessSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setAuthError('');

        try {
            // Fetch all events and find match
            const events = await eventService.getAllEvents();
            const event = events.find(ev => ev.accessCode && ev.accessCode === accessCode);

            if (event) {
                setActiveEvent(event);
                setIsAccessGranted(true);
            } else {
                setAuthError("Invalid Access Code. Please try again.");
            }
        } catch (error) {
            console.error("Access verification error:", error);
            setAuthError("Failed to verify code. Connection error?");
        } finally {
            setLoading(false);
        }
    };

    const startScanner = () => {
        setTimeout(() => {
            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                false
            );

            scanner.render(onScanSuccess, onScanFailure);
            setScannerReady(true);

            function onScanSuccess(decodedText) {
                handleScan(decodedText);
            }

            function onScanFailure(error) {
                // Ignore scan failures
            }
        }, 100);
    };

    const handleScan = async (bookingId) => {
        setLoading(true);
        setScanError(null);
        setScanResult(null);

        try {
            const booking = await eventService.getBookingById(bookingId);

            if (!booking) {
                throw new Error("Invalid Ticket - Booking not found");
            }

            // Optional: Verify if booking belongs to current event
            // if (activeEvent && booking.eventId !== activeEvent.id) {
            //     throw new Error("Ticket belongs to a different event");
            // }

            if (booking.scanned) {
                setScanError({
                    type: 'ALREADY_SCANNED',
                    message: 'Ticket Already Scanned',
                    details: `Scanned on: ${new Date(booking.scannedAt).toLocaleString()}`,
                    booking
                });
                return;
            }

            // Mark as scanned
            await eventService.markBookingScanned(booking.firestoreId || booking.id);

            setScanResult({
                type: 'SUCCESS',
                message: 'Verified Successfully',
                booking: { ...booking, scanned: true }
            });

        } catch (error) {
            setScanError({
                type: 'ERROR',
                message: 'Error Processing Ticket',
                details: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    const resetScan = () => {
        setScanResult(null);
        setScanError(null);
    };

    // ─── ACCESS CODE VIEW ──────────────────────────────────────────────
    if (!isAccessGranted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="max-w-md w-full glass-card p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                            <Lock className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold gradient-text">Scanner Access</h1>
                        <p className="text-gray-600 mt-2">Enter the Event Access Code to start scanning.</p>
                    </div>

                    <form onSubmit={handleAccessSubmit} className="space-y-6">
                        <div>
                            <input
                                type="text"
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value)}
                                placeholder="Enter Access Code"
                                className="glass-input text-center text-lg tracking-widest uppercase"
                            />
                            {authError && <p className="text-red-400 text-sm mt-2 text-center">{authError}</p>}
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : "Start Scanning"}
                        </button>
                    </form>
                    <div className="mt-8 text-center">
                        <Link to="/" className="text-gray-500 hover:text-indigo-600 transition-colors flex items-center justify-center">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ─── SCANNER VIEW ────────────────────────────────────────────────
    return (
        <div className="min-h-screen p-4">
            <div className="max-w-4xl mx-auto mt-10">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold gradient-text">Scanning: {activeEvent.name}</h1>
                        <p className="text-gray-600 text-sm">Validating tickets for this event</p>
                    </div>
                    <button
                        onClick={() => setIsAccessGranted(false)}
                        className="text-sm text-gray-500 hover:text-indigo-600 bg-white border border-gray-200 py-2 px-4 rounded-lg transition-colors"
                    >
                        Change Event
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Scanner */}
                    <div className="glass-card p-4 overflow-hidden">
                        <div id="reader" className="w-full"></div>
                    </div>

                    {/* Results */}
                    <div className="space-y-4">
                        {!scanResult && !scanError && (
                            <div className="glass-card p-8 text-center h-full flex flex-col justify-center items-center">
                                <div className="w-16 h-16 border-4 border-dashed border-gray-300 rounded-lg mb-4 opacity-50"></div>
                                <p className="text-gray-500">Point camera at a ticket QR code</p>
                            </div>
                        )}

                        {scanResult && (
                            <div className="bg-green-500/10 border border-green-500/50 rounded-xl p-6 animate-in fade-in slide-in-from-bottom-4">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-green-500/20 rounded-full">
                                        <CheckCircle className="w-8 h-8 text-green-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-green-400">Valid Ticket</h3>
                                        <p className="text-green-300/60 text-sm">{new Date().toLocaleTimeString()}</p>
                                    </div>
                                </div>
                                <div className="space-y-3 p-4 bg-gray-900/50 rounded-lg">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Attendee</span>
                                        <span className="text-white font-medium">{scanResult.booking.userName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Type</span>
                                        <span className="text-white">{scanResult.booking.ticketType || 'Standard'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Tickets</span>
                                        <span className="text-white">{scanResult.booking.numberOfTickets}</span>
                                    </div>
                                </div>
                                <button onClick={resetScan} className="w-full mt-4 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition-colors">
                                    Scan Next
                                </button>
                            </div>
                        )}

                        {scanError && (
                            <div className={`rounded-xl p-6 animate-in fade-in slide-in-from-bottom-4 ${scanError.type === 'ALREADY_SCANNED' ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-red-500/10 border border-red-500/30'
                                }`}>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`p-3 rounded-full ${scanError.type === 'ALREADY_SCANNED' ? 'bg-yellow-500/20' : 'bg-red-500/20'}`}>
                                        <XCircle className={`w-8 h-8 ${scanError.type === 'ALREADY_SCANNED' ? 'text-yellow-500' : 'text-red-500'}`} />
                                    </div>
                                    <div>
                                        <h3 className={`text-xl font-bold ${scanError.type === 'ALREADY_SCANNED' ? 'text-yellow-400' : 'text-red-400'}`}>
                                            {scanError.message}
                                        </h3>
                                        <p className="text-gray-400 text-sm">{scanError.details}</p>
                                    </div>
                                </div>
                                {scanError.booking && (
                                    <div className="space-y-3 p-4 bg-gray-900/50 rounded-lg mb-4">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Attendee</span>
                                            <span className="text-white font-medium">{scanError.booking.userName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Last Scanned</span>
                                            <span className="text-white text-xs">{new Date(scanError.booking.scannedAt).toLocaleString()}</span>
                                        </div>
                                    </div>
                                )}
                                <button onClick={resetScan} className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors">
                                    Dismiss
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
