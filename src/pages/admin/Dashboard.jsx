import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { Calendar, Users, Edit, Trash2, Key } from 'lucide-react';

export default function AdminDashboard() {
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
            console.error("Failed to load events", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this event?")) {
            await eventService.deleteEvent(id);
            loadEvents();
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 mt-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
                    <p className="text-gray-600 mt-1">Manage events, track sales, and monitor revenue.</p>
                </div>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                    <div key={event.id} className="glass-card hover:translate-y-[-4px] transition-transform duration-300">
                        {/* Event Image Cover (Placeholder or actual) */}
                        <div className="relative h-40 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-t-xl overflow-hidden">
                            {event.posterURL && (
                                <img src={event.posterURL} alt={event.name} className="w-full h-full object-cover opacity-40" />
                            )}
                            <div className="absolute top-3 left-3 right-3">
                                <h3 className="text-xl font-bold text-white mb-1">{event.name}</h3>
                            </div>
                            <div className="absolute top-3 right-3 flex gap-2">
                                <Link to={`/admin/edit-event/${event.id}`} className="p-2 bg-white rounded-full text-indigo-600 hover:bg-gray-100">
                                    <Edit className="w-5 h-5" />
                                </Link>
                                <button onClick={() => handleDelete(event.id)} className="p-2 bg-white rounded-full text-red-600 hover:bg-gray-100">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <Link to={`/admin/event/${event.id}`} className="block p-5">
                            <div className="space-y-2 text-sm text-gray-400">
                                <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-2 text-indigo-400" />
                                    {new Date(event.date).toLocaleDateString()}
                                </div>
                                <div className="flex items-center">
                                    <Users className="w-4 h-4 mr-2 text-green-400" />
                                    {event.ticketsSold || 0} Registered
                                </div>
                                {event.hostUsername && (
                                    <div className="flex items-center pt-2 border-t border-gray-100">
                                        <Key className="w-4 h-4 mr-2 text-orange-400" />
                                        <span className="font-mono text-xs">{event.hostUsername} / {event.hostPassword}</span>
                                    </div>
                                )}
                            </div>
                        </Link>
                    </div>
                ))}
            </div>

            {events.length === 0 && !loading && (
                <div className="text-center py-10 text-gray-500 glass-card">
                    <p className="text-xl">No events found.</p>
                    <Link to="/admin/create-event" className="text-indigo-400 hover:text-indigo-300 mt-2 inline-block">
                        Create your first event &rarr;
                    </Link>
                </div>
            )}
        </div>
    );
}
