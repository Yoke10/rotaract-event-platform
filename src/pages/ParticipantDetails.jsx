import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { useForm, useFieldArray } from 'react-hook-form';
import { Loader2, ArrowRight, User, Mail, Phone, Ticket, CheckCircle2 } from 'lucide-react';

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

export default function ParticipantDetails() {
    const navigate = useNavigate();
    const location = useLocation();
    const { booking, paymentResult } = location.state || {};
    const initializedRef = useRef(false);
    const [generating, setGenerating] = useState(false);

    const { register, control, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: { participants: [] }
    });

    const { fields } = useFieldArray({ control, name: 'participants' });

    useEffect(() => {
        if (!booking) { navigate('/'); return; }
        if (!initializedRef.current) {
            const catSlots = [];
            if (booking.categorySelection?.length > 0) {
                booking.categorySelection.forEach(cs => {
                    for (let q = 0; q < cs.quantity; q++) catSlots.push(cs.categoryName);
                });
            }
            const defaultCategory = booking.selectedCategory || booking.selectedTier || 'Standard';
            const initialParticipants = Array.from({ length: booking.numberOfTickets }, (_, i) => ({
                name: '', email: '', mobile: '',
                category: catSlots[i] || defaultCategory
            }));
            reset({ participants: initialParticipants });
            initializedRef.current = true;
        }
    }, [booking, navigate, reset]);

    const onSubmit = async (data) => {
        setGenerating(true);
        try {
            const participantsWithMeta = data.participants.map(p => ({
                ...p,
                club: booking.club || 'Unknown',
                eventId: booking.eventId || '',
                eventName: booking.eventName || '',
                bookingId: booking.id || ''
            }));
            const tickets = await eventService.generateTickets(booking.id, booking.firestoreId, participantsWithMeta);
            navigate('/booking-success', {
                state: { booking, tickets, paymentResult }
            });
        } catch (error) {
            console.error('Error creating tickets:', error);
            alert('Failed to generate tickets. Please try again or contact support.');
        } finally {
            setGenerating(false);
        }
    };

    if (!booking) return null;

    const inp = 'glass-input text-sm';

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#f7f7f9' }}>
            <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-16">

                {/* Progress indicator */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ background: 'linear-gradient(135deg,#400763,#ed0775)' }}>
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold" style={{ color: '#6b6b6b' }}>Payment</span>
                    </div>
                    <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg,#680b56,#ed0775)' }} />
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ background: 'linear-gradient(135deg,#400763,#ed0775)' }}>2</div>
                        <span className="text-xs font-bold" style={{ color: '#400763' }}>Attendees</span>
                    </div>
                    <div className="flex-1 h-px" style={{ background: '#e5e5e5' }} />
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ background: '#f0f0f0', color: '#9b9b9b' }}>3</div>
                        <span className="text-xs font-semibold" style={{ color: '#aaa' }}>Tickets</span>
                    </div>
                </div>

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-extrabold mb-1" style={{ color: '#1a1a1a' }}>
                        Who's Attending?
                    </h1>
                    <p className="text-sm" style={{ color: '#6b6b6b' }}>
                        Enter details for all&nbsp;
                        <strong style={{ color: '#400763' }}>{booking.numberOfTickets}</strong>&nbsp;
                        ticket holder{booking.numberOfTickets > 1 ? 's' : ''} to generate their unique passes.
                    </p>
                </div>

                {/* Booking ref banner */}
                <div className="bg-white rounded-2xl px-5 py-4 mb-6 flex items-center justify-between shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: 'rgba(64,7,99,0.07)' }}>
                            <Ticket className="w-4.5 h-4.5" style={{ color: '#400763', width: '1.125rem', height: '1.125rem' }} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#9b9b9b' }}>Booking for</p>
                            <p className="text-sm font-bold leading-tight" style={{ color: '#1a1a1a' }}>{booking.eventName}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs" style={{ color: '#9b9b9b' }}>Order ID</p>
                        <p className="text-xs font-mono font-semibold" style={{ color: '#400763' }}>{booking.orderId}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {fields.map((field, index) => (
                        <div key={field.id}
                            className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">

                            {/* Card header */}
                            <div className="flex items-center gap-3 mb-5 pb-4 border-b" style={{ borderColor: '#f5f5f5' }}>
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                                    style={{ background: 'linear-gradient(135deg,#400763,#ed0775)' }}>
                                    {index + 1}
                                </div>
                                <div>
                                    <p className="font-bold text-sm" style={{ color: '#1a1a1a' }}>
                                        Ticket Holder #{index + 1}
                                    </p>
                                    {field.category && field.category !== 'Standard' && (
                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                                            style={{ background: 'rgba(64,7,99,0.06)', color: '#400763' }}>
                                            {field.category}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Full Name" required error={errors.participants?.[index]?.name && 'Required'}>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#bbb' }} />
                                        <input
                                            {...register(`participants.${index}.name`, { required: true })}
                                            placeholder="Full name"
                                            className={`${inp} pl-9`}
                                            disabled={generating}
                                        />
                                    </div>
                                </Field>

                                <Field label="Email" required error={errors.participants?.[index]?.email && 'Required'}>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#bbb' }} />
                                        <input
                                            {...register(`participants.${index}.email`, { required: true })}
                                            placeholder="email@example.com"
                                            className={`${inp} pl-9`}
                                            disabled={generating}
                                        />
                                    </div>
                                </Field>

                                <Field label="Mobile" required error={errors.participants?.[index]?.mobile && 'Required'}>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#bbb' }} />
                                        <input
                                            {...register(`participants.${index}.mobile`, { required: true })}
                                            placeholder="+91 9876543210"
                                            className={`${inp} pl-9`}
                                            disabled={generating}
                                        />
                                    </div>
                                </Field>
                            </div>
                        </div>
                    ))}

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={generating}
                            className="btn-primary py-3.5 px-8 text-sm disabled:opacity-60"
                        >
                            {generating ? (
                                <><Loader2 className="w-4 h-4 animate-spin" />Generating Tickets…</>
                            ) : (
                                <>Generate Tickets <ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
