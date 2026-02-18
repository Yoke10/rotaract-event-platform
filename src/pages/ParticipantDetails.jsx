import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { useForm, useFieldArray } from 'react-hook-form';
import { Loader2, Users, Ticket, ArrowRight, Shield, User } from 'lucide-react';

export default function ParticipantDetails() {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { booking, paymentResult } = location.state || {};

    // Safety ref to prevent double initialization in Strict Mode
    const initializedRef = useRef(false);

    const [generating, setGenerating] = useState(false);

    const { register, control, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            participants: []
        }
    });

    const { fields } = useFieldArray({
        control,
        name: "participants"
    });

    useEffect(() => {
        if (!booking) {
            navigate('/');
            return;
        }

        // Initialize form fields based on ticket count
        // Use reset to set all fields at once, avoiding incremental append issues
        if (!initializedRef.current) {
            const initialParticipants = [];
            for (let i = 0; i < booking.numberOfTickets; i++) {
                initialParticipants.push({
                    name: '',
                    email: '',
                    mobile: '',
                    category: 'Standard'
                });
            }

            reset({ participants: initialParticipants });
            initializedRef.current = true;
        }

    }, [booking, navigate, reset]);

    const onSubmit = async (data) => {
        setGenerating(true);
        try {
            // Enrich participant data with event info and CLUB from booking
            const participantsWithMeta = data.participants.map(p => ({
                ...p,
                club: booking.club || 'Unknown', // Ensure no undefined
                eventId: booking.eventId || '',
                eventName: booking.eventName || '',
                bookingId: booking.id || ''
            }));

            console.log("Generating tickets for:", participantsWithMeta);

            // Call service to generate tickets
            const tickets = await eventService.generateTickets(
                booking.id,
                booking.firestoreId,
                participantsWithMeta
            );

            // Redirect to success with tickets
            navigate('/booking-success', {
                state: {
                    booking: booking,
                    tickets: tickets,
                    paymentResult: paymentResult
                }
            });

        } catch (error) {
            console.error("Error creating tickets:", error);
            alert("Failed to generate tickets. Please try again or contact support.");
        } finally {
            setGenerating(false);
        }
    };

    if (!booking) return null;

    return (
        <div className="min-h-screen pb-12" style={{ backgroundColor: '#fcfcfc' }}>
            <div className="max-w-3xl mx-auto px-4 py-10 mt-20">

                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold gradient-text mb-2">Participant Details</h1>
                    <p className="text-gray-600">Please provide details for all {booking.numberOfTickets} ticket holders to generate their unique passes.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    {fields.map((field, index) => (
                        <div key={field.id} className="glass-card p-6 animate-in slide-in-from-bottom-5 fade-in duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                                        {index + 1}
                                    </div>
                                    <h3 className="font-bold text-lg text-gray-800">
                                        Ticket Holder #{index + 1}
                                    </h3>
                                </div>
                                <Ticket className="w-5 h-5 text-gray-400" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-gray-700">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                        <input
                                            {...register(`participants.${index}.name`, { required: true })}
                                            placeholder="Enter full name"
                                            className="glass-input pl-10"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-gray-700">Email Address</label>
                                    <input
                                        {...register(`participants.${index}.email`, { required: true })}
                                        placeholder="email@example.com"
                                        className="glass-input"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2 text-gray-700">Mobile Number</label>
                                    <input
                                        {...register(`participants.${index}.mobile`, { required: true })}
                                        placeholder="+91 9876543210"
                                        className="glass-input"
                                    />
                                </div>
                                {/* Club field removed as requested */}
                            </div>
                        </div>
                    ))}

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={generating}
                            className="btn-primary py-4 px-8 text-lg font-bold shadow-xl shadow-indigo-500/20 flex items-center gap-3 disabled:opacity-70"
                        >
                            {generating ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    Generating Tickets...
                                </>
                            ) : (
                                <>
                                    Generate Tickets <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
