import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { Calendar, MapPin, Ticket, ArrowRight, Loader2, QrCode } from 'lucide-react';

export default function Home() {
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
            {/* Hero Section */}
            <div className="relative overflow-hidden" style={{
                background: 'linear-gradient(135deg, #400763 0%, #680b56 50%, #ed0775 100%)'
            }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 mt-20 relative">


                    <div className="text-center relative z-10">
                        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6">
                            <span className="block">Discover Outstanding</span>
                            <span className="block mt-2">Rotaract Events</span>
                        </h1>
                        <p className="mt-6 max-w-2xl mx-auto text-xl text-white/90">
                            Book tickets, join the community, and create unforgettable memories.
                        </p>
                        <br></br>
                        <br></br>
                    </div>
                </div>
                {/* Decorative wave */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white" />
                    </svg>
                </div>
            </div>

            {/* Events Section */}
            <div id="events" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12">
                    <h2 className="section-title gradient-text">Upcoming Events</h2>
                    <p className="mt-4 text-xl" style={{ color: '#6b6b6b' }}>
                        Join us for exciting events and make lasting connections
                    </p>
                </div>

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
                                        <span className="text-sm">{event.venue}</span>
                                    </div>
                                    <div className="flex items-center" style={{ color: '#4a4a4a' }}>
                                        <Ticket className="w-4 h-4 mr-2" style={{ color: '#680b56' }} />
                                        <span className="text-sm">{event.totalSeats - (event.ticketsSold || 0)} seats left</span>
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
