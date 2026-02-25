import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin } from 'lucide-react';

/**
 * getPriceSummary — handles flat / tiers / categories / free
 */
function getPriceSummary(event) {
    if (event.pricingCategories && event.pricingCategories.length > 0) {
        const prices = event.pricingCategories.map(c => Number(c.price)).filter(p => !isNaN(p));
        if (!prices.length) return 'Free';
        const min = Math.min(...prices), max = Math.max(...prices);
        return min === max ? '\u20b9' + min : '\u20b9' + min + ' \u2013 \u20b9' + max;
    }
    if (event.ticketTiers && event.ticketTiers.length > 0) {
        const prices = event.ticketTiers.map(t => Number(t.price)).filter(p => !isNaN(p));
        if (!prices.length) return 'Free';
        const min = Math.min(...prices), max = Math.max(...prices);
        return min === max ? '\u20b9' + min : '\u20b9' + min + ' \u2013 \u20b9' + max;
    }
    const flat = Number(event.ticketPrice);
    return flat > 0 ? '\u20b9' + flat : 'Free';
}

/**
 * Format a date string to "Mon DD, YYYY"
 */
function fmtDate(dateStr) {
    if (!dateStr) return '';
    try {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    } catch {
        return dateStr;
    }
}

/**
 * EventCard — compact, image-first card component.
 * Used on both the Home page and the Events listing page.
 */
export default function EventCard({ event }) {
    const price = getPriceSummary(event);
    const isFree = price === 'Free';

    return (
        <Link to={`/event/${event.id}`} className="event-card group block" aria-label={`View details for ${event.name}`}>
            {/* Poster image — 3:4 portrait aspect ratio */}
            <div className="event-card__image">
                {event.posterURL ? (
                    <img
                        src={event.posterURL}
                        alt={event.name}
                        loading="lazy"
                    />
                ) : (
                    /* Fallback gradient with initials */
                    <div
                        className="w-full h-full flex items-center justify-center"
                        style={{
                            background: 'linear-gradient(135deg, #400763 0%, #680b56 60%, #ed0775 100%)'
                        }}
                    >
                        <span className="text-white text-5xl font-extrabold opacity-30 select-none">
                            {event.name?.charAt(0) || 'E'}
                        </span>
                    </div>
                )}

                {/* Price badge — top right */}
                <span
                    className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{
                        background: isFree ? 'rgba(16,185,129,0.9)' : 'rgba(64,7,99,0.88)',
                        color: '#fff',
                        backdropFilter: 'blur(4px)',
                    }}
                >
                    {price}
                </span>
            </div>

            {/* Card body */}
            <div className="event-card__body">
                <h3
                    className="font-bold text-base leading-snug line-clamp-2"
                    style={{ color: '#1a1a1a' }}
                >
                    {event.name}
                </h3>

                <div className="flex items-center gap-1 mt-1" style={{ color: '#6b6b6b' }}>
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-xs">{fmtDate(event.date)}</span>
                </div>

                {(event.venue || event.location) && (
                    <div className="flex items-center gap-1" style={{ color: '#6b6b6b' }}>
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-xs truncate">{event.venue || event.location}</span>
                    </div>
                )}
            </div>


        </Link>
    );
}
