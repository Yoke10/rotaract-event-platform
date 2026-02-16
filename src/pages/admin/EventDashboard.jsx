import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { db } from '../../services/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Users, QrCode, DollarSign, Calendar, ArrowLeft } from 'lucide-react';
import Navbar from '../../components/Navbar';

export default function EventDashboard() {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        scanned: 0,
        revenue: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Event Details
                // Assuming eventService has getEventById, if not we use firestore direct or add it
                // Checking previous code, eventService is imported. Let's assume getEvent exists or we use getAll and find.
                // Better: Fetch specific doc.
                const allEvents = await eventService.getAllEvents();
                const foundEvent = allEvents.find(e => e.id === id);
                setEvent(foundEvent);

                if (foundEvent) {
                    // 2. Fetch Registrations (Subcollection or root collection with eventId?)
                    // Usually separate collection 'registrations' or 'tickets'
                    // I will assume a 'registrations' collection exists or needs to be queried
                    const q = query(collection(db, "registrations"), where("eventId", "==", id));
                    const querySnapshot = await getDocs(q);
                    const regs = [];
                    let scannedCount = 0;
                    querySnapshot.forEach((doc) => {
                        const data = doc.data();
                        regs.push({ id: doc.id, ...data });
                        if (data.status === 'scanned') scannedCount++; // or check specific scan flags
                    });
                    setRegistrations(regs);

                    setStats({
                        total: regs.length,
                        scanned: scannedCount,
                        revenue: regs.length * (foundEvent.ticketPrice || 0)
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

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!event) return <div className="min-h-screen flex items-center justify-center">Event not found</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* We might already have Navbar in Layout, but this page might need full width or specific layout. 
                The Layout component in App.jsx wraps everything, so we don't need Navbar here. 
            */}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Link to="/admin/dashboard" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                </Link>

                {/* Event Header */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
                            <div className="flex items-center mt-2 text-gray-500 space-x-4">
                                <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> {event.date}</span>
                                <span className="flex items-center"><DollarSign className="w-4 h-4 mr-1" /> ₹{event.ticketPrice}</span>
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">{event.accessCode}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Event ID</p>
                            <p className="font-mono text-xs text-gray-400">{id}</p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Registrations</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Checked In</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.scanned}</p>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg">
                                <QrCode className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">₹{stats.revenue}</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg">
                                <DollarSign className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Attendees List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-900">Recent Registrations</h2>
                        <button className="text-sm text-indigo-600 hover:text-indigo-800">Export List</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {registrations.map((reg) => (
                                    <tr key={reg.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{reg.userName || 'Unknown'}</div>
                                            <div className="text-sm text-gray-500">{reg.mobile || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {reg.userEmail}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${reg.status === 'scanned' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {reg.status || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {reg.createdAt?.seconds ? new Date(reg.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {registrations.length === 0 && (
                            <div className="text-center py-10 text-gray-500">
                                No registrations yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
