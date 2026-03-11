import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import {
    Users, QrCode, DollarSign, Calendar, ArrowLeft, ClipboardList,
    X, Eye, CheckCircle, Clock, Phone, Mail, User, Tag, Shield, Download
} from 'lucide-react';
import * as XLSX from 'xlsx';

// ── Participant Details Modal ─────────────────────────────────────────────────
function ParticipantModal({ booking, tickets, loading, onClose }) {
    if (!booking) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }}
            onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Modal header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Booking Details</h3>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">{booking.orderId}</p>
                    </div>
                    <button onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Booking summary */}
                <div className="px-6 py-4 bg-gray-50/60 border-b border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Booked By</p>
                        <p className="font-semibold text-gray-800">{booking.userName || '—'}</p>
                        <p className="text-xs text-gray-500">{booking.userEmail}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Club</p>
                        <p className="font-semibold text-gray-800">{booking.club || '—'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Tickets</p>
                        <p className="font-semibold text-gray-800">{booking.numberOfTickets}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Amount</p>
                        <p className="font-semibold text-indigo-600">₹{booking.totalAmount}</p>
                    </div>

                    {booking.customFieldResponses && Object.keys(booking.customFieldResponses).length > 0 && (
                        <div className="col-span-2 sm:col-span-4 mt-2 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Additional Booking Details</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {Object.entries(booking.customFieldResponses).map(([key, val]) => (
                                    <div key={key}>
                                        <p className="text-xs text-gray-500 mb-0.5">{key}</p>
                                        <p className="text-sm font-medium text-gray-900">{Array.isArray(val) ? val.join(', ') : val?.toString() || '—'}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Participants / Tickets */}
                <div className="px-6 py-5">
                    <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Participants
                        <span className="ml-auto text-xs font-normal text-gray-400">
                            {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
                        </span>
                    </h4>

                    {loading ? (
                        <div className="flex items-center justify-center py-10 text-gray-400">
                            <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mr-3" />
                            Loading participants…
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            <Clock className="w-10 h-10 mx-auto mb-2 opacity-40" />
                            <p className="text-sm font-medium">No participant details yet</p>
                            <p className="text-xs mt-1">This booking is pending participant details submission.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {tickets.map((ticket, idx) => (
                                <div key={ticket.firestoreId || idx}
                                    className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 hover:bg-white transition-colors">
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{ticket.participantName || '—'}</p>
                                                <p className="text-xs text-gray-500 font-mono">{ticket.ticketId}</p>
                                            </div>
                                        </div>
                                        {/* Scan status — check both legacy field AND per-category scans map */}
                                        {(() => {
                                            const scansMap = ticket.scans || {};
                                            const scannedCategories = Object.keys(scansMap);
                                            const hasAnyScan = ticket.scanned || scannedCategories.length > 0;

                                            if (!hasAnyScan) return (
                                                <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-500 flex-shrink-0">
                                                    <Clock className="w-3 h-3" /> Not Scanned
                                                </span>
                                            );

                                            // Show each scanned category as its own badge
                                            const cats = scannedCategories.length > 0
                                                ? scannedCategories
                                                : ['Entry']; // fallback if only legacy field is set

                                            return (
                                                <div className="flex flex-wrap gap-1 justify-end">
                                                    {cats.map(cat => (
                                                        <span key={cat} className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700 flex-shrink-0">
                                                            <CheckCircle className="w-3 h-3" /> {cat}
                                                        </span>
                                                    ))}
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                        {ticket.participantEmail && (
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                <span className="truncate">{ticket.participantEmail}</span>
                                            </div>
                                        )}
                                        {ticket.participantMobile && (
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                <span>{ticket.participantMobile}</span>
                                            </div>
                                        )}
                                        {ticket.participantClub && (
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                <span>{ticket.participantClub}</span>
                                            </div>
                                        )}
                                        {ticket.category && (
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Tag className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                <span>{ticket.category}</span>
                                            </div>
                                        )}
                                    </div>

                                    {ticket.customFields && Object.keys(ticket.customFields).length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-gray-100/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                            {Object.entries(ticket.customFields).map(([key, val]) => (
                                                <div key={key} className="flex flex-col">
                                                    <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-0.5">{key}</span>
                                                    <span className="text-gray-800 font-medium">{Array.isArray(val) ? val.join(', ') : val?.toString() || '—'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Main EventDashboard ───────────────────────────────────────────────────────
export default function EventDashboard({ isHostMode = false }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalTickets: 0, scannedTickets: 0, totalRevenue: 0, totalBookings: 0 });

    // ── Modal state ────────────────────────────────────────────────────────
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [modalTickets, setModalTickets] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const eventData = await eventService.getEvent(id);
                setEvent(eventData);
                if (eventData) {
                    const bookings = await eventService.getEventBookings(id);
                    setRegistrations(bookings || []);
                    const eventTickets = await eventService.getEventTickets(id);
                    setTickets(eventTickets || []);
                    let scannedCount = 0, revenue = 0;
                    (bookings || []).forEach(b => { revenue += Number(b.totalAmount) || 0; });
                    (eventTickets || []).forEach(t => { if (t.scanned) scannedCount++; });
                    setStats({
                        totalBookings: (bookings || []).length,
                        totalTickets: (eventTickets || []).length,
                        scannedTickets: scannedCount,
                        totalRevenue: revenue
                    });
                }
            } catch (error) {
                console.error("Error fetching event dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const openBookingModal = async (booking) => {
        setSelectedBooking(booking);
        setModalTickets([]);
        setModalLoading(true);
        try {
            const t = await eventService.getBookingTickets(booking.firestoreId);
            setModalTickets(t || []);
        } catch (e) {
            console.error('Failed to load tickets:', e);
        } finally {
            setModalLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const d = new Date(dateString);
            return isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleDateString();
        } catch { return 'Error'; }
    };

    const exportToExcel = async () => {
        setLoading(true);
        try {
            // Flatten data: 1 row = 1 Ticket (Participant)
            const exportData = [];

            // We need to fetch all tickets to match with bookings
            // Since `tickets` is already downloaded, we can cross-reference

            tickets.forEach(ticket => {
                // Find parent booking
                const booking = registrations.find(b => b.firestoreId === ticket.bookingFirestoreId || b.id === ticket.bookingId) || {};

                const row = {
                    'Order ID': booking.orderId || 'N/A',
                    'Booking Date': formatDate(booking.createdAt),
                    'Booked By (Name)': booking.userName || 'N/A',
                    'Booked By (Email)': booking.userEmail || 'N/A',
                    'Booked By (Mobile)': booking.mobile || 'N/A',
                    'Booking Club': booking.club || 'N/A',
                    'Amount Paid (₹)': booking.totalAmount || 0,
                    'Payment Status': booking.paymentStatus || booking.status || 'N/A',

                    'Ticket ID': ticket.ticketId,
                    'Participant Name': ticket.participantName || 'N/A',
                    'Participant Email': ticket.participantEmail || 'N/A',
                    'Participant Mobile': ticket.participantMobile || 'N/A',
                    'Participant Club': ticket.participantClub || 'N/A',
                    'Ticket Category': ticket.category || 'Standard',
                };

                // Add Scan/Check-in data for all categories
                const scans = ticket.scans || {};

                // If it's a legacy ticket without the scans map but has 'scanned: true'
                if (ticket.scanned && !scans['Entry']) {
                    scans['Entry'] = ticket.scannedAt;
                }

                // Append each available category from the overall event categories list
                if (event.categories && event.categories.length > 0) {
                    event.categories.forEach(cat => {
                        row[`Check-in: ${cat}`] = scans[cat] ? formatDate(scans[cat]) + ' ' + new Date(scans[cat]).toLocaleTimeString() : 'Pending';
                    });
                } else {
                    row[`Check-in: Entry`] = scans['Entry'] ? formatDate(scans['Entry']) + ' ' + new Date(scans['Entry']).toLocaleTimeString() : 'Pending';
                }

                // Add Booking-level custom fields
                if (booking.customFieldResponses) {
                    Object.entries(booking.customFieldResponses).forEach(([key, val]) => {
                        row[`[Booking] ${key}`] = Array.isArray(val) ? val.join(', ') : val;
                    });
                }

                // Add Participant-level custom fields
                if (ticket.customFields) {
                    Object.entries(ticket.customFields).forEach(([key, val]) => {
                        row[`[Participant] ${key}`] = Array.isArray(val) ? val.join(', ') : val;
                    });
                }

                exportData.push(row);
            });

            if (exportData.length === 0) {
                alert("No registrations found to export.");
                return;
            }

            // Generate Worksheet
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");

            // Save file
            const fileName = `${event.name.replace(/[^a-zA-Z0-9]/g, '_')}_Registrations.xlsx`;
            XLSX.writeFile(workbook, fileName);

        } catch (error) {
            console.error("Failed to export Excel:", error);
            alert("An error occurred while exporting data.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!event) return <div className="min-h-screen flex items-center justify-center">Event not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Participant Modal */}
            {selectedBooking && (
                <ParticipantModal
                    booking={selectedBooking}
                    tickets={modalTickets}
                    loading={modalLoading}
                    onClose={() => setSelectedBooking(null)}
                />
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isHostMode ? (
                    <Link to="/" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6 font-medium">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Website
                    </Link>
                ) : (
                    <Link to="/admin/dashboard" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6 font-medium">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                    </Link>
                )}

                {/* Event Header */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
                        <div className="flex items-center mt-2 text-gray-500 space-x-4 text-sm">
                            <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> {event.date}</span>
                            <span className="flex items-center"><DollarSign className="w-4 h-4 mr-1" /> ₹{event.ticketPrice}</span>
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">Code: {event.accessCode}</span>
                        </div>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        {/* Only Admin can see the Edit button, not Event Hosts */}
                        {!isHostMode && (
                            <button onClick={() => navigate(`/admin/edit-event/${id}`)}
                                className="px-4 py-2 border border-indigo-200 text-indigo-600 font-bold rounded-lg hover:bg-indigo-50 transition-colors hidden md:block">
                                Edit Event
                            </button>
                        )}
                        <button onClick={exportToExcel}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors">
                            <Download className="w-4 h-4" /> Export Excel
                        </button>
                        <button onClick={() => navigate(isHostMode ? `/host/event/${id}/checkin` : `/admin/event/${id}/checkin`)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                            style={{ background: '#400763' }}>
                            <ClipboardList className="w-4 h-4" /> Check-in Desk
                        </button>
                    </div>
                </div>

                {/* Host Credentials Info Card for Admins */}
                {!isHostMode && event.hostUsername && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-8 flex items-start gap-4 shadow-sm">
                        <div className="p-2 bg-orange-100 rounded-lg shrink-0">
                            <Shield className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">Event Host Access Enabled</h3>
                            <p className="text-xs text-gray-600 mt-1">This event has a dedicated host login. Share these credentials and the link below with the host so they can view this dashboard without edit permissions.</p>
                            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm font-mono bg-white px-3 py-2 rounded-lg border border-orange-100 w-fit">
                                <span><span className="text-gray-400 select-none">User: </span><strong className="text-gray-800 select-all">{event.hostUsername}</strong></span>
                                <span className="text-gray-300">|</span>
                                <span><span className="text-gray-400 select-none">Pass: </span><strong className="text-gray-800 select-all">{event.hostPassword}</strong></span>
                            </div>
                            <div className="mt-2 text-xs text-indigo-600 font-medium font-mono select-all">
                                {window.location.origin}/host-login
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {(() => {
                        // 1. Calculate Recent Momentum (tickets sold in last 24h)
                        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                        let recentTickets = 0;
                        registrations.forEach(r => {
                            if (new Date(r.createdAt) > oneDayAgo) {
                                recentTickets += (Number(r.numberOfTickets) || 1);
                            }
                        });

                        // 2. Calculate Top Club
                        const clubMap = {};
                        registrations.forEach(reg => {
                            const club = reg.club || 'Unknown';
                            if (!clubMap[club]) clubMap[club] = 0;
                            clubMap[club] += Number(reg.numberOfTickets) || 1;
                        });
                        const sortedClubs = Object.entries(clubMap).sort((a, b) => b[1] - a[1]);
                        const topClubName = sortedClubs.length > 0 && sortedClubs[0][0] !== 'Unknown'
                            ? sortedClubs[0][0]
                            : (sortedClubs.length > 1 ? sortedClubs[1][0] : 'None Yet');
                        const topClubCount = sortedClubs.length > 0 ? sortedClubs[0][1] : 0;

                        return [
                            { label: 'Total Tickets Sold', value: stats.totalTickets, sub: `From ${stats.totalBookings} orders`, icon: <Users className="w-6 h-6 text-blue-600" />, bg: 'bg-blue-50' },
                            { label: 'Total Revenue', value: `₹${stats.totalRevenue}`, sub: 'Gross sales', icon: <DollarSign className="w-6 h-6 text-green-600" />, bg: 'bg-green-50' },
                            { label: 'Top Participating Club', value: topClubName, sub: topClubCount > 0 ? `${topClubCount} registrations` : 'Waiting for data', icon: <User className="w-6 h-6 text-orange-600" />, bg: 'bg-orange-50' },
                            { label: 'Recent Momentum', value: `+${recentTickets}`, sub: 'Tickets sold in last 24h', icon: <Calendar className="w-6 h-6 text-green-600" />, bg: 'bg-green-50' },
                        ].map(s => (
                            <div key={s.label} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 group hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">{s.label}</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-1">{s.value}</p>
                                        <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
                                    </div>
                                    <div className={`p-3 ${s.bg} rounded-lg group-hover:scale-110 transition-transform`}>{s.icon}</div>
                                </div>
                            </div>
                        ))
                    })()}
                </div>

                {/* ── Club Summary Card (click to see full breakdown) ── */}
                {(() => {
                    const clubMap = {};
                    registrations.forEach(reg => {
                        const club = reg.club || 'Unknown';
                        if (!clubMap[club]) clubMap[club] = { tickets: 0, revenue: 0 };
                        clubMap[club].tickets += Number(reg.numberOfTickets) || 1;
                        clubMap[club].revenue += Number(reg.totalAmount) || 0;
                    });
                    const clubs = Object.entries(clubMap).sort((a, b) => b[1].tickets - a[1].tickets);
                    if (clubs.length === 0) return null;
                    const totalTickets = clubs.reduce((s, [, d]) => s + d.tickets, 0);
                    return (
                        <div
                            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all group"
                            onClick={() => navigate(isHostMode ? `/host/event/${id}/clubs` : `/admin/event/${id}/clubs`)}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-indigo-500" /> Registrations by Club
                                </h2>
                                <span className="text-xs font-semibold text-indigo-600 group-hover:underline flex items-center gap-1">
                                    View all {clubs.length} clubs →
                                </span>
                            </div>
                            {/* Top 3 preview */}
                            <div className="space-y-2">
                                {clubs.slice(0, 3).map(([club, data]) => (
                                    <div key={club} className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-gray-700 w-32 truncate">{club}</span>
                                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full" style={{
                                                width: `${(data.tickets / (clubs[0][1].tickets || 1)) * 100}%`,
                                                background: 'linear-gradient(90deg,#6366f1,#a855f7)'
                                            }} />
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 w-12 text-right">{data.tickets} tkts</span>
                                    </div>
                                ))}
                                {clubs.length > 3 && (
                                    <p className="text-xs text-gray-400 pt-1">+{clubs.length - 3} more clubs · {totalTickets} total tickets</p>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {/* Recent Orders table */}

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
                        <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded text-gray-600">
                            Showing last {Math.min(registrations.length, 10)}
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Order ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Booked By</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Club</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tickets</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">View</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {registrations.slice(0, 10).map((reg) => (
                                    <tr key={reg.firestoreId || reg.id || Math.random()} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-500">
                                            {reg.orderId || reg.id?.substring(0, 8) || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-900">{reg.userName || 'Unknown'}</div>
                                            <div className="text-xs text-gray-500">{reg.userEmail}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{reg.club || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{reg.numberOfTickets || 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">₹{reg.totalAmount}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${reg.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                reg.status === 'pending_details' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {reg.status === 'pending_details' ? 'Pending Details' : 'Confirmed'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                            {formatDate(reg.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => openBookingModal(reg)}
                                                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
                                            >
                                                <Eye className="w-3.5 h-3.5" /> View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {registrations.length === 0 && (
                            <div className="text-center py-12">
                                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">No registrations yet.</p>
                                <p className="text-sm text-gray-400">Share your event to get started!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
