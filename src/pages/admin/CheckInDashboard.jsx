import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { ArrowLeft, Users, CheckCircle, XCircle, Search, RefreshCw, Smartphone, MapPin, Wifi, WifiOff } from 'lucide-react';
import { db } from '../../services/firebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function CheckInDashboard({ isHostMode = false }) {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isLive, setIsLive] = useState(false);
    const [stats, setStats] = useState({ total: 0, checkedIn: 0, pending: 0 });
    const unsubscribeRef = useRef(null);

    // ── Load event data once ───────────────────────────────────────────
    useEffect(() => {
        loadEvent();
        return () => {
            // Cleanup real-time listener on unmount
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, [id]);

    const loadEvent = async () => {
        setLoading(true);
        try {
            const eventData = await eventService.getEvent(id);
            setEvent(eventData);

            if (eventData) {
                // Normalize categories: they may be stored as [{name: "Entry"}] or ["Entry"]
                const normalizedCategories = normalizeCategoryList(eventData.categories);
                const defaultCat = normalizedCategories.length > 0 ? normalizedCategories[0] : 'Entry';
                setSelectedCategory(defaultCat);

                // Start real-time listener for tickets
                startLiveListener();
            }
        } catch (error) {
            console.error("Error loading event:", error);
        } finally {
            setLoading(false);
        }
    };

    // ── Real-time Firestore listener ───────────────────────────────────
    const startLiveListener = () => {
        // Unsubscribe from any existing listener first
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
        }

        const q = query(
            collection(db, 'tickets'),
            where('eventId', '==', id)
        );

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const liveTickets = snapshot.docs.map(doc => ({
                    firestoreId: doc.id,
                    ...doc.data()
                }));
                // Sort alphabetically by name
                liveTickets.sort((a, b) => (a.participantName || '').localeCompare(b.participantName || ''));
                setTickets(liveTickets);
                setIsLive(true);
            },
            (error) => {
                console.error("Real-time listener error:", error);
                setIsLive(false);
                // Fallback: load once
                loadTicketsOnce();
            }
        );

        unsubscribeRef.current = unsubscribe;
    };

    const loadTicketsOnce = async () => {
        try {
            const eventTickets = await eventService.getEventTickets(id);
            eventTickets.sort((a, b) => (a.participantName || '').localeCompare(b.participantName || ''));
            setTickets(eventTickets);
        } catch (error) {
            console.error("Error loading tickets:", error);
        }
    };

    // ── Normalize categories ───────────────────────────────────────────
    // Categories can be stored as:
    //   - Array of strings: ["Entry", "Lunch"]
    //   - Array of objects: [{name: "Entry"}, {name: "Lunch"}]
    // We normalize to plain strings for consistent use.
    const normalizeCategoryList = (categories) => {
        if (!categories || categories.length === 0) return ['Entry'];
        return categories.map(cat => {
            let name = '';
            if (typeof cat === 'string') name = cat;
            else if (typeof cat === 'object' && cat.name) name = cat.name;
            else name = String(cat);
            return name.trim();
        }).filter(Boolean);
    };

    // ── Stats calculation ──────────────────────────────────────────────
    useEffect(() => {
        if (tickets.length >= 0 && selectedCategory) {
            const checkedIn = tickets.filter(t => {
                // Check exact category match in scans map
                const specificScan = t.scans && t.scans[selectedCategory];
                // Fallback: if category is 'Entry' and legacy 'scanned' is true
                const legacyScan = selectedCategory === 'Entry' && t.scanned;
                return specificScan || legacyScan;
            }).length;

            setStats({
                total: tickets.length,
                checkedIn,
                pending: tickets.length - checkedIn,
            });
        }
    }, [tickets, selectedCategory]);

    // ── Manual check-in toggle ─────────────────────────────────────────
    const handleManualToggle = async (ticket) => {
        const categoryToMark = selectedCategory || 'Entry';

        // Check both new map and legacy field
        const specificScan = ticket.scans && ticket.scans[categoryToMark];
        const legacyScan = categoryToMark === 'Entry' && ticket.scanned;

        const isCurrentlyScanned = specificScan || legacyScan;

        if (!isCurrentlyScanned) {
            if (window.confirm(`Mark ${ticket.participantName} as Checked In for "${categoryToMark}"?`)) {
                try {
                    await eventService.markTicketScanned(ticket.firestoreId, categoryToMark);
                    // No need to update local state — the onSnapshot listener will fire automatically
                } catch (error) {
                    console.error("Error toggling check-in:", error);
                    alert("Failed to update status. Please try again.");
                }
            }
        }
    };

    // ── Filter ────────────────────────────────────────────────────────
    const filteredTickets = tickets.filter(ticket => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            ticket.participantName?.toLowerCase().includes(term) ||
            ticket.ticketId?.toLowerCase().includes(term) ||
            ticket.participantEmail?.toLowerCase().includes(term) ||
            ticket.participantClub?.toLowerCase().includes(term)
        );
    });

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        </div>
    );
    if (!event) return (
        <div className="min-h-screen flex items-center justify-center text-gray-500">
            Event not found
        </div>
    );

    const scanCategories = normalizeCategoryList(event.categories);

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <Link to={isHostMode ? `/host/event/${id}` : `/admin/event/${id}`} className="inline-flex items-center text-gray-500 hover:text-indigo-600 mb-2 transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Event Dashboard
                        </Link>
                        <h1 className="text-3xl font-black text-gray-900">Check-in Desk</h1>
                        <p className="text-gray-500">{event.name}</p>
                    </div>

                    <div className="flex gap-3 items-center">
                        {/* Live indicator */}
                        <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${isLive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {isLive ? (
                                <><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> LIVE</>
                            ) : (
                                <><WifiOff className="w-3 h-3" /> OFFLINE</>
                            )}
                        </div>
                        <button onClick={loadEvent} className="btn-secondary px-4 py-2 flex items-center gap-2">
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </button>
                        <Link to="/admin/scanner" className="btn-primary px-4 py-2 flex items-center gap-2 font-bold shadow-lg shadow-indigo-200">
                            <Smartphone className="w-4 h-4" /> Open Scanner
                        </Link>
                    </div>
                </div>

                {/* Station Selector */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100 mb-8 flex items-center gap-4">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-700">
                        <MapPin className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">
                            Viewing Station
                        </label>
                        <select
                            value={selectedCategory || ''}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full md:w-auto min-w-[200px] font-bold text-lg text-gray-800 bg-transparent border-none focus:ring-0 p-0 cursor-pointer hover:text-indigo-600 transition-colors"
                        >
                            {scanCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <p className="text-xs text-gray-400 hidden md:block">
                        Dashboard updates in real-time when tickets are scanned
                    </p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Tickets</p>
                        <p className="text-3xl font-black text-gray-900 mt-2">{stats.total}</p>
                        <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                            <Users className="w-3 h-3" /> All issued passes
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100 bg-green-50/50">
                        <p className="text-xs font-bold text-green-600 uppercase tracking-widest">Checked In ({selectedCategory})</p>
                        <p className="text-3xl font-black text-green-700 mt-2">{stats.checkedIn}</p>
                        <div className="mt-2 text-xs text-green-600 font-bold">
                            {stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0}% Completion
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pending ({selectedCategory})</p>
                        <p className="text-3xl font-black text-gray-900 mt-2">{stats.pending}</p>
                        <div className="mt-2 text-xs text-gray-400">Yet to arrive</div>
                    </div>
                </div>

                {/* Search */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 sticky top-4 z-20">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, club, or ticket ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-full h-11 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Participants List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Participant</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Status ({selectedCategory})
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredTickets.map((ticket) => {
                                    // Check specific category scan OR legacy scanned field for "Entry"
                                    const specificScan = ticket.scans && ticket.scans[selectedCategory];
                                    const legacyScan = selectedCategory === 'Entry' && ticket.scanned;
                                    const isScanned = specificScan || legacyScan;

                                    return (
                                        <tr key={ticket.ticketId || ticket.firestoreId} className={`hover:bg-gray-50 transition-colors ${isScanned ? 'bg-green-50/30' : ''}`}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-bold text-white ${isScanned ? 'bg-green-500' : 'bg-indigo-400'}`}>
                                                        {ticket.participantName?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-bold text-gray-900">{ticket.participantName}</div>
                                                        <div className="text-xs text-gray-400 font-mono">{ticket.ticketId}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600">{ticket.participantEmail}</div>
                                                <div className="text-xs text-gray-500">{ticket.participantMobile}</div>
                                                {ticket.participantClub && (
                                                    <div className="text-xs text-indigo-500 mt-1 font-medium">{ticket.participantClub}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {isScanned ? (
                                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-green-100 text-green-800 items-center gap-1">
                                                        <CheckCircle className="w-3 h-3" /> Checked In
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-yellow-100 text-yellow-800 items-center gap-1">
                                                        <RefreshCw className="w-3 h-3" /> Pending
                                                    </span>
                                                )}
                                                {isScanned && (
                                                    <div className="text-[10px] text-gray-400 mt-1">
                                                        {new Date(isScanned).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {!isScanned ? (
                                                    <button
                                                        onClick={() => handleManualToggle(ticket)}
                                                        className="text-indigo-600 hover:text-indigo-900 font-bold hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors"
                                                    >
                                                        Manual Check-in
                                                    </button>
                                                ) : (
                                                    <span className="text-green-600 font-bold text-xs flex items-center justify-end gap-1">
                                                        <CheckCircle className="w-3 h-3" /> Verified
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filteredTickets.length === 0 && (
                            <div className="text-center py-12">
                                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">
                                    {tickets.length === 0 ? 'No tickets found for this event.' : 'No participants match your search.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
