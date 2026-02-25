import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/eventService';
import {
    Calendar, MapPin, Clock, Ticket, Loader2, ArrowLeft, Tag,
    Wifi, Coffee, Car, Wind, Accessibility, ShieldCheck, Camera,
    Users, AlertCircle, FileText, CheckCircle2, GitBranch, Layers,
    Lock
} from 'lucide-react';

const COMFORT_ICONS = {
    'Wi-Fi Access': Wifi,
    'Food & Beverages': Coffee,
    'Parking Available': Car,
    'Air Conditioning': Wind,
    'Wheelchair Accessible': Accessibility,
    'Security Personnel': ShieldCheck,
    'Photography / Videography': Camera,
    'First Aid Kit': AlertCircle,
    'Restrooms': Users,
};

function InfoChip({ icon: Icon, children, color = '#680b56', bg = 'rgba(104,11,86,0.06)' }) {
    return (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-1.5 rounded-full"
            style={{ background: bg, color }}>
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            {children}
        </span>
    );
}

export default function EventDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadEvent(); }, [id]);

    const loadEvent = async () => {
        try {
            const data = await eventService.getEvent(id);
            setEvent(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#680b56' }} />
        </div>
    );

    if (!event) return (
        <div className="max-w-2xl mx-auto px-4 py-24 mt-16 text-center">
            <p className="text-4xl mb-3">🎪</p>
            <p className="font-semibold text-lg" style={{ color: '#4a4a4a' }}>Event not found</p>
            <Link to="/events" className="btn-secondary mt-6 inline-flex">Back to Events</Link>
        </div>
    );

    const isSoldOut = event.totalTickets && (event.ticketsSold || 0) >= event.totalTickets;
    const isClosed = event.status !== 'active' ||
        (event.registrationCloseDate && new Date(event.registrationCloseDate) < new Date());

    const hasPricingCategories = event.pricingCategories && event.pricingCategories.length > 0;
    const hasTicketTiers = event.ticketTiers && event.ticketTiers.length > 0;
    const flatPrice = Number(event.ticketPrice);
    const isFlatPaid = !isNaN(flatPrice) && flatPrice > 0;
    const isFree = !hasPricingCategories && !hasTicketTiers && !isFlatPaid;

    const hasComforts = event.comforts && event.comforts.length > 0;
    const hasSubEvents = event.subEvents && event.subEvents.length > 0;
    const hasTerms = event.terms && event.terms !== 'Standard event terms apply.';
    const hasCancellationPolicy = event.cancellationPolicy && event.cancellationPolicy !== 'No cancellations allowed.';
    const showRegClose = event.eventType === 'rotaract' && event.registrationCloseDate;

    // Price summary string for sidebar
    const priceSummary = (() => {
        if (hasPricingCategories) {
            const prices = event.pricingCategories.map(c => Number(c.price)).filter(p => !isNaN(p));
            if (!prices.length) return 'Free';
            const min = Math.min(...prices), max = Math.max(...prices);
            return min === max ? '\u20b9' + min : '\u20b9' + min + ' \u2013 \u20b9' + max;
        }
        if (hasTicketTiers) {
            const prices = event.ticketTiers.map(t => Number(t.price)).filter(p => !isNaN(p));
            if (!prices.length) return 'Free';
            const min = Math.min(...prices), max = Math.max(...prices);
            return min === max ? '\u20b9' + min : '\u20b9' + min + ' \u2013 \u20b9' + max;
        }
        return isFlatPaid ? '\u20b9' + flatPrice : 'Free';
    })();

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#f7f7f9' }}>

            {/* ── Full-width landscape banner ── */}
            {(event.landscapePosterURL || event.posterURL) && (
                <div className="w-full mt-14 overflow-hidden"
                    style={{ maxHeight: '420px', aspectRatio: '21/7' }}>
                    <img
                        src={event.landscapePosterURL || event.posterURL}
                        alt={event.name}
                        className="w-full h-full object-cover"
                        style={{ filter: 'brightness(0.97)' }}
                    />
                </div>
            )}

            <div className="max-w-5xl mx-auto px-4 sm:px-6"
                style={{ marginTop: (event.landscapePosterURL || event.posterURL) ? '0' : '80px' }}>

                {/* ── Back link ── */}
                <Link to="/events"
                    className="inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-70 transition-opacity py-5"
                    style={{ color: '#680b56' }}>
                    <ArrowLeft className="w-4 h-4" /> All Events
                </Link>

                {/* ══════════════════════════════════
                    2-Column Grid
                ══════════════════════════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 pb-16 items-start">

                    {/* ── LEFT: Main Content ── */}
                    <div className="space-y-5">

                        {/* Header card */}
                        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
                            {event.club && (
                                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#ed0775' }}>
                                    Organised by {event.club}
                                </p>
                            )}
                            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-4" style={{ color: '#1a1a1a' }}>
                                {event.name}
                            </h1>

                            {/* Info chips */}
                            <div className="flex flex-wrap gap-2.5">
                                <InfoChip icon={Calendar} color="#400763" bg="rgba(64,7,99,0.06)">
                                    {new Date(event.date).toLocaleDateString('en-IN', {
                                        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                                    })}
                                </InfoChip>

                                {event.time && (
                                    <InfoChip icon={Clock} color="#ed0775" bg="rgba(237,7,117,0.06)">
                                        {event.time}
                                    </InfoChip>
                                )}

                                {(event.venue || event.location) && (
                                    <InfoChip icon={MapPin} color="#680b56" bg="rgba(104,11,86,0.06)">
                                        {event.venue || event.location}
                                    </InfoChip>
                                )}

                                {showRegClose && (
                                    <InfoChip icon={Calendar} color="#b45309" bg="rgba(245,158,11,0.08)">
                                        Reg. closes&nbsp;
                                        {new Date(event.registrationCloseDate).toLocaleDateString('en-IN', {
                                            month: 'short', day: 'numeric'
                                        })}
                                    </InfoChip>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        {event.description && (
                            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
                                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#680b56' }}>
                                    About this Event
                                </p>
                                <p className="text-base leading-relaxed whitespace-pre-wrap" style={{ color: '#2a2a2a', lineHeight: '1.8' }}>
                                    {event.description}
                                </p>
                            </div>
                        )}

                        {/* Sub-Events */}
                        {hasSubEvents && (
                            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
                                <div className="flex items-center gap-2 mb-5">
                                    <GitBranch className="w-5 h-5" style={{ color: '#400763' }} />
                                    <h2 className="text-base font-bold" style={{ color: '#1a1a1a' }}>
                                        Sessions / Sub-Events
                                    </h2>
                                </div>
                                <div className="space-y-3">
                                    {event.subEvents.map((se, i) => (
                                        <div key={i}
                                            className="flex items-start justify-between p-4 rounded-xl"
                                            style={{ background: 'rgba(64,7,99,0.03)', border: '1px solid rgba(64,7,99,0.08)' }}>
                                            <div className="flex-1 min-w-0 pr-4">
                                                <p className="font-semibold text-sm" style={{ color: '#1a1a1a' }}>{se.subEventName}</p>
                                                {se.description && (
                                                    <p className="text-xs mt-1" style={{ color: '#6b6b6b' }}>{se.description}</p>
                                                )}
                                                {se.maxParticipants && (
                                                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#9b9b9b' }}>
                                                        <Users className="w-3 h-3" /> Max {se.maxParticipants} participants
                                                    </p>
                                                )}
                                            </div>
                                            <span className="font-bold text-sm flex-shrink-0 px-3 py-1 rounded-full"
                                                style={{ background: Number(se.price) > 0 ? 'rgba(64,7,99,0.08)' : 'rgba(16,185,129,0.08)', color: Number(se.price) > 0 ? '#400763' : '#059669' }}>
                                                {Number(se.price) > 0 ? '\u20b9' + Number(se.price) : 'Free'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Amenities */}
                        {hasComforts && (
                            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
                                <div className="flex items-center gap-2 mb-5">
                                    <CheckCircle2 className="w-5 h-5" style={{ color: '#400763' }} />
                                    <h2 className="text-base font-bold" style={{ color: '#1a1a1a' }}>Amenities</h2>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                    {event.comforts.map((comfort, i) => {
                                        const Icon = COMFORT_ICONS[comfort] || CheckCircle2;
                                        return (
                                            <div key={i}
                                                className="flex items-center gap-2.5 p-3 rounded-xl"
                                                style={{ background: 'rgba(64,7,99,0.03)', border: '1px solid rgba(64,7,99,0.07)' }}>
                                                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                                    style={{ background: 'rgba(104,11,86,0.08)' }}>
                                                    <Icon className="w-3.5 h-3.5" style={{ color: '#680b56' }} />
                                                </div>
                                                <span className="text-xs font-medium" style={{ color: '#2a2a2a' }}>{comfort}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Policies */}
                        {(hasTerms || hasCancellationPolicy) && (
                            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
                                <div className="flex items-center gap-2 mb-5">
                                    <FileText className="w-5 h-5" style={{ color: '#400763' }} />
                                    <h2 className="text-base font-bold" style={{ color: '#1a1a1a' }}>Policies</h2>
                                </div>
                                <div className="space-y-5">
                                    {hasTerms && (
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#6b6b6b' }}>
                                                Terms &amp; Conditions
                                            </p>
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#4a4a4a', lineHeight: '1.7' }}>
                                                {event.terms}
                                            </p>
                                        </div>
                                    )}
                                    {hasCancellationPolicy && (
                                        <div className={hasTerms ? 'pt-4 border-t' : ''} style={{ borderColor: '#f0f0f0' }}>
                                            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#6b6b6b' }}>
                                                Cancellation Policy
                                            </p>
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#4a4a4a', lineHeight: '1.7' }}>
                                                {event.cancellationPolicy}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT: Sticky Booking Sidebar ── */}
                    <aside className="space-y-4 lg:sticky lg:top-24">

                        {/* Pricing card */}
                        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">

                            {/* Portrait poster (sidebar) — only when no landscape banner */}
                            {!event.landscapePosterURL && event.posterURL && (
                                <div style={{ aspectRatio: '3/4', maxHeight: '280px', overflow: 'hidden' }}>
                                    <img src={event.posterURL} alt={event.name}
                                        className="w-full h-full object-cover" />
                                </div>
                            )}

                            <div className="p-5">
                                {/* Price display */}
                                {hasPricingCategories ? (
                                    <>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Tag className="w-4 h-4" style={{ color: '#400763' }} />
                                            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#400763' }}>
                                                Pricing Categories
                                            </p>
                                        </div>
                                        <div className="space-y-2 mb-5">
                                            {event.pricingCategories.map((cat, i) => (
                                                <div key={i} className="flex justify-between items-center py-2.5 border-b last:border-0"
                                                    style={{ borderColor: '#f5f5f5' }}>
                                                    <span className="text-sm font-medium" style={{ color: '#2a2a2a' }}>{cat.categoryName}</span>
                                                    <span className="font-bold text-base" style={{ color: '#400763' }}>
                                                        {Number(cat.price) > 0 ? '\u20b9' + Number(cat.price) : 'Free'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : hasTicketTiers ? (
                                    <>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Layers className="w-4 h-4" style={{ color: '#400763' }} />
                                            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#400763' }}>
                                                Ticket Tiers
                                            </p>
                                        </div>
                                        <div className="space-y-2 mb-5">
                                            {event.ticketTiers.map((tier, i) => (
                                                <div key={i} className="flex justify-between items-start py-2.5 border-b last:border-0"
                                                    style={{ borderColor: '#f5f5f5' }}>
                                                    <div>
                                                        <span className="text-sm font-semibold" style={{ color: '#2a2a2a' }}>{tier.tierName}</span>
                                                        {tier.description && (
                                                            <p className="text-xs mt-0.5" style={{ color: '#9b9b9b' }}>{tier.description}</p>
                                                        )}
                                                    </div>
                                                    <span className="font-bold text-base ml-3 flex-shrink-0" style={{ color: '#400763' }}>
                                                        {Number(tier.price) > 0 ? '\u20b9' + Number(tier.price) : 'Free'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-between mb-5 pb-4 border-b" style={{ borderColor: '#f0f0f0' }}>
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                                style={{ background: 'rgba(237,7,117,0.08)' }}>
                                                <Ticket className="w-4.5 h-4.5" style={{ color: '#ed0775', width: '1.125rem', height: '1.125rem' }} />
                                            </div>
                                            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6b6b6b' }}>
                                                Ticket Price
                                            </p>
                                        </div>
                                        <p className="text-2xl font-extrabold" style={{ color: '#400763' }}>
                                            {isFlatPaid ? '\u20b9' + flatPrice : 'Free'}
                                        </p>
                                    </div>
                                )}

                                {/* Starting from (multi-tier / category summary) */}
                                {(hasPricingCategories || hasTicketTiers) && (
                                    <div className="flex items-baseline justify-between mb-4">
                                        <span className="text-xs" style={{ color: '#9b9b9b' }}>Starting from</span>
                                        <span className="text-xl font-extrabold" style={{ color: '#400763' }}>{priceSummary}</span>
                                    </div>
                                )}

                                {/* CTA */}
                                {isClosed ? (
                                    <button disabled className="w-full py-3.5 rounded-full font-bold text-sm bg-gray-100 text-gray-400 cursor-not-allowed">
                                        Registration Closed
                                    </button>
                                ) : isSoldOut ? (
                                    <button disabled className="w-full py-3.5 rounded-full font-bold text-sm bg-red-50 text-red-400 cursor-not-allowed border border-red-200">
                                        Sold Out
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            const dest = `/booking/${event.id}`;
                                            if (!currentUser) {
                                                navigate('/login', {
                                                    state: { from: { pathname: dest } }
                                                });
                                            } else {
                                                navigate(dest);
                                            }
                                        }}
                                        className="btn-primary w-full justify-center py-3.5 text-sm"
                                    >
                                        <Lock className="w-4 h-4" />
                                        {isFree ? 'Register Now — Free' : 'Book Tickets →'}
                                    </button>
                                )}

                                <div className="flex items-center justify-center gap-1.5 mt-3 text-xs" style={{ color: '#ccc' }}>
                                    <ShieldCheck className="w-3 h-3" />
                                    <span>Secure Registration</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick details card */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3.5">
                            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#6b6b6b' }}>Event Details</p>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                                    style={{ background: 'rgba(64,7,99,0.06)' }}>
                                    <Calendar className="w-4 h-4" style={{ color: '#400763' }} />
                                </div>
                                <div>
                                    <p className="text-xs" style={{ color: '#9b9b9b' }}>Date</p>
                                    <p className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>
                                        {new Date(event.date).toLocaleDateString('en-IN', {
                                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>

                            {event.time && (
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                                        style={{ background: 'rgba(237,7,117,0.06)' }}>
                                        <Clock className="w-4 h-4" style={{ color: '#ed0775' }} />
                                    </div>
                                    <div>
                                        <p className="text-xs" style={{ color: '#9b9b9b' }}>Time</p>
                                        <p className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>{event.time}</p>
                                    </div>
                                </div>
                            )}

                            {(event.venue || event.location) && (
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                                        style={{ background: 'rgba(104,11,86,0.06)' }}>
                                        <MapPin className="w-4 h-4" style={{ color: '#680b56' }} />
                                    </div>
                                    <div>
                                        <p className="text-xs" style={{ color: '#9b9b9b' }}>Venue</p>
                                        <p className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>{event.venue || event.location}</p>
                                    </div>
                                </div>
                            )}

                            {showRegClose && (
                                <div className="flex items-start gap-3 pt-2 border-t" style={{ borderColor: '#f5f5f5' }}>
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                                        style={{ background: 'rgba(245,158,11,0.08)' }}>
                                        <AlertCircle className="w-4 h-4" style={{ color: '#b45309' }} />
                                    </div>
                                    <div>
                                        <p className="text-xs" style={{ color: '#9b9b9b' }}>Registration Closes</p>
                                        <p className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>
                                            {new Date(event.registrationCloseDate).toLocaleDateString('en-IN', {
                                                weekday: 'short', month: 'long', day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* spacer — no second CTA here, sticky bar below handles mobile */}
                    </aside>
                </div>
            </div>

            {/* ── Sticky bottom CTA — mobile only ── */}
            {!isClosed && !isSoldOut && (
                <div className="fixed bottom-0 inset-x-0 lg:hidden z-50 px-4 pb-4 pt-2"
                    style={{ background: 'linear-gradient(to top, rgba(247,247,249,0.98) 70%, transparent)' }}>
                    <Link to={`/booking/${event.id}`}
                        className="btn-primary w-full justify-center py-4 text-base shadow-xl">
                        <Lock className="w-4 h-4" />
                        {isFree ? 'Register Now — Free' : 'Book Tickets →'}
                    </Link>
                </div>
            )}
        </div>
    );
}
