import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../services/eventService';
import { Loader2, ArrowRight, Sparkles } from 'lucide-react';
import EventCard from '../components/EventCard';

export default function Home() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadEvents(); }, []);

    const loadEvents = async () => {
        try {
            const data = await eventService.getAllEvents();
            // show only active events; limit to 6 on homepage
            setEvents(data.filter(e => e.status === 'active').slice(0, 6));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#680b56' }} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">

            {/* ── Hero ── */}
            <section
                className="relative overflow-hidden"
                style={{
                    background: 'linear-gradient(150deg, #2d0447 0%, #400763 30%, #680b56 65%, #ed0775 100%)',
                    minHeight: '360px',
                }}
            >
                {/* decorative circles */}
                <div className="absolute top-[-60px] right-[-60px] w-[280px] h-[280px] rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }} />
                <div className="absolute bottom-[-40px] left-[-40px] w-[200px] h-[200px] rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }} />

                <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-20 mt-16 text-center">
                    <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
                        Discover &amp; Register<br className="hidden sm:block" /> for Events Near You
                    </h1>
                    <p className="text-white/75 text-base sm:text-lg max-w-xl mx-auto mb-8">
                        Book tickets, meet your community, and create unforgettable memories.
                    </p>
                </div>

                {/* wave */}
                <div className="absolute bottom-0 left-0 right-0" aria-hidden>
                    <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                        <path d="M0 60L1440 60L1440 20C1200 60 960 5 720 20C480 35 240 60 0 20Z" fill="white" />
                    </svg>
                </div>
            </section>

            {/* ── Events Grid ── */}
            <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
                <div className="flex items-center justify-between mb-7">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold" style={{ color: '#1a1a1a' }}>
                            Upcoming Events
                        </h2>
                        <p className="text-sm mt-0.5" style={{ color: '#6b6b6b' }}>
                            Find something exciting to attend
                        </p>
                    </div>
                    <Link to="/events" className="btn-secondary text-sm px-4 py-2 hidden sm:inline-flex">
                        View All
                    </Link>
                </div>

                {events.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-4xl mb-3">🎪</p>
                        <p className="font-semibold" style={{ color: '#4a4a4a' }}>No events right now</p>
                        <p className="text-sm mt-1" style={{ color: '#6b6b6b' }}>Check back soon for upcoming events!</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile: 2-col grid; Tablet+: 3-col */}
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                            {events.map(event => (
                                <EventCard key={event.id} event={event} />
                            ))}
                        </div>
                        <div className="mt-8 text-center sm:hidden">
                            <Link to="/events" className="btn-secondary text-sm px-6 py-2.5">
                                View All Events
                            </Link>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}
