import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { mockPaymentService } from '../services/mockPaymentService';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import {
    Loader2, CheckCircle, XCircle, ArrowLeft,
    Shield, Plus, Minus, ChevronDown,
    Calendar, MapPin, Clock, Lock, User, Mail, Phone, Home
} from 'lucide-react';

// ── Helper: derive payment mode from event data ─────────────────
function getPricingMode(event) {
    if (event.pricingCategories && event.pricingCategories.length > 0) return 'categories';
    if (event.ticketTiers && event.ticketTiers.length > 0) return 'tiers';
    return 'flat';
}

// ── Small labelled input ─────────────────────────────────────────
function Field({ label, required, error, children }) {
    return (
        <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#4a4a4a' }}>
                {label}{required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            {children}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}

export default function Booking() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [paymentResult, setPaymentResult] = useState(null);

    // ── Pricing state ────────────────────────────────────────────
    const [categoryQty, setCategoryQty] = useState({});
    const [selectedTierIdx, setSelectedTierIdx] = useState(0);
    const [tierQty, setTierQty] = useState(1);
    const [flatQty, setFlatQty] = useState(1);
    const [bookingCustomResponses, setBookingCustomResponses] = useState({});

    const { register, handleSubmit, watch, formState: { errors } } = useForm();

    useEffect(() => {
        loadEvent();
    }, [id]);

    const loadEvent = async () => {
        try {
            const data = await eventService.getEvent(id);
            if (!data) { navigate('/'); return; }
            setEvent(data);
            if (data.pricingCategories?.length > 0) {
                const init = {};
                data.pricingCategories.forEach((_, i) => { init[i] = 0; });
                setCategoryQty(init);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    // kept for form registration compatibility
    const numberOfTicketsFlat = flatQty;
    const pricingMode = event ? getPricingMode(event) : 'flat';

    const computedTotal = (() => {
        if (!event) return 0;
        if (pricingMode === 'categories')
            return Object.entries(categoryQty).reduce((sum, [idx, qty]) => {
                return sum + (Number(event.pricingCategories[idx]?.price) || 0) * (parseInt(qty) || 0);
            }, 0);
        if (pricingMode === 'tiers')
            return (Number(event.ticketTiers[selectedTierIdx]?.price) || 0) * (parseInt(tierQty) || 1);
        return (Number(event.ticketPrice) || 0) * numberOfTicketsFlat;
    })();

    const computedTicketCount = (() => {
        if (!event) return 0;
        if (pricingMode === 'categories')
            return Object.values(categoryQty).reduce((s, q) => s + (parseInt(q) || 0), 0);
        if (pricingMode === 'tiers') return parseInt(tierQty) || 1;
        return numberOfTicketsFlat;
    })();

    const changeCatQty = (idx, delta) =>
        setCategoryQty(prev => ({ ...prev, [idx]: Math.max(0, (parseInt(prev[idx]) || 0) + delta) }));

    const onProceedToPay = async (data) => {
        if (computedTicketCount < 1) { alert('Please select at least one ticket.'); return; }
        setProcessing(true);
        setPaymentResult(null);
        try {
            let selectionLabel = null;
            if (pricingMode === 'categories') {
                selectionLabel = Object.entries(categoryQty)
                    .filter(([, q]) => parseInt(q) > 0)
                    .map(([idx, q]) => `${event.pricingCategories[idx].categoryName} \u00d7${q}`)
                    .join(', ');
            } else if (pricingMode === 'tiers') {
                selectionLabel = `${event.ticketTiers[selectedTierIdx].tierName} \u00d7${tierQty}`;
            }

            const paymentData = {
                name: data.name, email: data.email, mobile: data.mobile,
                amount: computedTotal, eventId: id, eventName: event.name,
                numberOfTickets: computedTicketCount, club: data.club,
            };

            const result = await mockPaymentService.processPayment(paymentData);
            setPaymentResult(result);

            if (result.success) {
                const bookingBase = {
                    eventId: id, eventName: event.name, userId: currentUser.uid,
                    userEmail: data.email, userName: data.name, mobile: data.mobile,
                    club: data.club, numberOfTickets: computedTicketCount,
                    totalAmount: computedTotal, transactionId: result.transactionId,
                    orderId: result.orderId, paymentStatus: 'SUCCESS',
                    bookingDate: new Date().toISOString(), status: 'confirmed',
                    createdAt: new Date().toISOString(), pricingMode,
                    // Extra event meta for ticket display
                    eventPosterURL: event.posterURL || event.landscapePosterURL || null,
                    eventDate: event.date || null,
                    eventTime: event.time || null,
                    eventVenue: event.venue || event.location || null,
                };
                if (pricingMode === 'categories') {
                    bookingBase.categorySelection = Object.entries(categoryQty)
                        .filter(([, q]) => parseInt(q) > 0)
                        .map(([idx, q]) => ({
                            categoryName: event.pricingCategories[idx].categoryName,
                            price: Number(event.pricingCategories[idx].price),
                            quantity: parseInt(q),
                        }));
                    bookingBase.selectionLabel = selectionLabel;
                    bookingBase.selectedCategory = event.pricingCategories
                        .filter((_, i) => parseInt(categoryQty[i]) > 0)
                        .map(c => c.categoryName).join(', ');
                } else if (pricingMode === 'tiers') {
                    bookingBase.selectedTier = tier.tierName;
                    bookingBase.tierPrice = Number(tier.price);
                    bookingBase.selectionLabel = selectionLabel;
                    bookingBase.selectedCategory = tier.tierName;
                }

                // Attach order-level custom responses
                if (Object.keys(bookingCustomResponses).length > 0) {
                    bookingBase.customFieldResponses = bookingCustomResponses;
                }
                const createdBooking = await eventService.createBooking(bookingBase);
                setTimeout(() => navigate('/participant-details', {
                    state: {
                        booking: { ...bookingBase, firestoreId: createdBooking.firestoreId },
                        paymentResult: result,
                        customFieldDefinitions: event.customFields || [],
                    }
                }), 1500);
            }
        } catch (error) {
            console.error('Payment error:', error);
            setPaymentResult({ success: false, message: error.message || 'Payment processing failed' });
        } finally { setProcessing(false); }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#680b56' }} />
        </div>
    );
    if (!event) return null;

    const inp = 'glass-input text-sm';

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#f7f7f9' }}>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-16">

                {/* ── Back link ── */}
                <Link to={`/event/${id}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 mt-4 hover:opacity-70 transition-opacity"
                    style={{ color: '#680b56' }}>
                    <ArrowLeft className="w-4 h-4" /> Back to Event
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">

                    {/* ══════════════════════════════════
                        LEFT — Checkout Form
                    ══════════════════════════════════ */}
                    <div className="space-y-5">

                        {/* Payment result banner */}
                        {paymentResult && (
                            <div className={`flex items-start gap-3 p-4 rounded-2xl border ${paymentResult.success
                                ? 'bg-green-50 border-green-200 text-green-800'
                                : 'bg-red-50 border-red-200 text-red-800'}`}>
                                {paymentResult.success
                                    ? <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-600" />
                                    : <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-500" />}
                                <div>
                                    <p className="font-semibold text-sm">
                                        {paymentResult.success ? 'Payment Successful!' : 'Payment Failed'}
                                    </p>
                                    <p className="text-xs mt-0.5 opacity-80">{paymentResult.message}</p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onProceedToPay)} className="space-y-5">

                            {/* ── Contact Info ── */}
                            <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
                                <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: '#680b56' }}>
                                    Contact Information
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label="Full Name" required error={errors.name && 'Required'}>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#aaa' }} />
                                            <input
                                                {...register('name', { required: true })}
                                                defaultValue={currentUser?.displayName || ''}
                                                placeholder="Your full name"
                                                className={`${inp} pl-9`}
                                                disabled={processing}
                                            />
                                        </div>
                                    </Field>

                                    <Field label="Email" required error={errors.email && 'Required'}>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#aaa' }} />
                                            <input
                                                {...register('email', { required: true })}
                                                defaultValue={currentUser?.email || ''}
                                                placeholder="you@email.com"
                                                className={`${inp} pl-9`}
                                                disabled={processing}
                                            />
                                        </div>
                                    </Field>

                                    <Field label="Mobile" required error={errors.mobile && 'Required'}>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#aaa' }} />
                                            <input
                                                type="tel"
                                                {...register('mobile', { required: true })}
                                                placeholder="+91 9876543210"
                                                className={`${inp} pl-9`}
                                                disabled={processing}
                                            />
                                        </div>
                                    </Field>

                                    <Field label="Your Club" required error={errors.club && 'Required'}>
                                        <div className="relative">
                                            <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#aaa' }} />
                                            <select
                                                {...register('club', { required: true })}
                                                className={`${inp} pl-9 appearance-none`}
                                                disabled={processing}
                                            >
                                                <option value="">Select your club</option>
                                                {event.clubs && event.clubs.length > 0 ? (
                                                    event.clubs.map(c => (
                                                        <option key={c.id} value={c.name}>{c.name}</option>
                                                    ))
                                                ) : (
                                                    <option value="Other">Other</option>
                                                )}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#aaa' }} />
                                        </div>
                                    </Field>
                                </div>
                            </section>


                            {/* ── Order/Booking Level Custom Fields ── */}
                            {event.customFields?.filter(f => f.displayLocation === 'booking').length > 0 && (
                                <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
                                    <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: '#680b56' }}>
                                        Additional Details
                                    </h2>
                                    <div className="space-y-4">
                                        {event.customFields.filter(f => f.displayLocation === 'booking').map((field, i) => {
                                            const options = Array.isArray(field.options) ? field.options :
                                                (typeof field.options === 'string' ? field.options.split(',').map(o => o.trim()).filter(Boolean) : []);

                                            return (
                                                <Field key={i} label={field.label} required={field.required}>
                                                    {field.type === 'textarea' ? (
                                                        <textarea required={field.required} rows={3} className={inp}
                                                            value={bookingCustomResponses[field.label] || ''}
                                                            onChange={e => setBookingCustomResponses(p => ({ ...p, [field.label]: e.target.value }))} />
                                                    ) : field.type === 'select' ? (
                                                        <select required={field.required} className={inp}
                                                            value={bookingCustomResponses[field.label] || ''}
                                                            onChange={e => setBookingCustomResponses(p => ({ ...p, [field.label]: e.target.value }))}>
                                                            <option value="">Select an option</option>
                                                            {options.map((opt, j) => (
                                                                <option key={j} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    ) : field.type === 'checkbox' ? (
                                                        <div className="space-y-2 mt-2">
                                                            {options.map((opt, j) => {
                                                                const currentArr = bookingCustomResponses[field.label] || [];
                                                                return (
                                                                    <label key={j} className="flex items-center gap-2 cursor-pointer">
                                                                        <input type="checkbox"
                                                                            checked={currentArr.includes(opt)}
                                                                            onChange={(e) => {
                                                                                const isChecked = e.target.checked;
                                                                                setBookingCustomResponses(p => {
                                                                                    const arr = p[field.label] || [];
                                                                                    if (isChecked) return { ...p, [field.label]: [...arr, opt] };
                                                                                    return { ...p, [field.label]: arr.filter(x => x !== opt) };
                                                                                });
                                                                            }}
                                                                            className="rounded border-gray-300 text-indigo-600 h-4 w-4" />
                                                                        <span className="text-sm text-gray-700">{opt}</span>
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <input type={field.type || 'text'} required={field.required} className={inp}
                                                            value={bookingCustomResponses[field.label] || ''}
                                                            onChange={e => setBookingCustomResponses(p => ({ ...p, [field.label]: e.target.value }))} />
                                                    )}
                                                </Field>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}

                            {/* ── Ticket Selection ── */}
                            <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
                                <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: '#680b56' }}>
                                    Ticket Selection
                                </h2>

                                {pricingMode === 'categories' && (
                                    <div className="space-y-2.5">
                                        {event.pricingCategories.map((cat, i) => (
                                            <div key={i}
                                                className="flex items-center justify-between px-4 py-3.5 rounded-xl border transition-colors"
                                                style={{
                                                    borderColor: (categoryQty[i] || 0) > 0 ? '#400763' : 'rgba(229,229,229,0.9)',
                                                    background: (categoryQty[i] || 0) > 0 ? 'rgba(64,7,99,0.03)' : '#fff'
                                                }}>
                                                <div>
                                                    <p className="font-semibold text-sm" style={{ color: '#1a1a1a' }}>{cat.categoryName}</p>
                                                    <p className="font-bold mt-0.5" style={{ color: '#400763', fontSize: '1.05rem' }}>
                                                        {Number(cat.price) > 0 ? '\u20b9' + Number(cat.price) : 'Free'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button type="button" onClick={() => changeCatQty(i, -1)}
                                                        disabled={processing || (categoryQty[i] || 0) === 0}
                                                        className="w-8 h-8 rounded-full border flex items-center justify-center transition-colors disabled:opacity-30"
                                                        style={{ borderColor: '#ddd', background: 'white' }}>
                                                        <Minus className="w-3.5 h-3.5" style={{ color: '#400763' }} />
                                                    </button>
                                                    <span className="w-7 text-center font-bold text-base" style={{ color: '#1a1a1a' }}>
                                                        {categoryQty[i] || 0}
                                                    </span>
                                                    <button type="button" onClick={() => changeCatQty(i, 1)}
                                                        disabled={processing}
                                                        className="w-8 h-8 rounded-full flex items-center justify-center text-white transition-opacity disabled:opacity-30"
                                                        style={{ background: 'linear-gradient(135deg,#400763,#ed0775)' }}>
                                                        <Plus className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {pricingMode === 'tiers' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Field label="Ticket Tier">
                                            <div className="relative">
                                                <select
                                                    className={`${inp} appearance-none pr-9`}
                                                    value={selectedTierIdx}
                                                    onChange={e => setSelectedTierIdx(Number(e.target.value))}
                                                    disabled={processing}>
                                                    {event.ticketTiers.map((tier, i) => (
                                                        <option key={i} value={i}>
                                                            {tier.tierName} — \u20b9{Number(tier.price)}{tier.maxQuantity ? ` (max ${tier.maxQuantity})` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#aaa' }} />
                                            </div>
                                            {event.ticketTiers[selectedTierIdx]?.description && (
                                                <p className="text-xs mt-1" style={{ color: '#6b6b6b' }}>{event.ticketTiers[selectedTierIdx].description}</p>
                                            )}
                                        </Field>

                                        <Field label="Quantity">
                                            <div className="flex items-center gap-3">
                                                <button type="button" onClick={() => setTierQty(q => Math.max(1, q - 1))}
                                                    disabled={processing || tierQty <= 1}
                                                    className="w-9 h-9 rounded-full border flex items-center justify-center disabled:opacity-30"
                                                    style={{ borderColor: '#ddd', background: 'white' }}>
                                                    <Minus className="w-3.5 h-3.5" style={{ color: '#400763' }} />
                                                </button>
                                                <span className="text-lg font-bold w-8 text-center" style={{ color: '#1a1a1a' }}>{tierQty}</span>
                                                <button type="button" onClick={() => setTierQty(q => q + 1)}
                                                    disabled={processing || tierQty >= (event.ticketTiers[selectedTierIdx]?.maxQuantity || 10)}
                                                    className="w-9 h-9 rounded-full flex items-center justify-center text-white disabled:opacity-30"
                                                    style={{ background: 'linear-gradient(135deg,#400763,#ed0775)' }}>
                                                    <Plus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </Field>
                                    </div>
                                )}

                                {pricingMode === 'flat' && (
                                    <Field label="Number of Tickets">
                                        <div className="flex items-center gap-3 mt-1">
                                            <button type="button"
                                                onClick={() => setFlatQty(q => Math.max(1, q - 1))}
                                                disabled={processing || flatQty <= 1}
                                                className="w-9 h-9 rounded-full border flex items-center justify-center disabled:opacity-30"
                                                style={{ borderColor: '#ddd', background: 'white' }}>
                                                <Minus className="w-3.5 h-3.5" style={{ color: '#400763' }} />
                                            </button>
                                            <span className="text-xl font-bold w-8 text-center" style={{ color: '#1a1a1a' }}>
                                                {flatQty}
                                            </span>
                                            <button type="button"
                                                onClick={() => setFlatQty(q => Math.min(10, q + 1))}
                                                disabled={processing || flatQty >= 10}
                                                className="w-9 h-9 rounded-full flex items-center justify-center text-white disabled:opacity-30"
                                                style={{ background: 'linear-gradient(135deg,#400763,#ed0775)' }}>
                                                <Plus className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </Field>
                                )}
                            </section>

                        </form>
                    </div>

                    {/* ══════════════════════════════════
                        RIGHT — Order Summary Sidebar
                    ══════════════════════════════════ */}
                    <aside className="space-y-4 lg:sticky lg:top-24">

                        {/* Event Card */}
                        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                            {event.posterURL && (
                                <div style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
                                    <img src={event.posterURL} alt={event.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="p-4">
                                <p className="font-bold text-sm leading-snug mb-2" style={{ color: '#1a1a1a' }}>{event.name}</p>
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-xs" style={{ color: '#6b6b6b' }}>
                                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#680b56' }} />
                                        {new Date(event.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    {event.time && (
                                        <div className="flex items-center gap-2 text-xs" style={{ color: '#6b6b6b' }}>
                                            <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#680b56' }} />
                                            {event.time}
                                        </div>
                                    )}
                                    {(event.venue || event.location) && (
                                        <div className="flex items-center gap-2 text-xs" style={{ color: '#6b6b6b' }}>
                                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#680b56' }} />
                                            {event.venue || event.location}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Order Total */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#6b6b6b' }}>Order Summary</p>

                            <div className="space-y-2 mb-4">
                                {pricingMode === 'categories' && Object.entries(categoryQty).filter(([, q]) => parseInt(q) > 0).map(([idx, q]) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span style={{ color: '#4a4a4a' }}>{event.pricingCategories[idx]?.categoryName} × {q}</span>
                                        <span className="font-semibold" style={{ color: '#1a1a1a' }}>
                                            \u20b9{(Number(event.pricingCategories[idx]?.price) || 0) * parseInt(q)}
                                        </span>
                                    </div>
                                ))}
                                {pricingMode === 'tiers' && (
                                    <div className="flex justify-between text-sm">
                                        <span style={{ color: '#4a4a4a' }}>{event.ticketTiers[selectedTierIdx]?.tierName} × {tierQty}</span>
                                        <span className="font-semibold" style={{ color: '#1a1a1a' }}>
                                            \u20b9{(Number(event.ticketTiers[selectedTierIdx]?.price) || 0) * tierQty}
                                        </span>
                                    </div>
                                )}
                                {pricingMode === 'flat' && (
                                    <div className="flex justify-between text-sm">
                                        <span style={{ color: '#4a4a4a' }}>
                                            {numberOfTicketsFlat} ticket{numberOfTicketsFlat !== 1 ? 's' : ''}
                                            {Number(event.ticketPrice) > 0 ? ` × \u20b9${Number(event.ticketPrice)}` : ''}
                                        </span>
                                        <span className="font-semibold" style={{ color: '#1a1a1a' }}>
                                            {computedTotal > 0 ? '\u20b9' + computedTotal : 'Free'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="border-t pt-3" style={{ borderColor: '#f0f0f0' }}>
                                <div className="flex justify-between items-baseline">
                                    <span className="text-sm font-semibold" style={{ color: '#4a4a4a' }}>Total</span>
                                    <span className="text-2xl font-extrabold" style={{ color: '#400763' }}>
                                        {computedTotal > 0 ? '\u20b9' + computedTotal : '\u20b90'}
                                    </span>
                                </div>
                                {computedTicketCount > 0 && (
                                    <p className="text-xs mt-0.5" style={{ color: '#999' }}>
                                        {computedTicketCount} ticket{computedTicketCount !== 1 ? 's' : ''}
                                    </p>
                                )}
                            </div>

                            {/* Submit Button (Now visible on both Mobile and Desktop) */}
                            <button
                                type="button"
                                onClick={handleSubmit(onProceedToPay)}
                                disabled={processing || paymentResult?.success || computedTicketCount < 1}
                                className="btn-primary w-full mt-4 py-3.5 text-sm"
                            >
                                {processing ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" />Processing…</>
                                ) : paymentResult?.success ? (
                                    <><CheckCircle className="w-4 h-4" />Redirecting…</>
                                ) : computedTicketCount < 1 ? (
                                    'Select a ticket above'
                                ) : (
                                    <>
                                        <Lock className="w-4 h-4" />
                                        {computedTotal > 0 ? `Pay \u20b9${computedTotal}` : 'Confirm Free Registration'}
                                    </>
                                )}
                            </button>

                            <div className="flex items-center justify-center gap-1.5 mt-3 text-xs" style={{ color: '#bbb' }}>
                                <Shield className="w-3 h-3" />
                                <span>Secured & Encrypted</span>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}

