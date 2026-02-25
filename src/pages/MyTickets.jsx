import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { useAuth } from '../context/AuthContext';
import { toPng } from 'html-to-image';
import {
    Ticket, ArrowLeft, AlertCircle, ArrowRight, Loader2
} from 'lucide-react';
import TicketCard from '../components/TicketCard';

export default function MyTickets() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const selectedTicketRef = useRef(null);

    useEffect(() => { loadData(); }, [currentUser]);

    const loadData = async () => {
        if (!currentUser) { setLoading(false); return; }
        try {
            const userBookings = await eventService.getUserBookings(currentUser.uid);
            setBookings(userBookings);
            let allTickets = [];
            for (const booking of userBookings) {
                if (booking.status === 'confirmed') {
                    const bookingTickets = await eventService.getBookingTickets(booking.firestoreId);
                    const enriched = bookingTickets.map(t => ({
                        ...t,
                        eventName: booking.eventName,
                        eventDate: booking.eventDate,
                        eventVenue: booking.eventVenue || booking.eventLocation,
                        eventTime: booking.eventTime,
                        eventPosterURL: booking.eventPosterURL || null,
                        bookingDate: booking.createdAt,
                        bookingId: booking.bookingId,
                        orderId: booking.orderId,
                    }));
                    allTickets = [...allTickets, ...enriched];
                }
            }
            setTickets(allTickets);
        } catch (error) {
            console.error('Error loading tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const downloadTicket = async () => {
        if (!selectedTicketRef.current) return;
        try {
            const dataUrl = await toPng(selectedTicketRef.current, { cacheBust: true, pixelRatio: 3 });
            const a = document.createElement('a');
            a.download = `ticket-${selectedTicket.ticketId}.png`;
            a.href = dataUrl;
            a.click();
        } catch (e) { console.error('Download failed:', e); }
    };

    const shareTicket = async () => {
        if (!selectedTicket) return;
        const text = `I'm attending ${selectedTicket.eventName}! 🎉\nTicket: ${selectedTicket.ticketId}`;
        if (navigator.share) {
            navigator.share({ title: selectedTicket.eventName, text }).catch(() => { });
        } else {
            navigator.clipboard.writeText(text).catch(() => { });
            alert('Ticket info copied!');
        }
    };

    // Build a booking-like meta object from the ticket's stored fields
    const ticketAsMeta = (ticket) => ({
        eventName: ticket.eventName,
        eventDate: ticket.eventDate,
        eventTime: ticket.eventTime,
        eventVenue: ticket.eventVenue,
        eventPosterURL: ticket.eventPosterURL,
        orderId: ticket.orderId,
    });

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#400763' }} />
        </div>
    );

    if (!currentUser) return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <p className="mb-4 text-sm" style={{ color: '#6b6b6b' }}>Please login to view your tickets</p>
            <Link to="/login" className="btn-primary">Login</Link>
        </div>
    );

    const pendingBookings = bookings.filter(b => b.status === 'pending_details');

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#f7f7f9' }}>
            <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-16">

                {/* ── Detail view ── */}
                {selectedTicket ? (
                    <div>
                        <button
                            onClick={() => setSelectedTicket(null)}
                            className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 hover:opacity-70 transition-opacity"
                            style={{ color: '#680b56' }}>
                            <ArrowLeft className="w-4 h-4" /> My Tickets
                        </button>

                        <TicketCard
                            ticket={selectedTicket}
                            booking={ticketAsMeta(selectedTicket)}
                            ticketRef={selectedTicketRef}
                            onDownload={downloadTicket}
                            onShare={shareTicket}
                        />
                    </div>
                ) : (
                    /* ── List view ── */
                    <div>
                        <div className="mb-8">
                            <h1 className="text-2xl sm:text-3xl font-extrabold mb-1" style={{ color: '#1a1a1a' }}>
                                My Tickets
                            </h1>
                            <p className="text-sm" style={{ color: '#6b6b6b' }}>
                                Access and manage your event passes
                            </p>
                        </div>

                        {/* Pending bookings */}
                        {pendingBookings.map(booking => (
                            <div key={booking.id}
                                className="bg-white rounded-2xl p-5 mb-4 shadow-sm border-l-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                                style={{ borderLeftColor: '#f59e0b', border: '1px solid rgba(229,229,229,0.8)', borderLeftWidth: '4px' }}>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <AlertCircle className="w-4 h-4" style={{ color: '#d97706' }} />
                                        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#d97706' }}>
                                            Incomplete Registration
                                        </span>
                                    </div>
                                    <p className="font-bold text-sm" style={{ color: '#1a1a1a' }}>{booking.eventName}</p>
                                    <p className="text-xs mt-0.5" style={{ color: '#6b6b6b' }}>
                                        {booking.numberOfTickets} ticket{booking.numberOfTickets > 1 ? 's' : ''} — provide attendee details to complete
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate('/participant-details', { state: { booking } })}
                                    className="btn-primary text-xs py-2.5 px-5 flex-shrink-0">
                                    Complete <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}

                        {/* Ticket list */}
                        {tickets.length > 0 ? (
                            <div className="space-y-3">
                                {tickets.map(ticket => (
                                    <TicketCard
                                        key={ticket.ticketId}
                                        ticket={ticket}
                                        booking={ticketAsMeta(ticket)}
                                        compact
                                        onView={() => setSelectedTicket(ticket)}
                                    />
                                ))}
                            </div>
                        ) : (
                            pendingBookings.length === 0 && (
                                <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                                    <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                                        style={{ background: 'rgba(64,7,99,0.06)' }}>
                                        <Ticket className="w-7 h-7" style={{ color: '#400763' }} />
                                    </div>
                                    <h3 className="font-bold text-base mb-1" style={{ color: '#1a1a1a' }}>No Tickets Yet</h3>
                                    <p className="text-sm mb-6" style={{ color: '#6b6b6b' }}>
                                        You haven't booked any events yet.
                                    </p>
                                    <Link to="/events" className="btn-primary text-sm">Browse Events</Link>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
