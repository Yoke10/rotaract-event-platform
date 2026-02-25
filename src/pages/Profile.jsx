import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import {
    User, Mail, Phone, LogOut, Ticket, Calendar,
    ChevronRight, Loader2, ArrowLeft
} from 'lucide-react';

export default function Profile() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        if (!currentUser) { navigate('/login'); return; }
        loadProfile();
    }, [currentUser]);

    const loadProfile = async () => {
        try {
            const snap = await getDoc(doc(db, 'users', currentUser.uid));
            if (snap.exists()) setProfile(snap.data());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await logout();
            navigate('/login');
        } finally {
            setLoggingOut(false);
        }
    };

    // Initials from name or email
    const displayName = profile?.name || currentUser?.displayName || '';
    const initials = displayName
        ? displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : (currentUser?.email?.[0] || '?').toUpperCase();

    // Friendly joined date
    const joinedDate = profile?.createdAt
        ? new Date(
            profile.createdAt?.seconds
                ? profile.createdAt.seconds * 1000
                : profile.createdAt
        ).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
        : null;

    // ── Loading ────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#f7f7f9', paddingTop: '80px' }}>
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#680b56' }} />
                    <p className="text-sm text-gray-400">Loading profile…</p>
                </div>
            </div>
        );
    }

    // ── Main ───────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen" style={{ background: '#f7f7f9', paddingTop: '80px' }}>
            <div className="max-w-lg mx-auto px-4 py-8">

                {/* Back link */}
                <button onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-6">
                    <ArrowLeft className="w-4 h-4" />Back
                </button>

                {/* ── Avatar + Name card ──────────────────────────────────────── */}
                <div className="card-elevated rounded-2xl p-6 mb-4">
                    <div className="flex items-center gap-5">
                        {/* Avatar */}
                        {currentUser?.photoURL ? (
                            <img
                                src={currentUser.photoURL}
                                alt={displayName || 'User'}
                                className="w-20 h-20 rounded-2xl object-cover shadow-sm shrink-0"
                            />
                        ) : (
                            <div
                                className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-sm shrink-0"
                                style={{ background: 'linear-gradient(135deg,#400763,#680b56 55%,#ed0775)' }}
                            >
                                {initials}
                            </div>
                        )}

                        {/* Name / Email */}
                        <div className="min-w-0">
                            <h1 className="text-xl font-extrabold text-gray-900 leading-tight truncate">
                                {displayName || 'User'}
                            </h1>
                            <p className="text-sm text-gray-500 truncate mt-0.5">
                                {profile?.email || currentUser?.email}
                            </p>
                            {joinedDate && (
                                <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    Member since {joinedDate}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Account details card ────────────────────────────────────── */}
                <div className="card-elevated rounded-2xl mb-4 overflow-hidden">
                    <div className="px-5 pt-4 pb-2">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Account Details</p>
                    </div>

                    <DetailRow
                        icon={<User className="w-4 h-4" style={{ color: '#680b56' }} />}
                        label="Full Name"
                        value={profile?.name || '—'}
                    />
                    <DetailRow
                        icon={<Mail className="w-4 h-4" style={{ color: '#400763' }} />}
                        label="Email Address"
                        value={profile?.email || currentUser?.email || '—'}
                    />
                    {profile?.mobile && (
                        <DetailRow
                            icon={<Phone className="w-4 h-4" style={{ color: '#ed0775' }} />}
                            label="Mobile"
                            value={profile.mobile}
                        />
                    )}
                </div>

                {/* ── Quick actions card ──────────────────────────────────────── */}
                <div className="card-elevated rounded-2xl mb-6 overflow-hidden">
                    <div className="px-5 pt-4 pb-2">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Quick Actions</p>
                    </div>

                    <Link to="/my-tickets">
                        <ActionRow
                            icon={<Ticket className="w-4 h-4" style={{ color: '#680b56' }} />}
                            label="My Tickets"
                            sublabel="View all your registered event tickets"
                            bg="rgba(104,11,86,0.06)"
                        />
                    </Link>

                    <Link to="/events">
                        <ActionRow
                            icon={<Calendar className="w-4 h-4" style={{ color: '#400763' }} />}
                            label="Browse Events"
                            sublabel="Discover and register for upcoming events"
                            bg="rgba(64,7,99,0.06)"
                        />
                    </Link>
                </div>

                {/* ── Logout button ───────────────────────────────────────────── */}
                <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all border-2 disabled:opacity-50"
                    style={{ borderColor: '#ef4444', color: '#ef4444', background: 'transparent' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                    {loggingOut
                        ? <><Loader2 className="w-4 h-4 animate-spin" />Signing out…</>
                        : <><LogOut className="w-4 h-4" />Sign Out</>}
                </button>
            </div>
        </div>
    );
}

// ── Sub-components ─────────────────────────────────────────────────────────
function DetailRow({ icon, label, value }) {
    return (
        <div className="flex items-center gap-4 px-5 py-4 border-t border-gray-50">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: '#f7f7f9' }}>
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-400 mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
            </div>
        </div>
    );
}

function ActionRow({ icon, label, sublabel, bg }) {
    return (
        <div className="flex items-center gap-4 px-5 py-4 border-t border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: bg }}>
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
        </div>
    );
}
