import React, { useEffect, useState } from 'react';
import { eventService } from '../services/eventService';
import { Calendar, Loader2, Search } from 'lucide-react';
import EventCard from '../components/EventCard';

export default function Events() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');

    useEffect(() => { loadEvents(); }, []);

    const loadEvents = async () => {
        try {
            const data = await eventService.getAllEvents();
            setEvents(data.filter(e => e.status === 'active'));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filtered = events.filter(e =>
        !query ||
        e.name?.toLowerCase().includes(query.toLowerCase()) ||
        (e.venue || e.location || '').toLowerCase().includes(query.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#680b56' }} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">

            <div className="pt-20 mt-5 pb-6 px-4 sm:px-6 border-b border-gray-100">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Title */}
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ color: '#1a1a1a' }}>
                            All Events
                        </h1>
                        <p className="text-sm mt-0.5" style={{ color: '#6b6b6b' }}>
                            {filtered.length} upcoming event{filtered.length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    {/* Search bar */}
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#999' }} />
                        <input
                            type="search"
                            placeholder="Search events or venues…"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            className="glass-input pl-10 pr-4 py-2.5 text-sm rounded-full w-full"
                            aria-label="Search events"
                        />
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                {filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" style={{ color: '#400763' }} />
                        <p className="font-semibold" style={{ color: '#4a4a4a' }}>No events found</p>
                        <p className="text-sm mt-1" style={{ color: '#6b6b6b' }}>
                            {query ? 'Try a different search term.' : 'Check back soon!'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                        {filtered.map(event => (
                            <EventCard key={event.id} event={event} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
