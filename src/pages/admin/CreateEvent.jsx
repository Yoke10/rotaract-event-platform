import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { eventService } from '../../services/eventService';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Check, ChevronRight, ChevronLeft, DollarSign, List, Shield,
    Info, Plus, Trash2, Layers, Tag, GitBranch, Settings, Image,
    Users, Globe, PenLine
} from 'lucide-react';
import { clubService } from '../../services/clubService';

const STEPS = [
    { id: 1, name: 'Basics', icon: PenLine },
    { id: 2, name: 'Tickets', icon: DollarSign },
    { id: 3, name: 'Features', icon: List },
    { id: 4, name: 'Policies', icon: Shield },
    { id: 5, name: 'Advanced', icon: Settings },
];

const EVENT_TYPES = [
    { value: 'rotaract', label: 'Rotaract Event', desc: 'Club-based, with member tracking' },
    { value: 'marathon', label: 'Marathon / Run', desc: 'Race-style events, distance categories' },
    { value: 'symposium', label: 'Symposium / Multi-Track', desc: 'Multiple sessions or sub-events' },
    { value: 'general', label: 'Simple / General', desc: 'Any other event format' },
];

const COMFORTS_LIST = [
    'Wi-Fi Access', 'Air Conditioning', 'Parking Available',
    'Food & Beverages', 'Restrooms', 'Wheelchair Accessible',
    'First Aid Kit', 'Security Personnel', 'Photography / Videography',
];

