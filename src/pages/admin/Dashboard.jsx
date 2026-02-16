import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { exportService } from '../../services/exportService';
import { PlusCircle, Calendar, Users, DollarSign, Edit, Trash2, Download, QrCode } from 'lucide-react';

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
                    <h1 className="text-4xl font-bold text-white tracking-tight">Admin Dashboard</h1>
                    <p className="text-gray-400 mt-1">Manage events, track sales, and monitor revenue.</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => exportService.exportToExcel()}
                        className="btn-secondary flex items-center"
                    >
                        <Download className="mr-2 h-5 w-5" /> Export Data
                    </button>
                    <Link
                        to="/admin/scanner"
                        className="btn-secondary flex items-center border-purple-500 text-purple-600 hover:bg-purple-50"
                        style={{ borderColor: '#400763', color: '#400763' }}
                    >
                        <QrCode className="mr-2 h-5 w-5" /> Scan Tickets
                    </Link>
                    <Link
                        to="/admin/create-event"
                        className="btn-primary flex items-center"
                    >
                        <PlusCircle className="mr-2 h-5 w-5" /> Create Event
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-10">
                <div className="glass-card p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Calendar className="h-24 w-24 text-indigo-500" />
                    </div>
                    <div className="flex items-center">
                        <div className="flex-shrink-0 bg-indigo-500/20 p-3 rounded-lg">
                            <Calendar className="h-8 w-8 text-indigo-400" />
                        </div>
                        <div className="ml-5">
                            <p className="text-sm font-medium text-gray-400">Total Events</p>
                            <p className="text-3xl font-bold text-white">{events.length}</p>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users className="h-24 w-24 text-green-500" />
                    </div>
                    <div className="flex items-center">
                        <div className="flex-shrink-0 bg-green-500/20 p-3 rounded-lg">
                            <Users className="h-8 w-8 text-green-400" />
                        </div>
                        <div className="ml-5">
                            <p className="text-sm font-medium text-gray-400">Tickets Sold</p>
                            <p className="text-3xl font-bold text-white">
                                {events.reduce((acc, curr) => acc + (curr.ticketsSold || 0), 0)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DollarSign className="h-24 w-24 text-yellow-500" />
                    </div>
                    <div className="flex items-center">
                        <div className="flex-shrink-0 bg-yellow-500/20 p-3 rounded-lg">
                            <DollarSign className="h-8 w-8 text-yellow-400" />
                        </div>
                        <div className="ml-5">
                            <p className="text-sm font-medium text-gray-400">Total Revenue</p>
                            <p className="text-3xl font-bold text-white">
                                ₹{events.reduce((acc, curr) => acc + ((curr.ticketsSold || 0) * (curr.ticketPrice || 0)), 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                    <div key={event.id} className="glass-card hover:translate-y-[-4px] transition-transform duration-300">
                        {/* Event Image Cover (Placeholder or actual) */}
                        <div className="h-40 bg-gray-800 rounded-t-xl relative overflow-hidden group">
                            {event.imageUrl ? (
                                <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
                                    <Calendar className="text-white/20 w-16 h-16" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                                <Link to={`/admin/event/${event.id}`} className="p-2 bg-white rounded-full text-indigo-600 hover:bg-gray-100">
                                    <Users className="w-5 h-5" />
                                </Link>
                                <Link to={`/admin/edit-event/${event.id}`} className="p-2 bg-white rounded-full text-indigo-600 hover:bg-gray-100">
                                    <Edit className="w-5 h-5" />
                                </Link>
                                <button onClick={() => handleDelete(event.id)} className="p-2 bg-white rounded-full text-red-600 hover:bg-gray-100">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <Link to={`/admin/event/${event.id}`} className="block p-5">
                            <h3 className="text-xl font-bold text-white mb-2">{event.name}</h3>
                            <div className="space-y-2 text-sm text-gray-400">
                                <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-2 text-indigo-400" />
                                    {new Date(event.date).toLocaleDateString()}
                                </div>
                                <div className="flex items-center">
                                    <Users className="w-4 h-4 mr-2 text-green-400" />
                                    {event.ticketsSold || 0} Registered
                                </div>
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
