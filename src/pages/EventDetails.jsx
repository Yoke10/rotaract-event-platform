import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { Calendar, MapPin, Clock, Ticket, Loader2, ArrowLeft } from 'lucide-react';

export default function EventDetails() {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEvent();
    }, [id]);

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

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#400763' }} />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-20 mt-20 text-center text-gray-500">
                Event not found
            </div>
        );
    }

    const isSoldOut = event.totalTickets && (event.ticketsSold || 0) >= event.totalTickets;
    const isClosed = event.status !== 'active' || (event.registrationCloseDate && new Date(event.registrationCloseDate) < new Date());

    return (
        <div className="min-h-screen pb-12" style={{ backgroundColor: '#ffffff' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 mt-20">
                <Link to="/events" className="inline-flex items-center text-sm font-medium mb-6 hover:opacity-80 transition-opacity" style={{ color: '#400763' }}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Events
                </Link>

                <div className="glass-card overflow-hidden">
                    <div className="md:flex">
                        <div className="md:flex-shrink-0 md:w-1/2">
                            <img
                                className="h-full w-full object-cover min-h-[400px]"
                                src={event.posterURL || "https://via.placeholder.com/600x800?text=No+Poster"}
                                alt={event.name}
                            />
                        </div>
                        <div className="p-8 md:p-12 w-full md:w-1/2 flex flex-col justify-between">
                            <div>
                                <h1 className="text-4xl font-extrabold gradient-text mb-6">
                                    {event.name}
                                </h1>
                                <p className="text-lg leading-relaxed mb-8" style={{ color: '#4a4a4a' }}>
                                    {event.description}
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4" style={{ backgroundColor: 'rgba(64, 7, 99, 0.1)' }}>
                                                <Calendar className="w-5 h-5" style={{ color: '#400763' }} />
                                            </div>
                                            <div>
                                                <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: '#6b6b6b' }}>Date</p>
                                                <p className="font-bold" style={{ color: '#1a1a1a' }}>{new Date(event.date).toLocaleDateString(undefined, {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4" style={{ backgroundColor: 'rgba(237, 7, 117, 0.1)' }}>
                                                <Clock className="w-5 h-5" style={{ color: '#ed0775' }} />
                                            </div>
                                            <div>
                                                <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: '#6b6b6b' }}>Time</p>
                                                <p className="font-bold" style={{ color: '#1a1a1a' }}>{event.time}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4" style={{ backgroundColor: 'rgba(104, 11, 86, 0.1)' }}>
                                                <MapPin className="w-5 h-5" style={{ color: '#680b56' }} />
                                            </div>
                                            <div>
                                                <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: '#6b6b6b' }}>Location</p>
                                                <p className="font-bold" style={{ color: '#1a1a1a' }}>{event.venue || event.location}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4" style={{ backgroundColor: 'rgba(255, 26, 140, 0.1)' }}>
                                                <Ticket className="w-5 h-5" style={{ color: '#ff1a8c' }} />
                                            </div>
                                            <div>
                                                <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: '#6b6b6b' }}>Price</p>
                                                <p className="text-2xl font-black" style={{ color: '#400763' }}>
                                                    {event.ticketPrice > 0 ? `₹${event.ticketPrice}` : 'Free'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-xl mb-8 border border-gray-100">
                                    <p className="text-xs font-semibold" style={{ color: '#6b6b6b' }}>Registration Closes</p>
                                    <p className="font-bold" style={{ color: '#1a1a1a' }}>
                                        {new Date(event.registrationCloseDate || event.date).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-auto">
                                {isClosed ? (
                                    <button disabled className="w-full bg-gray-200 text-gray-500 font-bold py-4 px-6 rounded-xl cursor-not-allowed">
                                        Registration Closed
                                    </button>
                                ) : isSoldOut ? (
                                    <button disabled className="w-full bg-red-100 text-red-500 font-bold py-4 px-6 rounded-xl cursor-not-allowed">
                                        Sold Out
                                    </button>
                                ) : (
                                    <Link
                                        to={`/booking/${event.id}`}
                                        className="btn-primary w-full block text-center py-4 text-lg"
                                    >
                                        Book Tickets
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
