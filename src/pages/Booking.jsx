import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { mockPaymentService } from '../services/mockPaymentService';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { Loader2, CheckCircle, XCircle, ArrowLeft, Shield } from 'lucide-react';

export default function Booking() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [paymentResult, setPaymentResult] = useState(null);
    const { register, handleSubmit, watch, formState: { errors } } = useForm();

    useEffect(() => {
        loadEvent();
    }, [id]);

    const loadEvent = async () => {
        try {
            const data = await eventService.getEvent(id);
            if (!data) {
                alert("Event not found");
                navigate('/');
                return;
            }
            setEvent(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    // Watch numberOfTickets to calculate total
    const numberOfTickets = watch("numberOfTickets", 1);
    const totalAmount = event ? numberOfTickets * (event.ticketPrice || 0) : 0;

    const onProceedToPay = async (data) => {
        setProcessing(true);
        setPaymentResult(null);

        try {
            const paymentData = {
                name: data.name,
                email: data.email,
                mobile: data.mobile,
                amount: totalAmount,
                eventId: id,
                eventName: event.name,
                numberOfTickets: parseInt(data.numberOfTickets),
                club: data.club
            };

            // Process mock payment
            const result = await mockPaymentService.processPayment(paymentData);
            setPaymentResult(result);

            if (result.success) {
                // Create booking record
                const booking = {
                    eventId: id,
                    eventName: event.name,
                    userId: currentUser.uid,
                    userEmail: data.email,
                    userName: data.name,
                    mobile: data.mobile,
                    club: data.club,
                    numberOfTickets: parseInt(data.numberOfTickets),
                    totalAmount: totalAmount,
                    transactionId: result.transactionId,
                    orderId: result.orderId,
                    paymentStatus: 'SUCCESS',
                    bookingDate: new Date().toISOString(),
                    status: 'confirmed',
                    createdAt: new Date().toISOString()
                };

                await eventService.createBooking(booking);

                // Redirect to success page after 2 seconds
                setTimeout(() => {
                    navigate('/booking-success', { state: { booking, paymentResult: result } });
                }, 2000);
            }
        } catch (error) {
            console.error("Payment error:", error);
            setPaymentResult({
                success: false,
                message: error.message || 'Payment processing failed'
            });
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#400763' }} />
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-12" style={{ backgroundColor: '#fcfcfc' }}>
            <div className="max-w-3xl mx-auto px-4 py-10 mt-20">
                <Link to={`/event/${id}`} className="inline-flex items-center text-sm font-medium mb-6 hover:opacity-80 transition-opacity" style={{ color: '#400763' }}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Details
                </Link>

                <h1 className="text-3xl font-extrabold gradient-text mb-8">Secure Checkout</h1>

                <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
                    <div className="glass-card p-8">
                        {/* Event Summary Banner */}
                        <div className="bg-gray-50 rounded-xl p-4 mb-8 flex items-center justify-between border border-gray-100">
                            <div className="flex items-center space-x-4">
                                {event.posterURL && (
                                    <img src={event.posterURL} className="w-16 h-16 rounded-lg object-cover" alt="" />
                                )}
                                <div>
                                    <p className="text-sm font-bold" style={{ color: '#1a1a1a' }}>{event.name}</p>
                                    <p className="text-xs" style={{ color: '#6b6b6b' }}>₹{event.ticketPrice} per ticket</p>
                                </div>
                            </div>
                            <Shield className="w-6 h-6 text-green-500 opacity-50" />
                        </div>

                        {/* Payment Result Display */}
                        {paymentResult && (
                            <div className={`mb-8 p-4 rounded-xl border-2 ${paymentResult.success ? 'alert-success' : 'alert-error'}`}>
                                <div className="flex items-center space-x-3">
                                    {paymentResult.success ? (
                                        <CheckCircle className="w-6 h-6" />
                                    ) : (
                                        <XCircle className="w-6 h-6" />
                                    )}
                                    <div>
                                        <p className="font-bold">
                                            {paymentResult.success ? 'Payment Successful!' : 'Payment Failed'}
                                        </p>
                                        <p className="text-sm">{paymentResult.message}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onProceedToPay)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold mb-2" style={{ color: '#1a1a1a' }}>Full Name</label>
                                    <input
                                        placeholder="Enter your name"
                                        defaultValue={currentUser?.displayName || ""}
                                        {...register("name", { required: true })}
                                        className="glass-input"
                                        disabled={processing}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2" style={{ color: '#1a1a1a' }}>Email Address</label>
                                    <input
                                        placeholder="you@example.com"
                                        defaultValue={currentUser?.email || ""}
                                        {...register("email", { required: true })}
                                        className="glass-input"
                                        disabled={processing}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold mb-2" style={{ color: '#1a1a1a' }}>Mobile Number</label>
                                    <input
                                        type="tel"
                                        placeholder="e.g. +91 9876543210"
                                        {...register("mobile", { required: true })}
                                        className="glass-input"
                                        disabled={processing}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-2" style={{ color: '#1a1a1a' }}>Your Club</label>
                                    <select
                                        {...register("club", { required: true })}
                                        className="glass-input"
                                        disabled={processing}
                                    >
                                        <option value="">Select your club</option>
                                        {event.clubs?.map(club => (
                                            <option key={club} value={club}>{club}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="max-w-[200px]">
                                <label className="block text-sm font-bold mb-2" style={{ color: '#1a1a1a' }}>Number of Tickets</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    defaultValue="1"
                                    {...register("numberOfTickets", { required: true, min: 1, max: 10 })}
                                    className="glass-input"
                                    disabled={processing}
                                />
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-bold uppercase tracking-widest" style={{ color: '#6b6b6b' }}>Order Total</p>
                                    <p className="text-3xl font-black" style={{ color: '#400763' }}>₹{totalAmount}</p>
                                </div>
                                <div className="text-right">
                                    <Shield className="w-8 h-8 ml-auto mb-1 text-green-500 opacity-20" />
                                    <p className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: '#999999' }}>Secure Payment</p>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={processing || (paymentResult && paymentResult.success)}
                                className="btn-primary w-full py-5 text-lg font-bold shadow-xl shadow-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                                        Processing...
                                    </>
                                ) : paymentResult && paymentResult.success ? (
                                    <>
                                        <CheckCircle className="w-6 h-6 mr-3" />
                                        Redirecting...
                                    </>
                                ) : (
                                    `Complete Payment • ₹${totalAmount}`
                                )}
                            </button>

                            <div className="flex items-center justify-center space-x-2 text-xs grayscale opacity-50" style={{ color: '#999999' }}>
                                <Shield className="w-3 h-3" />
                                <p>Secure Mock Checkout Experience</p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
