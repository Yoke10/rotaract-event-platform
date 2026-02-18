import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { useAuth } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { Ticket, Calendar, MapPin, Users, Download, CheckCircle, Clock, Loader2, AlertCircle, ArrowRight, ArrowLeft, Eye } from 'lucide-react';
import * as htmlToImage from 'html-to-image';

export default function MyTickets() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [tickets, setTickets] = useState([]); // Store all user tickets
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);

    useEffect(() => {
        loadData();
    }, [currentUser]);

    const loadData = async () => {
        if (!currentUser) {
            setLoading(false);
            return;
        }

        try {
            // 1. Fetch User Bookings
            const userBookings = await eventService.getUserBookings(currentUser.uid);
            setBookings(userBookings);

            // 2. Fetch Tickets for Confirmed Bookings
            let allTickets = [];
            for (const booking of userBookings) {
                if (booking.status === 'confirmed') {
                    // Fetch tickets for this booking
                    // We need to use booking.firestoreId as that's what we query by in getBookingTickets
                    const bookingTickets = await eventService.getBookingTickets(booking.firestoreId);

                    // Attach event details from booking to each ticket for display convenience
                    const ticketsWithMeta = bookingTickets.map(t => ({
                        ...t,
                        eventName: booking.eventName,
                        eventDate: booking.eventDate, // Assuming booking has this or we might need to fetch event
                        eventLocation: booking.club, // Using club as location proxy or fetch event
                        bookingDate: booking.createdAt,
                        bookingId: booking.bookingId
                    }));

                    allTickets = [...allTickets, ...ticketsWithMeta];
                }
            }
            setTickets(allTickets);

        } catch (error) {
            console.error("Error loading tickets:", error);
        } finally {
            setLoading(false);
        }
    };

    const downloadTicketImage = async (ticketId) => {
        const element = document.getElementById(`ticket-card-${ticketId}`);
        if (element) {
            try {
                const dataUrl = await htmlToImage.toPng(element);
                const link = document.createElement('a');
                link.download = `ticket-${ticketId}.png`;
                link.href = dataUrl;
                link.click();
            } catch (error) {
                console.error('Error downloading ticket:', error);
                alert("Could not download ticket image.");
            }
        }
    };

    const renderPendingBooking = (booking) => (
        <div key={booking.id} className="glass-card p-6 border-l-4 border-yellow-400 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">{booking.eventName}</h3>
                    <div className="flex items-center text-yellow-600 mt-1">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        <span className="font-medium">Registration Incomplete</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                        You have paid for <strong>{booking.numberOfTickets} tickets</strong> but haven't provided participant details yet.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/participant-details', { state: { booking: booking } })}
                    className="btn-primary py-2 px-6 flex items-center whitespace-nowrap"
                >
                    Complete Registration <ArrowRight className="w-4 h-4 ml-2" />
                </button>
            </div>
        </div>
    );

    // List Item View
    const renderTicketListItem = (ticket) => (
        <div key={ticket.ticketId} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${ticket.scanned ? 'bg-green-500' : 'bg-indigo-600'}`}>
                    <Ticket className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="font-bold text-gray-900">{ticket.eventName}</h4>
                    <p className="text-sm text-gray-500">{ticket.participantName} • {ticket.category || 'Standard'}</p>
                    <p className="text-xs text-gray-400 font-mono mt-1">ID: {ticket.ticketId.substring(0, 8)}...</p>
                </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
                {ticket.scanned ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
                        <CheckCircle className="w-3 h-3 mr-1" /> Used
                    </span>
                ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
                        <Clock className="w-3 h-3 mr-1" /> Valid
                    </span>
                )}
                <button
                    onClick={() => setSelectedTicket(ticket)}
                    className="flex-1 sm:flex-none btn-secondary px-4 py-2 flex items-center justify-center gap-2 text-sm"
                >
                    <Eye className="w-4 h-4" /> View
                </button>
            </div>
        </div>
    );

    // Detailed Ticket View
    const renderSelectedTicket = () => {
        if (!selectedTicket) return null;

        return (
            <div className="max-w-md mx-auto animate-fadeIn">
                <button
                    onClick={() => setSelectedTicket(null)}
                    className="mb-6 flex items-center text-gray-500 hover:text-indigo-600 transition-colors font-medium"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to My Tickets
                </button>

                <div id={`ticket-card-${selectedTicket.ticketId}`} className="glass-card p-0 overflow-hidden flex flex-col bg-white shadow-xl">
                    {/* Ticket Header */}
                    <div className="bg-gradient-to-r from-indigo-900 to-purple-800 p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                            <Ticket size={120} />
                        </div>
                        <h3 className="font-bold text-2xl relative z-10">{selectedTicket.eventName}</h3>
                        <p className="text-sm text-purple-200 uppercase tracking-wider relative z-10 mt-1">{selectedTicket.category || 'Standard Entry'}</p>
                        <div className="flex items-center mt-2 text-purple-100 text-xs relative z-10">
                            <Calendar className="w-3 h-3 mr-1" />
                            <span>{selectedTicket.eventDate ? new Date(selectedTicket.eventDate).toLocaleDateString() : 'Date TBA'}</span>
                        </div>
                    </div>

                    <div className="p-8 flex flex-col items-center">
                        {/* Status Badge */}
                        <div className="mb-6">
                            {selectedTicket.scanned ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800">
                                    <CheckCircle className="w-4 h-4 mr-1" /> Checked In
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-800">
                                    <Clock className="w-4 h-4 mr-1" /> Ready to Scan
                                </span>
                            )}
                        </div>

                        {/* QR Code */}
                        <div className="p-4 bg-white rounded-xl shadow-lg border border-gray-100 mb-8">
                            <QRCodeSVG
                                value={selectedTicket.ticketId}
                                size={180}
                                level="H"
                            />
                        </div>

                        {/* Details */}
                        <div className="w-full space-y-4 text-center">
                            <div>
                                <p className="text-gray-400 text-xs uppercase tracking-wider font-bold">Attendee</p>
                                <p className="text-xl font-bold text-gray-900">{selectedTicket.participantName}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 w-full text-left bg-gray-50 p-4 rounded-lg">
                                <div>
                                    <p className="text-gray-400 text-xs uppercase tracking-wider font-bold">Club</p>
                                    <p className="font-medium text-gray-800 text-sm truncate" title={selectedTicket.participantClub}>{selectedTicket.participantClub || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs uppercase tracking-wider font-bold">Ticket ID</p>
                                    <p className="font-mono text-gray-600 text-sm truncate" title={selectedTicket.ticketId}>{selectedTicket.ticketId}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs uppercase tracking-wider font-bold">Phone</p>
                                    <p className="font-medium text-gray-800 text-sm">{selectedTicket.participantMobile || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs uppercase tracking-wider font-bold">Email</p>
                                    <p className="font-medium text-gray-800 text-sm truncate" title={selectedTicket.participantEmail}>{selectedTicket.participantEmail || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer / Action */}
                    <div className="p-6 bg-gray-50 border-t border-gray-100 mt-auto">
                        <button
                            onClick={() => downloadTicketImage(selectedTicket.ticketId)}
                            className="w-full btn-primary py-3 flex items-center justify-center font-bold shadow-lg shadow-indigo-200"
                        >
                            <Download className="w-5 h-5 mr-2" /> Download Ticket
                        </button>
                        <p className="text-xs text-center text-gray-400 mt-3">
                            Present this QR code at the event entrance.
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#400763' }} />
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p className="mb-4" style={{ color: '#6b6b6b' }}>Please login to view your tickets</p>
                <Link to="/login" className="btn-primary">Login</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-10 mt-20">
                {!selectedTicket && (
                    <div className="mb-10 animate-fadeIn">
                        <h1 className="text-4xl font-bold gradient-text mb-2">My Tickets</h1>
                        <p style={{ color: '#6b6b6b' }}>Access and manage your event passes</p>
                    </div>
                )}

                {/* Pending Actions - Always show unless in detail view */}
                {!selectedTicket && bookings.filter(b => b.status === 'pending_details').map(renderPendingBooking)}

                {/* Main Content */}
                {selectedTicket ? (
                    renderSelectedTicket()
                ) : (
                    <div className="space-y-4">
                        {tickets.length > 0 ? (
                            tickets.map(renderTicketListItem)
                        ) : (
                            bookings.filter(b => b.status === 'pending_details').length === 0 && (
                                <div className="glass-card p-12 text-center">
                                    <Ticket className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                    <h3 className="text-xl font-semibold mb-2 text-gray-800">No Tickets Found</h3>
                                    <p className="mb-6 text-gray-500">You haven't booked any events yet.</p>
                                    <Link to="/events" className="btn-primary inline-block">
                                        Browse Events
                                    </Link>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