// ── Reusable Toggle Switch ────────────────────────────────────────────────
function ToggleSwitch({ enabled, onToggle, label, description }) {
    return (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 mb-4">
            <div>
                <p className="font-semibold text-gray-800 text-sm">{label}</p>
                {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
            </div>
            <button type="button" onClick={onToggle}
                className={`relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 ${enabled ? 'bg-indigo-600' : 'bg-gray-300'}`}
                aria-checked={enabled} role="switch">
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
        </div>
    );
}

function ModuleSection({ enabled, children }) {
    if (!enabled) return null;
    return (
        <div className="space-y-4 mt-2 pl-3 border-l-2 border-indigo-200 animate-fadeIn">
            {children}
        </div>
    );
}

export default function CreateEvent() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [accessCodeError, setAccessCodeError] = useState('');
    const [clubs, setClubs] = useState([]);
    const [newClubName, setNewClubName] = useState('');
    const [showAddClub, setShowAddClub] = useState(false);

    // ── Event type & status ────────────────────────────────────────────────
    const [eventType, setEventType] = useState('rotaract');
    const [status, setStatus] = useState('active'); // 'active' | 'draft'

    // ── Module toggles ─────────────────────────────────────────────────────
    const [enableTicketModule, setEnableTicketModule] = useState(true);
    const [enableTicketTiers, setEnableTicketTiers] = useState(false);
    const [enablePricingCategories, setEnablePricingCategories] = useState(false);
    const [enableCategories, setEnableCategories] = useState(true);
    const [enableSubEvents, setEnableSubEvents] = useState(false);
    const [enableCustomFields, setEnableCustomFields] = useState(false);

    // ── Image file state ──────────────────────────────────────────
    const [posterFile, setPosterFile] = useState(null);
    const [posterPreview, setPosterPreview] = useState('');
    const [bannerFile, setBannerFile] = useState(null);
    const [bannerPreview, setBannerPreview] = useState('');
    const [uploadProgress, setUploadProgress] = useState('');

    const handleImageChange = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;
        const allowed = ['image/webp', 'image/jpeg', 'image/png'];
        if (!allowed.includes(file.type)) {
            alert('Only WebP, JPG or PNG files are accepted.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            alert('File size must be under 10 MB.');
            return;
        }
        const url = URL.createObjectURL(file);
        if (type === 'poster') { setPosterFile(file); setPosterPreview(url); }
        else { setBannerFile(file); setBannerPreview(url); }
    };

    // Compress and convert image file to Base64 using Canvas API
    const compressToBase64 = (file, maxW, maxH, quality = 0.75) => {
        return new Promise((resolve, reject) => {
            const img = new window.Image();
            const objectUrl = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(objectUrl);
                let { width, height } = img;
                // Scale down to fit within maxW x maxH while keeping aspect ratio
                if (width > maxW || height > maxH) {
                    const ratio = Math.min(maxW / width, maxH / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/webp', quality));
            };
            img.onerror = reject;
            img.src = objectUrl;
        });
    };

    // ── Comforts ───────────────────────────────────────────────────────────
    const [customComforts, setCustomComforts] = useState([]);
    const [newComfort, setNewComfort] = useState('');

    // ── Ticket Tiers ───────────────────────────────────────────────────────
    const [ticketTiers, setTicketTiers] = useState([
        { tierName: '', price: '', maxQuantity: '', description: '' }
    ]);

    // ── Pricing Categories ────────────────────────────────────────────────
    const [pricingCategories, setPricingCategories] = useState([
        { categoryName: '', price: '' }
    ]);

    // ── Sub-Events ─────────────────────────────────────────────────────────
    const [subEvents, setSubEvents] = useState([
        { subEventName: '', description: '', price: '', maxParticipants: '' }
    ]);

    // ── Custom Fields ──────────────────────────────────────────────────────
    const [customFields, setCustomFields] = useState([]);
    const [newFieldLabel, setNewFieldLabel] = useState('');
    const [newFieldType, setNewFieldType] = useState('text');
    const [newFieldRequired, setNewFieldRequired] = useState(false);

    const {
        register, control, handleSubmit, watch, trigger, reset,
        formState: { errors }
    } = useForm({
        defaultValues: {
            categories: [{ name: 'Entry' }, { name: 'Food' }],
            comforts: [],
            totalTickets: '',
            terms: '',
            cancellationPolicy: '',
        }
    });

    const { fields, append, remove } = useFieldArray({ control, name: 'categories' });

    useEffect(() => { if (id) loadEventData(); }, [id]);
    useEffect(() => { loadClubs(); }, []);

    const loadClubs = async () => {
        try { setClubs(await clubService.getClubs()); }
        catch (e) { console.error('Failed to load clubs', e); }
    };

    const handleAddClub = async () => {
        if (!newClubName.trim()) return;
        try {
            await clubService.addClub(newClubName);
            await loadClubs();
            setNewClubName('');
            setShowAddClub(false);
        } catch (e) { alert('Failed to add club: ' + e.message); }
    };

    const loadEventData = async () => {
        try {
            const ev = await eventService.getEvent(id);
            if (!ev) return;
            reset({
                ...ev,
                date: ev.date ? new Date(ev.date).toISOString().split('T')[0] : '',
                registrationCloseDate: ev.registrationCloseDate
                    ? new Date(ev.registrationCloseDate).toISOString().split('T')[0] : '',
                categories: ev.categories?.map(c => ({ name: c })) || [{ name: 'Entry' }],
                comforts: ev.comforts || [],
            });
            // Restore image previews from existing URLs
            if (ev.posterURL) setPosterPreview(ev.posterURL);
            if (ev.landscapePosterURL) setBannerPreview(ev.landscapePosterURL);
            if (ev.eventType) setEventType(ev.eventType);
            if (ev.status) setStatus(ev.status);
            if (ev.modules) {
                setEnableTicketModule(ev.modules.ticketModule ?? true);
                setEnableTicketTiers(ev.modules.ticketTiers ?? false);
                setEnablePricingCategories(ev.modules.pricingCategories ?? false);
                setEnableCategories(ev.modules.categories ?? true);
                setEnableSubEvents(ev.modules.subEvents ?? false);
                setEnableCustomFields(ev.modules.customFields ?? false);
            }
            if (ev.ticketTiers?.length) { setEnableTicketTiers(true); setTicketTiers(ev.ticketTiers); }
            if (ev.pricingCategories?.length) { setEnablePricingCategories(true); setPricingCategories(ev.pricingCategories); }
            if (ev.subEvents?.length) { setEnableSubEvents(true); setSubEvents(ev.subEvents); }
            if (ev.customFields?.length) { setEnableCustomFields(true); setCustomFields(ev.customFields); }
        } catch (e) { console.error('Failed to load event', e); }
    };

    const validateAccessCode = async (code) => {
        if (!code) { setAccessCodeError(''); return true; }
        try {
            const events = await eventService.getAllEvents();
            const dup = events.find(e =>
                e.accessCode &&
                e.accessCode.trim().toUpperCase() === code.trim().toUpperCase() &&
                e.id !== id
            );
            if (dup) { setAccessCodeError(`Code already used for "${dup.name}"`); return false; }
            setAccessCodeError(''); return true;
        } catch { return true; }
    };

    const nextStep = async () => {
        let valid = false;
        if (currentStep === 1) {
            valid = await trigger(['name', 'date', 'time', 'location', 'description']);
        } else if (currentStep === 2) {
            const fields = ['accessCode', 'registrationCloseDate'];
            if (enableTicketModule && !enableTicketTiers && !enablePricingCategories) {
                fields.push('ticketPrice');
            }
            valid = await trigger(fields);
            if (valid) valid = await validateAccessCode(watch('accessCode'));
        } else {
            valid = true;
        }
        if (valid && currentStep < STEPS.length) {
            setCurrentStep(p => p + 1);
            window.scrollTo(0, 0);
        }
    };

    const prevStep = () => { setCurrentStep(p => p - 1); window.scrollTo(0, 0); };

    const onSubmit = async (data) => {
        // In create mode: only submit on the final step.
        // In edit mode: allow saving from any step.
        if (!id && currentStep !== STEPS.length) return;
        setLoading(true);
        try {
            const totalSeatsVal = data.totalTickets ? Number(data.totalTickets) : null;

            // ── Compress images to Base64 and store in Firestore directly ──
            let finalPosterURL = posterPreview && !posterFile ? posterPreview : null;
            let finalBannerURL = bannerPreview && !bannerFile ? bannerPreview : null;

            if (posterFile) {
                setUploadProgress('Compressing poster...');
                // Portrait: max 800x1100px
                finalPosterURL = await compressToBase64(posterFile, 800, 1100, 0.75);
            }
            if (bannerFile) {
                setUploadProgress('Compressing banner...');
                // Landscape: max 1280x720px
                finalBannerURL = await compressToBase64(bannerFile, 1280, 720, 0.75);
            }
            setUploadProgress('');

            const eventData = {
                ...data,
                // ── Type & status ──
                eventType,
                status,
                // ── Location (save both keys for full compatibility) ──
                location: data.location,
                venue: data.location,
                // ── Poster (use uploaded URLs, not form fields) ──
                posterURL: finalPosterURL,
                landscapePosterURL: finalBannerURL,
                // ── Club: only for Rotaract ──
                club: eventType === 'rotaract' ? (data.club || null) : null,
                // ── Ticket config ──
                ticketPrice: (enableTicketModule && !enableTicketTiers && !enablePricingCategories)
                    ? (Number(data.ticketPrice) || 0)
                    : null,
                totalTickets: totalSeatsVal,
                totalSeats: totalSeatsVal,   // FIX: Events.jsx uses totalSeats
                ticketTiers: (enableTicketModule && enableTicketTiers)
                    ? ticketTiers.filter(t => t.tierName.trim()).map(t => ({
                        tierName: t.tierName.trim(),
                        price: Number(t.price) || 0,
                        maxQuantity: t.maxQuantity ? Number(t.maxQuantity) : null,
                        description: t.description.trim() || null,
                    })) : [],
                pricingCategories: (enableTicketModule && enablePricingCategories)
                    ? pricingCategories.filter(c => c.categoryName.trim()).map(c => ({
                        categoryName: c.categoryName.trim(),
                        price: Number(c.price) || 0,
                    })) : [],
                // ── Scan categories ──
                categories: enableCategories
                    ? data.categories.map(c => c.name).filter(Boolean)
                    : ['Entry'],
                // ── Sub-events ──
                subEvents: enableSubEvents
                    ? subEvents.filter(se => se.subEventName.trim()).map(se => ({
                        subEventName: se.subEventName.trim(),
                        description: se.description.trim() || null,
                        price: Number(se.price) || 0,
                        maxParticipants: se.maxParticipants ? Number(se.maxParticipants) : null,
                    })) : [],
                // ── Custom fields ──
                customFields: enableCustomFields ? customFields : [],
                // ── Comforts ──
                comforts: data.comforts || [],
                // ── Policies ──
                terms: data.terms || 'Standard event terms apply.',
                cancellationPolicy: data.cancellationPolicy || 'No cancellations allowed.',
                // ── Module flags for edit-restore ──
                modules: {
                    ticketModule: enableTicketModule,
                    ticketTiers: enableTicketTiers,
                    pricingCategories: enablePricingCategories,
                    categories: enableCategories,
                    subEvents: enableSubEvents,
                    customFields: enableCustomFields,
                },
            };

            if (id) await eventService.updateEvent(id, eventData);
            else await eventService.createEvent(eventData);
            navigate('/admin/dashboard');
        } catch (e) {
            console.error(e);
            alert('Failed to save event: ' + e.message);
        }
        setLoading(false);
    };

    // ── Tier helpers ────────────────────────────────────────────────────────
    const updateTier = (i, f, v) => setTicketTiers(p => p.map((t, j) => j === i ? { ...t, [f]: v } : t));
    const addTier = () => setTicketTiers(p => [...p, { tierName: '', price: '', maxQuantity: '', description: '' }]);
    const removeTier = (i) => setTicketTiers(p => p.filter((_, j) => j !== i));

    // ── Pricing Category helpers ────────────────────────────────────────────
    const updatePC = (i, f, v) => setPricingCategories(p => p.map((c, j) => j === i ? { ...c, [f]: v } : c));
    const addPC = () => setPricingCategories(p => [...p, { categoryName: '', price: '' }]);
    const removePC = (i) => setPricingCategories(p => p.filter((_, j) => j !== i));

    // ── Sub-Event helpers ───────────────────────────────────────────────────
    const updateSE = (i, f, v) => setSubEvents(p => p.map((se, j) => j === i ? { ...se, [f]: v } : se));
    const addSE = () => setSubEvents(p => [...p, { subEventName: '', description: '', price: '', maxParticipants: '' }]);
    const removeSE = (i) => setSubEvents(p => p.filter((_, j) => j !== i));

    const inp = 'w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm p-2.5 border text-sm';
    const lbl = 'block text-sm font-medium text-gray-700 mb-1';

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">{id ? 'Edit Event' : 'Create New Event'}</h1>
                <p className="text-gray-500 mt-2">Follow the steps to {id ? 'update' : 'launch'} your event.</p>
            </div>

            {/* Stepper */}
            <div className="mb-8">
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10" />
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 -z-10 transition-all duration-300"
                        style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }} />
                    {STEPS.map(step => {
                        const Icon = step.icon;
                        const isActive = currentStep >= step.id;
                        const isCurrent = currentStep === step.id;
                        return (
                            <div key={step.id} className="flex flex-col items-center px-2 relative z-10">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${isActive ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                                    {isActive && !isCurrent ? <Check className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                                </div>
                                <span className={`mt-2 text-xs font-medium ${isCurrent ? 'text-indigo-600' : 'text-gray-500'}`}>{step.name}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); }}
                className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-8">

                    {/* ══ Step 1: Basics ═══════════════════════════════════════════════════ */}
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Event Details</h2>

                            {/* Event Type */}
                            <div>
                                <label className={lbl}>Event Type</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-1">
                                    {EVENT_TYPES.map(t => (
                                        <button key={t.value} type="button"
                                            onClick={() => setEventType(t.value)}
                                            className={`p-3 rounded-xl border-2 text-left transition-all ${eventType === t.value ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                            <p className={`text-sm font-semibold ${eventType === t.value ? 'text-indigo-700' : 'text-gray-700'}`}>{t.label}</p>
                                            <p className="text-xs text-gray-400 mt-0.5 leading-tight">{t.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Event Status */}
                            <div className="flex items-center gap-4">
                                <label className={lbl + ' mb-0'}>Publish Status</label>
                                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                                    {[{ v: 'active', l: '✅ Active (Live)' }, { v: 'draft', l: '📝 Draft (Hidden)' }].map(({ v, l }) => (
                                        <button key={v} type="button" onClick={() => setStatus(v)}
                                            className={`px-4 py-2 text-sm font-medium transition-colors ${status === v ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                                            {l}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={lbl}>Event Name</label>
                                    <input {...register('name', { required: 'Event name is required' })}
                                        className={inp} placeholder="e.g. Annual Charity Gala" />
                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                                </div>

                                <div>
                                    <label className={lbl}>Date</label>
                                    <input type="date" {...register('date', { required: 'Date is required' })} className={inp} />
                                    {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
                                </div>

                                <div>
                                    <label className={lbl}>Time</label>
                                    <input type="time" {...register('time', { required: 'Time is required' })} className={inp} />
                                    {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time.message}</p>}
                                </div>

                                {/* Club — ONLY for Rotaract events */}
                                {eventType === 'rotaract' && (
                                    <div>
                                        <label className={lbl}>
                                            Rotaract Club <span className="text-gray-400 font-normal text-xs">(Rotaract events only)</span>
                                        </label>
                                        <div className="flex gap-2">
                                            <select {...register('club')} className={`flex-1 ${inp}`}>
                                                <option value="">Select Club (Optional)</option>
                                                {clubs.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                            </select>
                                            <button type="button" onClick={() => setShowAddClub(!showAddClub)}
                                                className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
                                                {showAddClub ? 'Cancel' : '+ Add'}
                                            </button>
                                        </div>
                                        {showAddClub && (
                                            <div className="mt-2 flex gap-2">
                                                <input type="text" value={newClubName}
                                                    onChange={e => setNewClubName(e.target.value)}
                                                    placeholder="Enter new club name"
                                                    className={`flex-1 ${inp}`}
                                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddClub(); } }} />
                                                <button type="button" onClick={handleAddClub}
                                                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
                                                    Save
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className={eventType === 'rotaract' ? '' : 'md:col-span-1'}>
                                    <label className={lbl}>Venue / Location</label>
                                    <input {...register('location', { required: 'Location is required' })}
                                        className={inp} placeholder="Full address of the venue" />
                                    {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>}
                                    <p className="text-xs text-gray-400 mt-1">Saved as both "location" and "venue" for display compatibility.</p>
                                </div>

                                {/* Poster — file upload */}
                                <div className={eventType === 'rotaract' ? 'md:col-span-2' : 'md:col-span-1'}>
                                    <label className={lbl}>
                                        <span className="flex items-center gap-1"><Image className="w-4 h-4 inline" /> Event Poster (Portrait, A4)</span>
                                    </label>
                                    <div className="flex items-start gap-4">
                                        {/* Preview */}
                                        {posterPreview && (
                                            <img src={posterPreview} alt="Poster preview"
                                                className="w-16 h-20 object-cover rounded-lg border border-gray-200 shrink-0" />
                                        )}
                                        <div className="flex-1">
                                            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-indigo-50 hover:border-indigo-400 transition-colors">
                                                <div className="flex flex-col items-center gap-1 text-gray-400">
                                                    <Image className="w-6 h-6" />
                                                    <span className="text-xs font-medium">
                                                        {posterFile ? posterFile.name : 'Click to upload poster'}
                                                    </span>
                                                    <span className="text-xs">WebP / JPG / PNG · max 5 MB</span>
                                                </div>
                                                <input type="file" accept="image/webp,image/jpeg,image/png"
                                                    className="hidden"
                                                    onChange={e => handleImageChange(e, 'poster')} />
                                            </label>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">Portrait poster (A4 ratio). Shown on event cards and listing.</p>
                                </div>

                                {/* Landscape Banner — file upload */}
                                <div className="md:col-span-2">
                                    <label className={lbl}>
                                        <span className="flex items-center gap-1"><Image className="w-4 h-4 inline" /> Landscape Banner (16:9)</span>
                                    </label>
                                    <div className="flex items-start gap-4">
                                        {/* Preview */}
                                        {bannerPreview && (
                                            <img src={bannerPreview} alt="Banner preview"
                                                className="w-28 h-16 object-cover rounded-lg border border-gray-200 shrink-0" />
                                        )}
                                        <div className="flex-1">
                                            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-indigo-50 hover:border-indigo-400 transition-colors">
                                                <div className="flex flex-col items-center gap-1 text-gray-400">
                                                    <Image className="w-6 h-6" />
                                                    <span className="text-xs font-medium">
                                                        {bannerFile ? bannerFile.name : 'Click to upload banner'}
                                                    </span>
                                                    <span className="text-xs">WebP / JPG / PNG · max 5 MB</span>
                                                </div>
                                                <input type="file" accept="image/webp,image/jpeg,image/png"
                                                    className="hidden"
                                                    onChange={e => handleImageChange(e, 'banner')} />
                                            </label>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">Wide banner (16:9 ratio). Header image on event detail page.</p>
                                </div>

                                <div className="md:col-span-2">
                                    <label className={lbl}>Description</label>
                                    <textarea {...register('description', { required: 'Description is required' })}
                                        rows={4} className={inp} placeholder="Describe what this event is about..." />
                                    {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ══ Step 2: Tickets & Access ══════════════════════════════════════════ */}
                    {currentStep === 2 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Tickets & Access</h2>

                            {/* Always-present: Access Code + Close Date */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={lbl}>Event Access Code</label>
                                    <input {...register('accessCode', { required: 'Access Code is required' })}
                                        className={inp} placeholder="Unique scanner code for this event" />
                                    <p className="text-xs text-gray-500 mt-1">QR Scanner uses this code to unlock the event.</p>
                                    {errors.accessCode && <p className="text-red-500 text-xs mt-1">{errors.accessCode.message}</p>}
                                    {accessCodeError && <p className="text-red-500 text-xs mt-1">{accessCodeError}</p>}
                                </div>
                                <div>
                                    <label className={lbl}>Registration Close Date</label>
                                    <input type="date" {...register('registrationCloseDate', { required: 'Deadline is required' })} className={inp} />
                                    {errors.registrationCloseDate && <p className="text-red-500 text-xs mt-1">{errors.registrationCloseDate.message}</p>}
                                </div>
                                <div>
                                    <label className={lbl}>Total Seats / Tickets</label>
                                    <input type="number" {...register('totalTickets')} min="1"
                                        className={inp} placeholder="Leave empty for unlimited" />
                                    <p className="text-xs text-gray-400 mt-1">Saved as both <code>totalTickets</code> and <code>totalSeats</code> — used for "seats left" counter.</p>
                                </div>
                            </div>

                            {/* ── Ticket Module Toggle ── */}
                            <div className="pt-2">
                                <ToggleSwitch enabled={enableTicketModule} onToggle={() => setEnableTicketModule(p => !p)}
                                    label="Enable Ticket Module"
                                    description="Turn off for free events or events handled outside this platform." />

                                <ModuleSection enabled={enableTicketModule}>

                                    {/* Simple single price (shown when neither Tiers nor Categories are on) */}
                                    {!enableTicketTiers && !enablePricingCategories && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className={lbl}>Base Ticket Price (₹)</label>
                                                <div className="relative">
                                                    <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 text-sm">₹</span>
                                                    <input type="number" min="0"
                                                        {...register('ticketPrice', { required: !enableTicketTiers && !enablePricingCategories ? 'Price is required' : false })}
                                                        className={`${inp} pl-7`} placeholder="0" />
                                                </div>
                                                {errors.ticketPrice && <p className="text-red-500 text-xs mt-1">{errors.ticketPrice.message}</p>}
                                            </div>
                                        </div>
                                    )}

                                    {/* ── Ticket Tiers sub-toggle ── */}
                                    <ToggleSwitch enabled={enableTicketTiers} onToggle={() => setEnableTicketTiers(p => !p)}
                                        label="Ticket Tiers"
                                        description="Add multiple price tiers (e.g., Early Bird ₹200, Standard ₹400, VIP ₹800)." />

                                    <ModuleSection enabled={enableTicketTiers}>
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                <Layers className="w-4 h-4 text-indigo-500" /> Ticket Tiers
                                            </p>
                                            <button type="button" onClick={addTier}
                                                className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-100 font-medium">
                                                <Plus className="w-3.5 h-3.5" /> Add Tier
                                            </button>
                                        </div>
                                        {ticketTiers.map((tier, i) => (
                                            <div key={i} className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Tier {i + 1}</span>
                                                    {ticketTiers.length > 1 && (
                                                        <button type="button" onClick={() => removeTier(i)}
                                                            className="text-red-400 hover:text-red-600 flex items-center gap-1 text-xs">
                                                            <Trash2 className="w-3.5 h-3.5" /> Remove
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className={lbl}>Tier Name *</label>
                                                        <input type="text" value={tier.tierName}
                                                            onChange={e => updateTier(i, 'tierName', e.target.value)}
                                                            placeholder="e.g. Early Bird, VIP, Standard" className={inp} />
                                                    </div>
                                                    <div>
                                                        <label className={lbl}>Price (₹) *</label>
                                                        <div className="relative">
                                                            <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 text-sm">₹</span>
                                                            <input type="number" value={tier.price} min="0"
                                                                onChange={e => updateTier(i, 'price', e.target.value)}
                                                                placeholder="0" className={`${inp} pl-7`} />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className={lbl}>Max Quantity</label>
                                                        <input type="number" value={tier.maxQuantity} min="1"
                                                            onChange={e => updateTier(i, 'maxQuantity', e.target.value)}
                                                            placeholder="Leave empty for unlimited" className={inp} />
                                                    </div>
                                                    <div>
                                                        <label className={lbl}>Description</label>
                                                        <input type="text" value={tier.description}
                                                            onChange={e => updateTier(i, 'description', e.target.value)}
                                                            placeholder="e.g. Includes lunch and T-shirt" className={inp} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </ModuleSection>

                                    {/* ── Pricing Categories sub-toggle ── */}
                                    <ToggleSwitch enabled={enablePricingCategories} onToggle={() => setEnablePricingCategories(p => !p)}
                                        label="Pricing Categories"
                                        description="Different prices for different attendee types (e.g., Kids ₹100, Adults ₹250, Seniors ₹150)." />

                                    <ModuleSection enabled={enablePricingCategories}>
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                <Users className="w-4 h-4 text-indigo-500" /> Pricing Categories
                                            </p>
                                            <button type="button" onClick={addPC}
                                                className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-100 font-medium">
                                                <Plus className="w-3.5 h-3.5" /> Add Category
                                            </button>
                                        </div>
                                        {pricingCategories.map((pc, i) => (
                                            <div key={i} className="flex gap-3 items-start">
                                                <div className="flex-1">
                                                    <label className={lbl}>Category Name *</label>
                                                    <input type="text" value={pc.categoryName}
                                                        onChange={e => updatePC(i, 'categoryName', e.target.value)}
                                                        placeholder="e.g. Kids, Adults, Seniors" className={inp} />
                                                </div>
                                                <div className="w-36">
                                                    <label className={lbl}>Price (₹) *</label>
                                                    <div className="relative">
                                                        <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 text-sm">₹</span>
                                                        <input type="number" value={pc.price} min="0"
                                                            onChange={e => updatePC(i, 'price', e.target.value)}
                                                            placeholder="0" className={`${inp} pl-7`} />
                                                    </div>
                                                </div>
                                                {pricingCategories.length > 1 && (
                                                    <div className="flex items-end pb-0.5">
                                                        <button type="button" onClick={() => removePC(i)}
                                                            className="mt-6 text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </ModuleSection>
                                </ModuleSection>
                            </div>
                        </div>
                    )}

                    {/* ══ Step 3: Features & Comforts ══════════════════════════════════════ */}
                    {currentStep === 3 && (
                        <div className="space-y-8 animate-fadeIn">

                            {/* Comforts */}
                            <div>
                                <div className="flex justify-between items-center border-b pb-4 mb-4">
                                    <h2 className="text-xl font-bold text-gray-800">Event Comforts</h2>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                    {COMFORTS_LIST.map(c => (
                                        <label key={c} className="inline-flex items-center p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors">
                                            <input type="checkbox" value={c} {...register('comforts')}
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 mr-3" />
                                            <span className="text-sm text-gray-700 select-none">{c}</span>
                                        </label>
                                    ))}
                                </div>
                                {customComforts.length > 0 && (
                                    <div className="mb-4 space-y-2">
                                        {customComforts.map((c, i) => (
                                            <div key={i} className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg">
                                                <input type="checkbox" value={c} {...register('comforts')}
                                                    className="rounded border-gray-300 text-indigo-600 h-4 w-4" />
                                                <span className="text-sm text-gray-700 flex-1">{c}</span>
                                                <button type="button" onClick={() => setCustomComforts(p => p.filter((_, j) => j !== i))}
                                                    className="text-red-500 text-xs px-2">Remove</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <input type="text" value={newComfort} onChange={e => setNewComfort(e.target.value)}
                                        placeholder="Add custom comfort (e.g., Live Music)" className={inp}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                if (newComfort.trim()) { setCustomComforts(p => [...p, newComfort.trim()]); setNewComfort(''); }
                                            }
                                        }} />
                                    <button type="button"
                                        onClick={() => { if (newComfort.trim()) { setCustomComforts(p => [...p, newComfort.trim()]); setNewComfort(''); } }}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm whitespace-nowrap">
                                        Add
                                    </button>
                                </div>
                            </div>

                            {/* Scan Categories Module */}
                            <div>
                                <ToggleSwitch enabled={enableCategories} onToggle={() => setEnableCategories(p => !p)}
                                    label="Enable Scan Categories"
                                    description='Define QR check-in checkpoints (e.g., "Entry", "Lunch", "Gift"). When off, only "Entry" is used.' />
                                <ModuleSection enabled={enableCategories}>
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <Tag className="w-4 h-4 text-indigo-500" /> Scan Categories
                                        </p>
                                        <button type="button" onClick={() => append({ name: '' })}
                                            className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-100 font-medium">
                                            <Plus className="w-3.5 h-3.5" /> Add Category
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-3">Attendees scan their QR code at each checkpoint.</p>
                                    <div className="space-y-2">
                                        {fields.map((field, i) => (
                                            <div key={field.id} className="flex gap-3">
                                                <input {...register(`categories.${i}.name`)}
                                                    placeholder="Category Name (e.g., Entry, Lunch, Gift)"
                                                    className={inp} />
                                                <button type="button" onClick={() => remove(i)}
                                                    className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg flex-shrink-0">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </ModuleSection>
                            </div>

                            {/* Sub-Events Module */}
                            <div>
                                <ToggleSwitch enabled={enableSubEvents} onToggle={() => setEnableSubEvents(p => !p)}
                                    label="Enable Sub-Events"
                                    description="Add multiple sessions or tracks under one event (e.g., Workshop A, Paper Presentation, Quiz)." />
                                <ModuleSection enabled={enableSubEvents}>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <GitBranch className="w-4 h-4 text-indigo-500" /> Sub-Events
                                        </p>
                                        <button type="button" onClick={addSE}
                                            className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-100 font-medium">
                                            <Plus className="w-3.5 h-3.5" /> Add Sub-Event
                                        </button>
                                    </div>
                                    {subEvents.map((se, i) => (
                                        <div key={i} className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Sub-Event {i + 1}</span>
                                                {subEvents.length > 1 && (
                                                    <button type="button" onClick={() => removeSE(i)}
                                                        className="text-red-400 hover:text-red-600 flex items-center gap-1 text-xs">
                                                        <Trash2 className="w-3.5 h-3.5" /> Remove
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className={lbl}>Sub-Event Name *</label>
                                                    <input type="text" value={se.subEventName}
                                                        onChange={e => updateSE(i, 'subEventName', e.target.value)}
                                                        placeholder="e.g. Workshop A, Quiz Round" className={inp} />
                                                </div>
                                                <div>
                                                    <label className={lbl}>Price (₹)</label>
                                                    <div className="relative">
                                                        <span className="absolute inset-y-0 left-3 flex items-center text-gray-500 text-sm">₹</span>
                                                        <input type="number" value={se.price} min="0"
                                                            onChange={e => updateSE(i, 'price', e.target.value)}
                                                            placeholder="0 for free" className={`${inp} pl-7`} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className={lbl}>Max Participants</label>
                                                    <input type="number" value={se.maxParticipants} min="1"
                                                        onChange={e => updateSE(i, 'maxParticipants', e.target.value)}
                                                        placeholder="Leave empty for unlimited" className={inp} />
                                                </div>
                                                <div>
                                                    <label className={lbl}>Description</label>
                                                    <input type="text" value={se.description}
                                                        onChange={e => updateSE(i, 'description', e.target.value)}
                                                        placeholder="Brief description of this session" className={inp} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </ModuleSection>
                            </div>
                        </div>
                    )}

                    {/* ══ Step 4: Policies ═════════════════════════════════════════════════ */}
                    {currentStep === 4 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Policies & Terms</h2>
                            <div>
                                <label className={lbl}>Terms & Conditions</label>
                                <textarea {...register('terms')} rows={4} className={inp}
                                    placeholder="Enter event rules, regulations, and terms..." />
                                <p className="text-xs text-gray-500 mt-1">Optional — can be added later.</p>
                            </div>
                            <div>
                                <label className={lbl}>Cancellation Policy</label>
                                <textarea {...register('cancellationPolicy')} rows={3} className={inp}
                                    placeholder="e.g. No refunds after booking..." />
                            </div>
                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 flex items-start gap-3">
                                <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-yellow-700">
                                    Please review all event details before publishing. Once published, core details
                                    like ticket price cannot be easily changed if tickets have been sold.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ══ Step 5: Advanced (Custom Fields) ═════════════════════════════════ */}
                    {currentStep === 5 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h2 className="text-xl font-bold text-gray-800 border-b pb-4">Advanced Configuration</h2>

                            <ToggleSwitch enabled={enableCustomFields} onToggle={() => setEnableCustomFields(p => !p)}
                                label="Enable Custom Registration Fields"
                                description="Add extra input fields for attendees during registration (e.g., T-Shirt Size, College Name)." />

                            {!enableCustomFields && (
                                <div className="text-center py-8 text-gray-400">
                                    <Settings className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">Toggle on above to add custom registration questions.</p>
                                </div>
                            )}

                            <ModuleSection enabled={enableCustomFields}>
                                {customFields.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-gray-700">Current Fields:</p>
                                        {customFields.map((field, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                                <div>
                                                    <p className="font-medium text-gray-800 text-sm">{field.label}</p>
                                                    <p className="text-xs text-gray-500">Type: {field.type} | {field.required ? 'Required' : 'Optional'}</p>
                                                </div>
                                                <button type="button" onClick={() => setCustomFields(p => p.filter((_, j) => j !== i))}
                                                    className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="border rounded-xl p-4 bg-gray-50">
                                    <h3 className="font-semibold text-gray-800 mb-4 text-sm">Add New Field</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className={lbl}>Field Label</label>
                                            <input type="text" value={newFieldLabel} onChange={e => setNewFieldLabel(e.target.value)}
                                                placeholder="e.g., T-Shirt Size" className={inp} />
                                        </div>
                                        <div>
                                            <label className={lbl}>Field Type</label>
                                            <select value={newFieldType} onChange={e => setNewFieldType(e.target.value)} className={inp}>
                                                <option value="text">Text</option>
                                                <option value="number">Number</option>
                                                <option value="email">Email</option>
                                                <option value="date">Date</option>
                                                <option value="checkbox">Checkbox</option>
                                                <option value="select">Dropdown</option>
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="fieldReq" checked={newFieldRequired}
                                                onChange={e => setNewFieldRequired(e.target.checked)}
                                                className="rounded border-gray-300 text-indigo-600 h-4 w-4" />
                                            <label htmlFor="fieldReq" className="text-sm text-gray-700">Required field</label>
                                        </div>
                                        <div className="flex items-end">
                                            <button type="button"
                                                onClick={() => {
                                                    if (newFieldLabel.trim()) {
                                                        setCustomFields(p => [...p, { label: newFieldLabel.trim(), type: newFieldType, required: newFieldRequired }]);
                                                        setNewFieldLabel(''); setNewFieldType('text'); setNewFieldRequired(false);
                                                    }
                                                }}
                                                className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm flex items-center justify-center gap-2">
                                                <Plus className="w-4 h-4" /> Add Field
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </ModuleSection>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-8 py-5 flex justify-between items-center border-t border-gray-100">
                    <div className="flex gap-3 items-center">
                        <button type="button" onClick={prevStep} disabled={currentStep === 1}
                            className={`flex items-center px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentStep === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'}`}>
                            <ChevronLeft className="w-4 h-4 mr-2" /> Back
                        </button>
                        {id && (
                            <>
                                <button type="button" onClick={() => navigate('/admin/dashboard')}
                                    className="flex items-center px-5 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                                    Cancel Edit
                                </button>
                                {/* Save button right next to Cancel when editing */}
                                <button type="submit" disabled={loading}
                                    className={`flex items-center bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 shadow-md hover:shadow-lg transition-all ${loading ? 'opacity-70 cursor-wait' : ''}`}>
                                    {loading ? 'Saving...' : 'Update Event'}
                                    {!loading && <Check className="w-4 h-4 ml-2" />}
                                </button>
                            </>
                        )}
                    </div>

                    {currentStep < STEPS.length ? (
                        <button type="button" onClick={nextStep}
                            className="flex items-center bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all">
                            Next Step <ChevronRight className="w-4 h-4 ml-2" />
                        </button>
                    ) : !id ? (
                        <button type="submit" disabled={loading}
                            className={`flex items-center bg-green-600 text-white px-8 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 shadow-md hover:shadow-lg transition-all ${loading ? 'opacity-70 cursor-wait' : ''}`}>
                            {loading ? 'Saving...' : 'Create Event'}
                            {!loading && <Check className="w-4 h-4 ml-2" />}
                        </button>
                    ) : null}
                </div>
            </form>

            {/* Upload progress overlay */}
            {loading && uploadProgress && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl px-8 py-6 shadow-2xl flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                        <p className="text-sm font-semibold text-gray-700">{uploadProgress}</p>
                    </div>
                </div>
            )}
        </div>
    );
}