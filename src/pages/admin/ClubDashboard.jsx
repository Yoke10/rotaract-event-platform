import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventService } from '../../services/eventService';
import { ArrowLeft, Users, DollarSign, Ticket, Search, ChevronDown, ChevronUp } from 'lucide-react';

export default function ClubDashboard() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [expandedClub, setExpandedClub] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [eventData, bookings] = await Promise.all([
                    eventService.getEvent(id),
                    eventService.getEventBookings(id),
                ]);
                setEvent(eventData);
                setRegistrations(bookings || []);
            } catch (e) {
                console.error('ClubDashboard fetch error:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    // ── Build club map ─────────────────────────────────────────────
    const clubMap = {};
    registrations.forEach(reg => {
        const club = reg.club || 'Unknown';
        if (!clubMap[club]) clubMap[club] = { orders: [], tickets: 0, revenue: 0 };
        clubMap[club].orders.push(reg);
        clubMap[club].tickets += Number(reg.numberOfTickets) || 1;
        clubMap[club].revenue += Number(reg.totalAmount) || 0;
    });

    const allClubs = Object.entries(clubMap)
        .sort((a, b) => b[1].tickets - a[1].tickets);

    const filtered = allClubs.filter(([name]) =>
        name.toLowerCase().includes(search.toLowerCase())
    );

    const totalTickets = allClubs.reduce((s, [, d]) => s + d.tickets, 0);
    const totalRevenue = allClubs.reduce((s, [, d]) => s + d.revenue, 0);
    const maxTickets = allClubs[0]?.[1].tickets || 1;

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-7 h-7 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-16">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Back */}
                <Link to={`/admin/event/${id}`}
                    className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-6 font-medium text-sm">
                    <ArrowLeft className="w-4 h-4" /> Back to Event Dashboard
                </Link>

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Club-wise Registrations</h1>
                    {event && <p className="text-gray-500 mt-1 text-sm">{event.name}</p>}
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                        { label: 'Total Clubs', value: allClubs.length, icon: <Users className="w-5 h-5 text-indigo-500" />, bg: 'bg-indigo-50' },
                        { label: 'Total Tickets', value: totalTickets, icon: <Ticket className="w-5 h-5 text-purple-500" />, bg: 'bg-purple-50' },
                        { label: 'Total Revenue', value: `₹${totalRevenue}`, icon: <DollarSign className="w-5 h-5 text-green-500" />, bg: 'bg-green-50' },
                    ].map(s => (
                        <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                            <div className={`p-2.5 rounded-lg ${s.bg}`}>{s.icon}</div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                                <p className="text-xs text-gray-500">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search club…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white"
                    />
                </div>

                {/* Club list */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Table header */}
                    <div className="grid grid-cols-[1fr_80px_80px_90px_36px] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <span>Club</span>
                        <span className="text-center">Orders</span>
                        <span className="text-center">Tickets</span>
                        <span className="text-right">Revenue</span>
                        <span />
                    </div>

                    {filtered.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No clubs found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {filtered.map(([club, data]) => {
                                const isExpanded = expandedClub === club;
                                return (
                                    <div key={club}>
                                        {/* Club row */}
                                        <div
                                            className="grid grid-cols-[1fr_80px_80px_90px_36px] gap-4 px-6 py-4 items-center hover:bg-gray-50/70 transition-colors cursor-pointer"
                                            onClick={() => setExpandedClub(isExpanded ? null : club)}
                                        >
                                            {/* Name + bar */}
                                            <div className="min-w-0">
                                                <p className="font-semibold text-sm text-gray-900 truncate mb-1.5">{club}</p>
                                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full" style={{
                                                        width: `${(data.tickets / maxTickets) * 100}%`,
                                                        background: 'linear-gradient(90deg,#6366f1,#a855f7)'
                                                    }} />
                                                </div>
                                            </div>
                                            <p className="text-center text-sm text-gray-600">{data.orders.length}</p>
                                            <p className="text-center text-sm font-bold text-gray-900">{data.tickets}</p>
                                            <p className="text-right text-sm font-bold text-indigo-600">₹{data.revenue}</p>
                                            <div className="flex justify-center text-gray-400">
                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </div>
                                        </div>

                                        {/* Expanded: booking list for this club */}
                                        {isExpanded && (
                                            <div className="px-6 pb-4 bg-indigo-50/30">
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pt-2">Bookings from {club}</p>
                                                <div className="space-y-2">
                                                    {data.orders.map(reg => (
                                                        <div key={reg.firestoreId || reg.id}
                                                            className="flex items-center justify-between bg-white rounded-lg px-4 py-3 text-sm border border-gray-100">
                                                            <div>
                                                                <p className="font-semibold text-gray-900">{reg.userName || 'Unknown'}</p>
                                                                <p className="text-xs text-gray-400">{reg.userEmail} · {reg.orderId}</p>
                                                            </div>
                                                            <div className="flex items-center gap-4 text-right">
                                                                <div>
                                                                    <p className="font-bold text-gray-900">{reg.numberOfTickets} tkts</p>
                                                                    <p className="text-xs text-indigo-600">₹{reg.totalAmount}</p>
                                                                </div>
                                                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${reg.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                                    }`}>
                                                                    {reg.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
