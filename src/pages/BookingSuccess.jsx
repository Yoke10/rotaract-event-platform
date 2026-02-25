import React, { useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, Home, Ticket } from 'lucide-react';
import { toPng } from 'html-to-image';
import TicketCard from '../components/TicketCard';

export default function BookingSuccess() {
    const location = useLocation();
    const { booking, tickets } = location.state || {};
    const ticketRefs = useRef([]);

    if (!booking) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p className="mb-4" style={{ color: '#6b6b6b' }}>No booking information found</p>
                <Link to="/" className="btn-primary">Go to Home</Link>
            </div>
        );
    }

    const ticketsList = tickets || [{
        ticketId: booking.id,
        participantName: booking.userName,
        category: 'Standard',
    }];

    const downloadTicket = async (index) => {
        const el = ticketRefs.current[index];
        if (!el) return;
        try {
            const dataUrl = await toPng(el, { cacheBust: true, pixelRatio: 3 });
            const a = document.createElement('a');
            a.download = `ticket-${booking.eventName}-${index + 1}.png`;
            a.href = dataUrl;
            a.click();
        } catch (err) { console.error('Download failed:', err); }
    };

    const shareTicket = async (ticket) => {
        const text = `I'm attending ${booking.eventName}! 🎉\nTicket: ${ticket.ticketId}`;
        if (navigator.share) {
            navigator.share({ title: booking.eventName, text }).catch(() => { });
        } else {
            navigator.clipboard.writeText(text).catch(() => { });
            alert('Ticket info copied to clipboard!');
        }
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#f7f7f9' }}>
            <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-20">

                {/* Success header */}
                <div className="text-center mb-10">
                    <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
                        style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
                        <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold mb-1" style={{ color: '#1a1a1a' }}>
                        You're Registered!
                    </h1>
                    <p className="text-sm" style={{ color: '#6b6b6b' }}>
                        {booking.numberOfTickets} ticket{booking.numberOfTickets > 1 ? 's' : ''} confirmed for&nbsp;
                        <strong style={{ color: '#400763' }}>{booking.eventName}</strong>
                    </p>
                    <p className="text-xs font-mono mt-2 px-3 py-1 rounded-full inline-block"
                        style={{ background: 'rgba(64,7,99,0.07)', color: '#680b56' }}>
                        Order #{booking.orderId}
                    </p>
                </div>

                {/* Tickets */}
                <div className="space-y-5">
                    {ticketsList.map((ticket, index) => (
                        <TicketCard
                            key={index}
                            ticket={ticket}
                            booking={booking}
                            ticketRef={el => ticketRefs.current[index] = el}
                            onDownload={() => downloadTicket(index)}
                            onShare={() => shareTicket(ticket)}
                        />
                    ))}
                </div>

                {/* Bottom actions */}
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                    <Link to="/my-tickets" className="btn-primary justify-center py-3.5 px-8 text-sm">
                        <Ticket className="w-4 h-4" />
                        View My Tickets
                    </Link>
                    <Link to="/" className="btn-secondary justify-center py-3.5 px-8 text-sm">
                        <Home className="w-4 h-4" />
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
