import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { useAuth } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { Ticket, Calendar, MapPin, Users, Download, CheckCircle, Clock, Loader2 } from 'lucide-react';

export default function MyTickets() {
    const { currentUser } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBookings();
    }, [currentUser]);

    const loadBookings = async () => {
        if (!currentUser) {
            setLoading(false);
            return;
        }

        try {
            const userBookings = await eventService.getUserBookings(currentUser.uid);
            setBookings(userBookings);
        } catch (error) {
            console.error("Error loading bookings:", error);
        } finally {
            setLoading(false);
        }
    };

    // Separate bookings into upcoming and completed
    const now = new Date();
    const upcomingBookings = bookings.filter(booking => new Date(booking.bookingDate) >= now);
    const completedBookings = bookings.filter(booking => new Date(booking.bookingDate) < now);

    const downloadTicket = (booking) => {
        const ticketText = `
=================================
    ROTARACT EVENT TICKET
=================================

Event: ${booking.eventName}
Name: ${booking.userName}
Email: ${booking.userEmail}
Club: ${booking.club}
Tickets: ${booking.numberOfTickets}
Amount: ₹${booking.totalAmount}

Booking ID: ${booking.id}
Transaction: ${booking.transactionId}
Date: ${new Date(booking.createdAt).toLocaleString()}

Status: ${booking.scanned ? 'SCANNED' : 'VALID'}
${booking.scanned ? `Scanned At: ${new Date(booking.scannedAt).toLocaleString()}` : ''}

=================================
        `;

        const blob = new Blob([ticketText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ticket_${booking.id}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const renderTicketCard = (booking) => (
        <div key={booking.id} className="glass-card p-6 relative overflow-hidden">
            {/* Status Badge */}
            <div className="absolute top-4 right-4">
                {booking.scanned ? (
                    <span className="badge-success flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>SCANNED</span>
                    </span>
                ) : (
                    <span className="badge-primary flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>VALID</span>
                    </span>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* QR Code */}
                <div className="flex-shrink-0">
                    <div className="bg-white p-4 rounded-lg">
                        <QRCodeSVG
                            value={booking.id}
                            size={150}
                            level="H"
                            includeMargin={true}
                        />
                    </div>
                    <p className="text-xs text-center mt-2 font-mono" style={{ color: '#6b6b6b' }}>
                        {booking.id.substring(0, 15)}...
                    </p>
                </div>

                {/* Booking Details */}
                <div className="flex-1 space-y-3">
                    <h3 className="text-xl font-bold gradient-text mb-4">{booking.eventName}</h3>

                    <div className="flex items-center text-sm" style={{ color: '#4a4a4a' }}>
                        <Calendar className="w-4 h-4 mr-2" style={{ color: '#400763' }} />
                        <span>{new Date(booking.bookingDate).toLocaleDateString(undefined, {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        })}</span>
                    </div>

                    <div className="flex items-center text-sm" style={{ color: '#4a4a4a' }}>
                        <MapPin className="w-4 h-4 mr-2" style={{ color: '#ed0775' }} />
                        <span>{booking.club}</span>
                    </div>

                    <div className="flex items-center text-sm" style={{ color: '#4a4a4a' }}>
                        <Users className="w-4 h-4 mr-2" style={{ color: '#680b56' }} />
                        <span>{booking.numberOfTickets} Ticket{booking.numberOfTickets > 1 ? 's' : ''}</span>
                    </div>

                    <div className="pt-3 border-t" style={{ borderColor: '#e5e5e5' }}>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm" style={{ color: '#6b6b6b' }}>Total Amount</span>
                            <span className="font-bold text-lg" style={{ color: '#1a1a1a' }}>₹{booking.totalAmount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs" style={{ color: '#6b6b6b' }}>Transaction ID</span>
                            <span className="text-xs font-mono" style={{ color: '#6b6b6b' }}>{booking.transactionId.substring(0, 20)}...</span>
                        </div>
                    </div>

                    {booking.scanned && (
                        <div className="alert-success mt-3">
                            ✓ Scanned on {new Date(booking.scannedAt).toLocaleString()}
                        </div>
                    )}

                    <button
                        onClick={() => downloadTicket(booking)}
                        className="btn-secondary w-full mt-4 flex items-center justify-center text-sm"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Download Ticket
                    </button>
                </div>
            </div>
        </div>
    );

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
        <div className="min-h-screen" style={{ backgroundColor: '#ffffff' }}>
            <div className="max-w-7xl mx-auto px-4 py-10 mt-20">
                <div className="mb-10">
                    <h1 className="text-4xl font-bold gradient-text mb-2">My Tickets</h1>
                    <p style={{ color: '#6b6b6b' }}>View and manage your event bookings</p>
                </div>

                {bookings.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                        <Ticket className="w-16 h-16 mx-auto mb-4" style={{ color: '#999999' }} />
                        <h3 className="text-xl font-semibold mb-2" style={{ color: '#1a1a1a' }}>No Tickets Yet</h3>
                        <p className="mb-6" style={{ color: '#6b6b6b' }}>You haven't booked any events yet</p>
                        <Link to="/events" className="btn-primary inline-block">
                            Browse Events
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Upcoming Events */}
                        {upcomingBookings.length > 0 && (
                            <div className="mb-12">
                                <h2 className="text-2xl font-bold mb-6 gradient-text">Upcoming Events</h2>
                                <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                                    {upcomingBookings.map(renderTicketCard)}
                                </div>
                            </div>
                        )}

                        {/* Completed Events */}
                        {completedBookings.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-bold mb-6" style={{ color: '#6b6b6b' }}>Completed Events</h2>
                                <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                                    {completedBookings.map(renderTicketCard)}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
