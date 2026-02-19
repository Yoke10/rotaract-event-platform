import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { Calendar, MapPin, Ticket, ArrowRight, Loader2 } from 'lucide-react';

export default function Events() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            const data = await eventService.getAllEvents();
            setEvents(data);
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

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#ffffff' }}>
            {/* Header */}
            <div className="relative overflow-hidden bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 mt-10">
                    <div className="text-center relative z-10">
                        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 gradient-text">
                            All Events
                        </h1>
                        <p className="text-xl max-w-2xl mx-auto" style={{ color: '#4a4a4a' }}>
                            Discover and book tickets for upcoming Rotaract events.
                            Experience excellence in every moment.
                        </p>
                    </div>
                </div>
            </div>

            {/* Events Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {events.length === 0 ? (
                    <div className="text-center py-16">
                        <Calendar className="w-16 h-16 mx-auto mb-4" style={{ color: '#999999' }} />
                        <h3 className="text-xl font-semibold mb-2" style={{ color: '#4a4a4a' }}>No Events Available</h3>
                        <p style={{ color: '#6b6b6b' }}>Check back soon for upcoming events!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {events.map((event) => (
                            <div key={event.id} className="glass-card group">
                                {/* Event Image */}
                                {event.posterURL && (
                                    <div className="relative h-48 mb-4 rounded-lg overflow-hidden">
                                        <img
                                            src={event.posterURL}
                                            alt={event.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        <div className="absolute top-3 right-3">
                                            <span className="badge-primary">
                                                ₹{event.ticketPrice}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Event Details */}
                                <h3 className="text-2xl font-bold mb-3 gradient-text">
                                    {event.name}
                                </h3>

                                <p className="mb-4 line-clamp-2" style={{ color: '#6b6b6b' }}>
                                    {event.description}
                                </p>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center" style={{ color: '#4a4a4a' }}>
                                        <Calendar className="w-4 h-4 mr-2" style={{ color: '#400763' }} />
                                        <span className="text-sm">
                                            {new Date(event.date).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                    <div className="flex items-center" style={{ color: '#4a4a4a' }}>
                                        <MapPin className="w-4 h-4 mr-2" style={{ color: '#ed0775' }} />
                                        <span className="text-sm">{event.venue || event.location}</span>
                                    </div>
                                    <div className="flex items-center" style={{ color: '#4a4a4a' }}>
                                        <Ticket className="w-4 h-4 mr-2" style={{ color: '#680b56' }} />
                                        <span className="text-sm">{(() => { const seats = event.totalSeats ?? event.totalTickets; if (!seats) return 'Unlimited'; return (seats - (event.ticketsSold || 0)) + ' seats left'; })()}</span>
                                    </div>
                                </div>

                                <Link
                                    to={`/event/${event.id}`}
                                    className="btn-primary w-full flex items-center justify-center"
                                >
                                    View Details
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}


