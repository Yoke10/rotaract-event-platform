import React from 'react';
import { Link } from 'react-router-dom';
import {
    Shield, Heart, Calendar, Ticket, LogIn, UserPlus,
    Instagram, Twitter, Linkedin, Globe, Mail, ArrowUpRight, Scan
} from 'lucide-react';

// ─── Data ──────────────────────────────────────────────────────────────────
const NAV_LINKS = [
    { label: 'Home', to: '/', icon: Globe },
    { label: 'All Events', to: '/events', icon: Calendar },
    { label: 'My Tickets', to: '/my-tickets', icon: Ticket },
];

const ACCOUNT_LINKS = [
    { label: 'Sign Up', to: '/signup', icon: UserPlus },
    { label: 'Login', to: '/login', icon: LogIn },
];

const ADMIN_LINKS = [
    { label: 'Admin Login', to: '/admin-login', icon: Shield, newTab: true },
    { label: 'Scanner Portal', to: '/scanner', icon: Scan },
];

const SOCIAL = [
    { label: 'Instagram', href: '#', icon: Instagram },
    { label: 'Twitter', href: '#', icon: Twitter },
    { label: 'LinkedIn', href: '#', icon: Linkedin },
    { label: 'Email', href: 'mailto:rotaract@example.com', icon: Mail },
];

// ─── Sub-components ────────────────────────────────────────────────────────
function FooterLinkGroup({ title, links }) {
    return (
        <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#400763' }}>
                {title}
            </h4>
            <ul className="space-y-2.5">
                {links.map(({ label, to, icon: Icon, newTab }) => (
                    <li key={label}>
                        {newTab ? (
                            <a
                                href={to}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors duration-200"
                            >
                                <Icon className="w-3.5 h-3.5 shrink-0 text-gray-300 group-hover:text-pink-500 transition-colors" />
                                {label}
                            </a>
                        ) : (
                            <Link
                                to={to}
                                className="group inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors duration-200"
                            >
                                <Icon className="w-3.5 h-3.5 shrink-0 text-gray-300 group-hover:text-pink-500 transition-colors" />
                                {label}
                            </Link>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

// ─── Footer ────────────────────────────────────────────────────────────────
export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="mt-auto" style={{ background: '#fff', borderTop: '1px solid #f0f0f0' }}>

            {/* ── Top gradient accent strip ─────────────────────────────────── */}
            <div className="h-px w-full" style={{ background: 'linear-gradient(90deg,#400763,#680b56 40%,#ed0775)' }} />

            {/* ── Main footer body ──────────────────────────────────────────── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">

                    {/* Brand column — spans 2 cols on lg */}
                    <div className="lg:col-span-2">
                        {/* Logo */}
                        <Link to="/" className="inline-flex items-center gap-3 mb-5 group">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md shrink-0 transition-transform group-hover:scale-105"
                                style={{ background: 'linear-gradient(135deg,#400763,#680b56 50%,#ed0775)' }}
                            >
                                <span className="text-white font-extrabold text-lg leading-none">R</span>
                            </div>
                            <div className="flex flex-col leading-tight">
                                <span className="text-base font-extrabold text-gray-900">Rotaract</span>
                                <span className="text-xs font-semibold text-gray-400 tracking-wide">Event Platform</span>
                            </div>
                        </Link>

                        <p className="text-sm text-gray-500 leading-relaxed max-w-xs mb-6">
                            Connecting communities through unforgettable experiences. Join us in making a difference,
                            one event at a time.
                        </p>

                        {/* Social icons */}
                        <div className="flex items-center gap-2">
                            {SOCIAL.map(({ label, href, icon: Icon }) => (
                                <a
                                    key={label}
                                    href={href}
                                    aria-label={label}
                                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5"
                                    style={{ background: '#f7f7f9', border: '1px solid #ebebeb' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(64,7,99,0.08)'; e.currentTarget.style.borderColor = '#400763'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = '#f7f7f9'; e.currentTarget.style.borderColor = '#ebebeb'; }}
                                >
                                    <Icon className="w-4 h-4 text-gray-500" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Link columns */}
                    <FooterLinkGroup title="Explore" links={NAV_LINKS} />
                    <FooterLinkGroup title="Account" links={ACCOUNT_LINKS} />
                    <FooterLinkGroup title="Admin" links={ADMIN_LINKS} />
                </div>

                {/* ── Divider ───────────────────────────────────────────────────── */}
                <div className="mt-10 mb-6 h-px" style={{ background: '#f0f0f0' }} />

                {/* ── Bottom bar ────────────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-gray-400 text-center sm:text-left">
                        © {year} Rotaract Event Platform. All rights reserved.
                    </p>

                    <p className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                        Made with
                        <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
                        by the
                        <span className="font-semibold" style={{ color: '#680b56' }}>Rotaract Tech Team</span>
                    </p>

                    <a
                        href="https://rotaract.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold transition-colors duration-200 hover:text-gray-700"
                        style={{ color: '#680b56' }}
                    >
                        rotaract.org <ArrowUpRight className="w-3 h-3" />
                    </a>
                </div>
            </div>
        </footer>
    );
}
