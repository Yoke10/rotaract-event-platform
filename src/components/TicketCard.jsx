import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Calendar, Clock, MapPin, User, Download, Share2, CheckCircle, Clock as ClockIcon } from 'lucide-react';

/**
 * Shared professional ticket card component.
 * Full card = vertical/portrait boarding-pass layout.
 * Compact card = horizontal list-row for MyTickets list view.
 *
 * Props:
 *   ticket     – { ticketId, participantName, category, scanned, participantClub, ... }
 *   booking    – { eventName, eventDate, eventTime, eventVenue, eventPosterURL, orderId }
 *   ticketRef  – ref forwarded to printable zone (html-to-image)
 *   onDownload – () => void
 *   onShare    – () => void
 *   compact    – boolean — list-row mode
 *   onView     – () => void — opens detail view (compact mode only)
 */
export default function TicketCard({
    ticket,
    booking,
    ticketRef,
    onDownload,
    onShare,
    compact = false,
    onView,
}) {
    const isScanned = ticket?.scanned;
    const formattedDate = booking?.eventDate
        ? new Date(booking.eventDate).toLocaleDateString('en-IN', {
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
        })
        : null;
    const category = ticket?.category && ticket.category !== 'Standard' ? ticket.category : null;

    /* ── COMPACT list-row ─────────────────────────────────────── */
    if (compact) {
        return (
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md"
                style={{ border: '1px solid rgba(229,229,229,0.8)' }}>
                <div className="flex items-stretch">
                    {/* Left accent bar */}
                    <div className="w-1.5 flex-shrink-0"
                        style={{
                            background: isScanned
                                ? 'linear-gradient(180deg,#22c55e,#16a34a)'
                                : 'linear-gradient(180deg,#400763,#ed0775)'
                        }} />

                    {/* Poster thumbnail */}
                    {booking?.eventPosterURL && (
                        <div className="w-14 flex-shrink-0 overflow-hidden" style={{ background: '#f0f0f0' }}>
                            <img src={booking.eventPosterURL} alt={booking.eventName}
                                className="w-full h-full object-cover" style={{ minHeight: '60px' }} />
                        </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0 px-4 py-3.5">
                        <p className="font-bold text-sm truncate" style={{ color: '#1a1a1a' }}>
                            {ticket?.eventName || booking?.eventName}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#6b6b6b' }}>
                            {ticket?.participantName}
                            {category && <> · <span style={{ color: '#680b56' }}>{category}</span></>}
                        </p>
                        {formattedDate && (
                            <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#9b9b9b' }}>
                                <Calendar className="w-3 h-3" />{formattedDate}
                            </p>
                        )}
                    </div>

                    {/* Status + view */}
                    <div className="flex items-center gap-2 px-3 flex-shrink-0">
                        <span className="text-xs font-bold px-2 py-1 rounded-full"
                            style={isScanned
                                ? { background: 'rgba(34,197,94,0.1)', color: '#16a34a' }
                                : { background: 'rgba(64,7,99,0.07)', color: '#400763' }}>
                            {isScanned ? '✓ Used' : 'Valid'}
                        </span>
                        {onView && (
                            <button onClick={onView}
                                className="text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
                                style={{ background: 'rgba(64,7,99,0.07)', color: '#400763' }}>
                                View
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    /* ── FULL portrait ticket card ───────────────────────────── */
    return (
        <div className="overflow-hidden rounded-3xl shadow-lg max-w-sm mx-auto w-full"
            style={{ border: '1px solid rgba(220,220,220,0.7)' }}>

            {/* Printable zone */}
            <div ref={ticketRef} className="bg-white flex flex-col">

                {/* Top gradient bar */}
                <div className="h-1.5 w-full flex-shrink-0"
                    style={{ background: 'linear-gradient(90deg,#400763 0%,#680b56 40%,#ed0775 100%)' }} />

                {/* Poster (16:9 top banner) */}
                {booking?.eventPosterURL && (
                    <div className="w-full overflow-hidden flex-shrink-0"
                        style={{ aspectRatio: '16/9', background: '#f0f0f0' }}>
                        <img src={booking.eventPosterURL} alt={booking?.eventName}
                            className="w-full h-full object-cover" />
                    </div>
                )}

                {/* Event title + status */}
                <div className="px-5 pt-4 pb-1 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold uppercase tracking-widest mb-0.5"
                            style={{ color: '#ed0775' }}>Official Event Pass</p>
                        <h2 className="font-extrabold text-lg leading-snug"
                            style={{ color: '#1a1a1a' }}>
                            {booking?.eventName}
                        </h2>
                    </div>
                    {/* Status badge */}
                    <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full mt-1"
                        style={isScanned
                            ? { background: 'rgba(34,197,94,0.1)', color: '#16a34a' }
                            : { background: 'rgba(64,7,99,0.07)', color: '#400763' }}>
                        {isScanned
                            ? <><CheckCircle className="w-3 h-3" />Used</>
                            : <><ClockIcon className="w-3 h-3" />Valid</>}
                    </span>
                </div>

                {/* Category pill */}
                {category && (
                    <div className="px-5 pb-2">
                        <span className="text-xs font-semibold px-3 py-1 rounded-full"
                            style={{ background: 'rgba(64,7,99,0.07)', color: '#400763' }}>
                            {category}
                        </span>
                    </div>
                )}

                {/* Info grid */}
                <div className="px-5 pb-4 mt-1 grid grid-cols-2 gap-x-4 gap-y-3">
                    <InfoCell icon={User} label="Attendee" value={ticket?.participantName} />
                    {formattedDate && <InfoCell icon={Calendar} label="Date" value={formattedDate} />}
                    {booking?.eventTime && <InfoCell icon={Clock} label="Time" value={booking.eventTime} />}
                    {booking?.eventVenue && <InfoCell icon={MapPin} label="Venue" value={booking.eventVenue} span2 />}
                    {ticket?.participantClub && <InfoCell icon={null} label="Club" value={ticket.participantClub} />}
                </div>

                {/* Perforated divider */}
                <div className="relative flex items-center mx-0 my-1">
                    <div className="w-5 h-5 rounded-full flex-shrink-0 -ml-2.5 z-10"
                        style={{ background: '#f7f7f9', border: '1px solid #e0e0e0' }} />
                    <div className="flex-1 border-t border-dashed mx-1" style={{ borderColor: '#d0d0d0' }} />
                    <div className="w-5 h-5 rounded-full flex-shrink-0 -mr-2.5 z-10"
                        style={{ background: '#f7f7f9', border: '1px solid #e0e0e0' }} />
                </div>

                {/* QR section */}
                <div className="px-5 pt-4 pb-5 flex items-center gap-4">
                    <div className="flex-shrink-0 bg-white rounded-2xl p-2.5"
                        style={{ border: '1px solid #e8e8e8', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <QRCodeSVG
                            value={ticket?.ticketId || 'unknown'}
                            size={88}
                            bgColor="#ffffff"
                            fgColor="#1a1a1a"
                            level="H"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold uppercase tracking-widest mb-1"
                            style={{ color: '#9b9b9b' }}>Ticket ID</p>
                        <p className="font-mono text-xs font-bold break-all leading-relaxed"
                            style={{ color: '#400763' }}>
                            {ticket?.ticketId}
                        </p>
                        <p className="text-xs mt-1.5" style={{ color: '#bbb' }}>
                            Scan QR at entry for check-in
                        </p>
                    </div>
                </div>

                {/* Bottom gradient bar */}
                <div className="h-1 w-full flex-shrink-0"
                    style={{ background: 'linear-gradient(90deg,#400763 0%,#680b56 40%,#ed0775 100%)' }} />
            </div>

            {/* Action bar — outside printable zone */}
            <div className="flex items-center justify-end gap-2 px-5 py-3"
                style={{ background: '#fafafa', borderTop: '1px solid #f0f0f0' }}>
                {onDownload && (
                    <button onClick={onDownload} title="Download Ticket"
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                        style={{ background: 'rgba(64,7,99,0.07)', color: '#400763' }}>
                        <Download className="w-4 h-4" />
                    </button>
                )}
                {onShare && (
                    <button onClick={onShare} title="Share Ticket"
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                        style={{ background: 'rgba(237,7,117,0.07)', color: '#ed0775' }}>
                        <Share2 className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}

/* ── Cell used in the info grid ────────────────────────────────── */
function InfoCell({ icon: Icon, label, value, span2 = false }) {
    if (!value) return null;
    return (
        <div className={span2 ? 'col-span-2' : ''}>
            <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: '#b0b0b0' }}>
                {label}
            </p>
            <p className="text-sm font-semibold flex items-start gap-1.5 leading-snug" style={{ color: '#1a1a1a' }}>
                {Icon && <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#9b9b9b' }} />}
                <span className="truncate">{value}</span>
            </p>
        </div>
    );
}
