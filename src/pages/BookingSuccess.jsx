import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, Download, Home, ArrowRight, Printer } from 'lucide-react';

export default function BookingSuccess() {
    const location = useLocation();
    const navigate = useNavigate();
    const { booking, paymentResult } = location.state || {};

    if (!booking) {
        return (
            <div className="flex flex-col items-center justify-center min-vh-screen py-20 mt-20">
                <p className="text-gray-400 mb-4">No booking information found</p>
                <Link to="/" className="btn-primary">Go to Home</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-12" style={{ backgroundColor: '#ffffff' }}>
            <div className="max-w-2xl mx-auto px-4 py-10 mt-20">
                <div className="glass-card overflow-hidden">
                    <div className="bg-gradient-brand py-12 text-center text-white">
                        <div className="flex justify-center mb-4">
                            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                                <CheckCircle className="w-12 h-12 text-white" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-black mb-2">Registration Successful!</h1>
                        <p className="text-white/80 font-medium">Your tickets have been booked successfully</p>
                    </div>

                    <div className="p-8">
                        <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100 divide-y divide-gray-200">
                            <div className="flex justify-between py-4 first:pt-0">
                                <span style={{ color: '#6b6b6b' }} className="font-medium">Event Name</span>
                                <span className="font-bold text-right pl-4" style={{ color: '#1a1a1a' }}>{booking.eventName}</span>
                            </div>
                            <div className="flex justify-between py-4">
                                <span style={{ color: '#6b6b6b' }} className="font-medium">Participant</span>
                                <span className="font-bold" style={{ color: '#1a1a1a' }}>{booking.userName}</span>
                            </div>
                            <div className="flex justify-between py-4">
                                <span style={{ color: '#6b6b6b' }} className="font-medium">Ticket Count</span>
                                <span className="font-bold" style={{ color: '#1a1a1a' }}>{booking.numberOfTickets} Seat{booking.numberOfTickets > 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex justify-between py-4">
                                <span style={{ color: '#6b6b6b' }} className="font-medium">Amount Paid</span>
                                <span className="font-black text-xl" style={{ color: '#400763' }}>₹{booking.totalAmount}</span>
                            </div>
                            <div className="flex justify-between py-4 last:pb-0">
                                <span style={{ color: '#6b6b6b' }} className="font-medium font-mono text-[10px] uppercase">Transaction ID</span>
                                <span className="text-[10px] font-mono font-bold uppercase truncate" style={{ color: '#999999' }}>{booking.transactionId}</span>
                            </div>
                        </div>

                        <div className="alert-success mb-8 flex items-start">
                            <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                            <p className="text-sm">
                                <strong>Success!</strong> Your booking is confirmed. You can find your digital tickets under the <strong>My Tickets</strong> section.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                to="/my-tickets"
                                className="btn-primary flex-1 py-4 flex items-center justify-center font-bold"
                            >
                                <ArrowRight className="w-5 h-5 mr-2" />
                                View My Tickets
                            </Link>
                            <Link
                                to="/"
                                className="btn-secondary flex-1 py-4 flex items-center justify-center font-bold"
                            >
                                <Home className="w-5 h-5 mr-2" />
                                Back to Home
                            </Link>
                        </div>

                        <div className="mt-8 pt-8 border-t border-gray-100 text-center">
                            <button className="inline-flex items-center text-xs font-bold uppercase tracking-widest hover:opacity-70 transition-opacity" style={{ color: '#999999' }}>
                                <Printer className="w-4 h-4 mr-2" />
                                Print Confirmation
                            </button>
                        </div>
                    </div>
                </div>

                <p className="text-center text-[10px] uppercase tracking-tighter mt-8" style={{ color: '#cccccc' }}>
                    Registration Reference: {booking.orderId}
                </p>
            </div>
        </div>
    );
}
