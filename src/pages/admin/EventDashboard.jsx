import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { Users, QrCode, DollarSign, Calendar, ArrowLeft, ClipboardList } from 'lucide-react';

export default function EventDashboard() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalTickets: 0,
        scannedTickets: 0,
        totalRevenue: 0,
        totalBookings: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Event Details
                const eventData = await eventService.getEvent(id);
                setEvent(eventData);

                if (eventData) {
                    // 2. Fetch Bookings for this event
                    const bookings = await eventService.getEventBookings(id);
                    setRegistrations(bookings || []);

                    // 3. Fetch Tickets for this event (for accurate participant counts)
                    const eventTickets = await eventService.getEventTickets(id);
                    setTickets(eventTickets || []);

                    // 4. Calculate stats
                    let scannedCount = 0;
                    let revenue = 0;

                    // Revenue from bookings
                    if (bookings) {
                        bookings.forEach(b => {
                            revenue += Number(b.totalAmount) || 0;
                        });
                    }

                    // Counts from tickets
                    if (eventTickets) {
                        eventTickets.forEach(t => {
                            if (t.scanned) scannedCount++;
                        });
                    }

                    setStats({
                        totalBookings: bookings ? bookings.length : 0,
                        totalTickets: eventTickets ? eventTickets.length : 0,
                        scannedTickets: scannedCount,
                        totalRevenue: revenue
                    });
                }
            } catch (error) {
                console.error("Error fetching event dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid Date';
            return date.toLocaleDateString();
        } catch (e) {
            return 'Error';
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!event) return <div className="min-h-screen flex items-center justify-center">Event not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Link to="/admin/dashboard" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6 font-medium">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                </Link>

                {/* Event Header */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
                        <div className="flex items-center mt-2 text-gray-500 space-x-4 text-sm">
                            <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> {event.date}</span>
                            <span className="flex items-center"><DollarSign className="w-4 h-4 mr-1" /> ₹{event.ticketPrice}</span>
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">Code: {event.accessCode}</span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate(`/admin/event/${id}/checkin`)}
                            className="btn-primary py-2 px-4 flex items-center gap-2 font-bold shadow-indigo-200"
                        >
                            <ClipboardList className="w-4 h-4" />
                            Check-in Desk
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Tickets Sold</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalTickets}</p>
                                <p className="text-xs text-gray-400 mt-1">From {stats.totalBookings} orders</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg group-hover:scale-110 transition-transform">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Checked In</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.scannedTickets}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {stats.totalTickets > 0
                                        ? `${Math.round((stats.scannedTickets / stats.totalTickets) * 100)}% attendance`
                                        : '0% attendance'}
                                </p>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg group-hover:scale-110 transition-transform">
                                <QrCode className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">₹{stats.totalRevenue}</p>
                                <p className="text-xs text-gray-400 mt-1">Gross sales</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg group-hover:scale-110 transition-transform">
                                <DollarSign className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Registrations List (Bookings) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
                        <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded text-gray-600">
                            Showing last {registrations ? Math.min(registrations.length, 10) : 0}
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Order ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Booked By</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Club</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tickets</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {registrations && registrations.slice(0, 10).map((reg) => (
                                    <tr key={reg.id || Math.random()} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-500">
                                            {reg.orderId || (reg.id ? reg.id.substring(0, 8) : 'N/A')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-900">{reg.userName || 'Unknown'}</div>
                                            <div className="text-xs text-gray-500">{reg.userEmail}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {reg.club || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {reg.numberOfTickets || 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                                            ₹{reg.totalAmount}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${reg.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                reg.status === 'pending_details' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                {reg.status === 'pending_details' ? 'Pending Details' : 'Confirmed'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                            {formatDate(reg.createdAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {(!registrations || registrations.length === 0) && (
                            <div className="text-center py-12">
                                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">No registrations yet.</p>
                                <p className="text-sm text-gray-400">Share your event to get started!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
