import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin } from 'lucide-react';

function getPriceSummary(event) {
    if (event.pricingCategories?.length > 0) {
        const prices = event.pricingCategories.map(c => Number(c.price)).filter(p => !isNaN(p));
        if (!prices.length) return 'Free';
        const min = Math.min(...prices), max = Math.max(...prices);
        return min === max ? '₹' + min : '₹' + min + ' – ₹' + max;
    }
    if (event.ticketTiers?.length > 0) {
        const prices = event.ticketTiers.map(t => Number(t.price)).filter(p => !isNaN(p));
        if (!prices.length) return 'Free';
        const min = Math.min(...prices), max = Math.max(...prices);
        return min === max ? '₹' + min : '₹' + min + ' – ₹' + max;
    }
    const flat = Number(event.ticketPrice);
    return flat > 0 ? '₹' + flat : 'Free';
}

function fmtDate(dateStr) {
    if (!dateStr) return '';
    try {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    } catch { return dateStr; }
}

const EventCard = React.memo(function EventCard({ event }) {
    const price = getPriceSummary(event);
    const isFree = price === 'Free';

    return (
        <Link
            to={`/event/${event.id}`}
            aria-label={`View details for ${event.name}`}
            className="group block bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200"
        >
            {/* Poster image — fixed height, portrait */}
            <div className="relative w-full overflow-hidden" style={{ height: '260px' }}>
                {event.posterURL ? (
                    <img
                        src={event.posterURL}
                        alt={event.name}
                        loading="lazy"
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #400763 0%, #680b56 60%, #ed0775 100%)' }}
                    >
                        <span className="text-white text-5xl font-extrabold opacity-20 select-none">
                            {event.name?.charAt(0) || 'E'}
                        </span>
                    </div>
                )}

                {/* Price badge */}
                <span
                    className="absolute top-2.5 right-2.5 text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{
                        background: isFree ? 'rgba(16,185,129,0.92)' : 'rgba(64,7,99,0.90)',
                        color: '#fff',
                        backdropFilter: 'blur(4px)',
                    }}
                >
                    {price}
                </span>
            </div>

            {/* Card body — compact */}
            <div className="px-4 py-3 space-y-1.5">
                <h3
                    className="font-semibold text-sm leading-snug line-clamp-2"
                    style={{ color: '#1a1a1a' }}
                >
                    {event.name}
                </h3>

                <div className="flex items-center gap-1.5" style={{ color: '#888' }}>
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    <span className="text-xs">{fmtDate(event.date)}</span>
                </div>

                {(event.venue || event.location) && (
                    <div className="flex items-center gap-1.5" style={{ color: '#888' }}>
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="text-xs truncate">{event.venue || event.location}</span>
                    </div>
                )}
            </div>
        </Link>
    );
});

export default EventCard;
