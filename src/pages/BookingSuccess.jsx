import React, { useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Download, Home, ArrowRight, Printer, Ticket, Calendar, DollarSign, User, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';

export default function BookingSuccess() {
    const location = useLocation();
    const navigate = useNavigate();
    const { booking, tickets, paymentResult } = location.state || {}; // Expect tickets now
    const ticketRefs = useRef([]);

    if (!booking) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen py-20 mt-20">
                <p className="text-gray-400 mb-4">No booking information found</p>
                <Link to="/" className="btn-primary">Go to Home</Link>
            </div>
        );
    }

    // Fallback if tickets aren't passed (legacy flow support)
    const ticketsList = tickets || [{
        ticketId: booking.id, // Fallback ID
        participantName: booking.userName,
        category: 'Standard',
        seat: 'General'
    }];

    const downloadTicket = async (index) => {
        if (ticketRefs.current[index]) {
            try {
                const dataUrl = await toPng(ticketRefs.current[index], { cacheBust: true, });
                const link = document.createElement('a');
                link.download = `Ticket-${booking.eventName}-${index + 1}.png`;
                link.href = dataUrl;
                link.click();
            } catch (err) {
                console.error("Error downloading ticket:", err);
            }
        }
    };

    return (
        <div className="min-h-screen pb-12" style={{ backgroundColor: '#ffffff' }}>
            <div className="max-w-4xl mx-auto px-4 py-10 mt-20">

                {/* Success Header */}
                <div className="text-center mb-12 animate-in fade-in zoom-in duration-500">
                    <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <h1 className="text-4xl font-black gradient-text mb-2">Registration Confirmed!</h1>
                    <p className="text-gray-500 text-lg">You have successfully booked {booking.numberOfTickets} ticket{booking.numberOfTickets > 1 ? 's' : ''}.</p>
                    <p className="text-sm font-mono text-gray-400 mt-2">Order ID: {booking.orderId}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {ticketsList.map((ticket, index) => (
                        <div
                            key={index}
                            ref={el => ticketRefs.current[index] = el}
                            className="glass-card overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative"
                        >
                            {/* Decorative Top */}
                            <div className="h-4 bg-gradient-brand"></div>

                            <div className="p-6 relative">
                                {/* Ticket Content */}
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="font-bold text-xl text-gray-900 leading-tight mb-1">{booking.eventName}</h3>
                                        <p className="text-sm text-indigo-600 font-medium">Official Event Pass</p>
                                    </div>
                                    <div className="bg-gray-100 px-3 py-1 rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest">
                                        {ticket.category || 'Standard'}
                                    </div>
                                </div>

                                <div className="border-t border-b border-dashed border-gray-200 py-6 mb-6 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Attendee</p>
                                        <p className="font-bold text-gray-800 flex items-center gap-1.5">
                                            <User className="w-4 h-4 text-indigo-500" />
                                            {ticket.participantName}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Date</p>
                                        <p className="font-bold text-gray-800 flex items-center gap-1.5">
                                            <Calendar className="w-4 h-4 text-indigo-500" />
                                            {booking.eventDate || 'Upcoming'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Ticket ID</p>
                                        <p className="font-mono text-xs text-gray-500 truncate" title={ticket.ticketId}>
                                            {ticket.ticketId}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Price</p>
                                        <p className="font-bold text-gray-800 flex items-center gap-1.5">
                                            <DollarSign className="w-4 h-4 text-indigo-500" />
                                            ₹{booking.totalAmount / booking.numberOfTickets}
                                        </p>
                                    </div>
                                </div>

                                {/* QR Code Section */}
                                <div className="flex flex-col items-center justify-center bg-white p-4 rounded-xl border border-gray-100 shadow-inner">
                                    <div style={{ height: "auto", margin: "0 auto", maxWidth: 128, width: "100%" }}>
                                        <QRCodeSVG
                                            size={256}
                                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                            value={ticket.ticketId}
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-widest text-center">Scan to Verify Check-in</p>
                                </div>
                            </div>

                            {/* Ticket Footer Actions */}
                            <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-between gap-2">
                                <button
                                    onClick={() => downloadTicket(index)}
                                    className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-gray-600 hover:text-indigo-600 transition-colors py-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-sm"
                                >
                                    <Download className="w-4 h-4" /> Save
                                </button>
                                <button className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-gray-600 hover:text-indigo-600 transition-colors py-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-sm">
                                    <Share2 className="w-4 h-4" /> Share
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 flex flex-col md:flex-row gap-4 justify-center">
                    <Link
                        to="/my-tickets"
                        className="btn-primary py-4 px-8 flex items-center justify-center font-bold"
                    >
                        <Ticket className="w-5 h-5 mr-2" />
                        View All My Tickets
                    </Link>
                    <Link
                        to="/"
                        className="btn-secondary py-4 px-8 flex items-center justify-center font-bold"
                    >
                        <Home className="w-5 h-5 mr-2" />
                        Back to Home
                    </Link>
                </div>

            </div>
        </div>
    );
}
