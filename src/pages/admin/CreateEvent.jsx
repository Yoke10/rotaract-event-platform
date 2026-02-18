import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { eventService } from '../../services/eventService';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, ChevronRight, ChevronLeft, Calendar, MapPin, DollarSign, List, Shield, Info } from 'lucide-react';
import { clubService } from '../../services/clubService';

// Steps Configuration
const STEPS = [
    { id: 1, name: 'Event Basics', icon: Info },
    { id: 2, name: 'Tickets & Access', icon: DollarSign },
    { id: 3, name: 'Features & Comforts', icon: List },
    { id: 4, name: 'Policies', icon: Shield },
    { id: 5, name: 'Custom Fields', icon: Calendar },
];



const COMFORTS_LIST = [
    "Wi-Fi Access",
    "Air Conditioning",
    "Parking Available",
    "Food & Beverages",
    "Restrooms",
    "Wheelchair Accessible",
    "First Aid Kit",
    "Security Personnel",
    "Photography / Videography"
];

export default function CreateEvent() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [accessCodeError, setAccessCodeError] = useState('');
    const [customComforts, setCustomComforts] = useState([]);
    const [newComfort, setNewComfort] = useState('');
    const [clubs, setClubs] = useState([]);
    const [newClubName, setNewClubName] = useState('');
    const [showAddClub, setShowAddClub] = useState(false);
    const [customFields, setCustomFields] = useState([]);
    const [newFieldLabel, setNewFieldLabel] = useState('');
    const [newFieldType, setNewFieldType] = useState('text');
    const [newFieldRequired, setNewFieldRequired] = useState(false);

    const { register, control, handleSubmit, watch, trigger, reset, formState: { errors } } = useForm({
        defaultValues: {
            categories: [{ name: "Entry" }, { name: "Food" }],
            comforts: [],
            totalTickets: "",
            terms: "",
            cancellationPolicy: "",
            customFields: []
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "categories"
    });

    useEffect(() => {
        if (id) {
            loadEventData();
        }
    }, [id]);

    useEffect(() => {
        loadClubs();
    }, []);

    const loadClubs = async () => {
        try {
            const clubsData = await clubService.getClubs();
            setClubs(clubsData);
        } catch (error) {
            console.error("Failed to load clubs", error);
        }
    };

    const handleAddClub = async () => {
        if (!newClubName.trim()) return;

        try {
            await clubService.addClub(newClubName);
            await loadClubs();
            setNewClubName('');
            setShowAddClub(false);
        } catch (error) {
            console.error("Failed to add club", error);
            alert("Failed to add club: " + error.message);
        }
    };

    const loadEventData = async () => {
        try {
            const eventData = await eventService.getEvent(id);
            if (eventData) {
                // Transform data if needed to match form structure
                reset({
                    ...eventData,
                    date: eventData.date ? new Date(eventData.date).toISOString().split('T')[0] : '',
                    registrationCloseDate: eventData.registrationCloseDate ? new Date(eventData.registrationCloseDate).toISOString().split('T')[0] : '',
                    // Ensure arrays
                    categories: eventData.categories?.map(c => ({ name: c })) || [{ name: "Entry" }],
                    comforts: eventData.comforts || []
                });
            }
        } catch (error) {
            console.error("Failed to load event for edit", error);
        }
    };

    const validateAccessCode = async (code) => {
        if (!code) {
            setAccessCodeError('');
            return true;
        }

        try {
            const events = await eventService.getAllEvents();
            const duplicate = events.find(e =>
                e.accessCode &&
                e.accessCode.trim().toUpperCase() === code.trim().toUpperCase() &&
                e.id !== id // Exclude current event when editing
            );

            if (duplicate) {
                setAccessCodeError(`Access code already used for "${duplicate.name}"`);
                return false;
            }
            setAccessCodeError('');
            return true;
        } catch (error) {
            console.error("Error validating access code:", error);
            return true; // Allow on error to not block user
        }
    };

    const nextStep = async () => {
        let valid = false;
        if (currentStep === 1) {
            valid = await trigger(['name', 'date', 'time', 'location', 'description']);
        } else if (currentStep === 2) {
            valid = await trigger(['ticketPrice', 'accessCode', 'registrationCloseDate']);
            if (valid) {
                // Additional validation for access code uniqueness
                const accessCodeValue = watch('accessCode');
                const isAccessCodeValid = await validateAccessCode(accessCodeValue);
                valid = isAccessCodeValid;
            }
        } else if (currentStep === 3) {
            // Step 3 fields are optional, always allow progression
            valid = true;
        } else if (currentStep === 4) {
            // Step 4 fields are optional
            valid = true;
        } else if (currentStep === 5) {
            // Step 5 fields are optional
            valid = true;
        }

        if (valid && currentStep < 5) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo(0, 0);
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => prev - 1);
        window.scrollTo(0, 0);
    };

    const onSubmit = async (data) => {
        // Prevent submission if not on the last step
        if (currentStep !== 5) return;

        setLoading(true);
        try {
            const eventData = {
                ...data,
                ticketPrice: Number(data.ticketPrice),
                totalTickets: data.totalTickets ? Number(data.totalTickets) : null,
                accessCode: data.accessCode,
                // Ensure array formats
                comforts: data.comforts || [],
                categories: data.categories.map(cat => cat.name).filter(Boolean),
                customFields: customFields, // Add custom fields
                // Add defaults if missing
                club: data.club || "Rotaract Event",
                terms: data.terms || "Standard event terms apply.",
                cancellationPolicy: data.cancellationPolicy || "No cancellations allowed."
            };

            if (id) {
                await eventService.updateEvent(id, eventData);
            } else {
                await eventService.createEvent(eventData);
            }
            navigate('/admin/dashboard');
        } catch (error) {
            console.error(error);
            alert("Failed to save event: " + error.message);
        }
        setLoading(false);
    };

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
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-indigo-600 -z-10 transition-all duration-300"
                        style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}></div>

                    {STEPS.map((step) => {
                        const Icon = step.icon;
                        const isActive = currentStep >= step.id;
                        const isCurrent = currentStep === step.id;

                        return (
                            <div key={step.id} className="flex flex-col items-center px-2 relative z-10">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${isActive ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300 text-gray-400'
                                    }`}>
                                    {isActive && !isCurrent ? <Check className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                                </div>
                                <span className={`mt-2 text-xs font-medium ${isCurrent ? 'text-indigo-600' : 'text-gray-500'}`}>
                                    {step.name}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-8">
                    {/* Step 1: Basics */}
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Event Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
                                    <input {...register("name", { required: "Event name is required" })}
                                        className="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-colors p-2.5 border"
                                        placeholder="e.g. Annual Charity Gala" />
                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                    <input type="date" {...register("date", { required: "Date is required" })}
                                        className="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm p-2.5 border" />
                                    {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Club</label>
                                    <div className="flex gap-2">
                                        <select {...register("club")}
                                            className="flex-1 rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm p-2.5 border">
                                            <option value="">Select Club (Optional)</option>
                                            {clubs.map(club => (
                                                <option key={club.id} value={club.name}>{club.name}</option>
                                            ))}
                                        </select>
                                        <button type="button" onClick={() => setShowAddClub(!showAddClub)}
                                            className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
                                            {showAddClub ? 'Cancel' : '+ Add'}
                                        </button>
                                    </div>
                                    {showAddClub && (
                                        <div className="mt-2 flex gap-2">
                                            <input
                                                type="text"
                                                value={newClubName}
                                                onChange={(e) => setNewClubName(e.target.value)}
                                                placeholder="Enter new club name"
                                                className="flex-1 rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm p-2 border text-sm"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAddClub();
                                                    }
                                                }}
                                            />
                                            <button type="button" onClick={handleAddClub}
                                                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
                                                Save
                                            </button>
                                        </div>
                                    )}
                                </div>



                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                    <input type="time" {...register("time", { required: "Time is required" })}
                                        className="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm p-2.5 border" />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location / Venue</label>
                                    <input {...register("location", { required: "Location is required" })}
                                        className="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm p-2.5 border"
                                        placeholder="Full address of the venue" />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea {...register("description", { required: "Description is required" })}
                                        rows={4}
                                        className="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm p-2.5 border"
                                        placeholder="Describe what this event is about..." />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Tickets */}
                    {currentStep === 2 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Tickets & Access</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Price (₹)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500">₹</span>
                                        </div>
                                        <input type="number" {...register("ticketPrice", { required: "Price is required", min: 0 })}
                                            className="w-full pl-7 rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm p-2.5 border" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Tickets</label>
                                    <input type="number" {...register("totalTickets")}
                                        className="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm p-2.5 border"
                                        placeholder="Leave empty for unlimited" />
                                    <p className="text-xs text-gray-500 mt-1">Maximum number of tickets available.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Access Code</label>
                                    <input {...register("accessCode", { required: "Access Code is required" })}
                                        className="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm p-2.5 border"
                                        placeholder="Unique code for this event" />
                                    <p className="text-xs text-gray-500 mt-1">This code is required for users to view/register for the event manually.</p>
                                    {errors.accessCode && <p className="text-red-500 text-xs mt-1">{errors.accessCode.message}</p>}
                                    {accessCodeError && <p className="text-red-500 text-xs mt-1">{accessCodeError}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration Close Date</label>
                                    <input type="date" {...register("registrationCloseDate", { required: "Deadline is required" })}
                                        className="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm p-2.5 border" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Features */}
                    {currentStep === 3 && (
                        <div className="space-y-8 animate-fadeIn">
                            {/* Comforts */}
                            <div>
                                <div className="flex justify-between items-center border-b pb-4 mb-4">
                                    <h2 className="text-xl font-bold text-gray-800">Event Comforts</h2>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                    {COMFORTS_LIST.map((comfort) => (
                                        <label key={comfort} className="inline-flex items-center p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors">
                                            <input type="checkbox" value={comfort} {...register("comforts")}
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 mr-3" />
                                            <span className="text-sm text-gray-700 select-none">{comfort}</span>
                                        </label>
                                    ))}
                                </div>

                                {/* Custom Comforts */}
                                {customComforts.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-sm font-medium text-gray-700 mb-2">Custom Comforts:</p>
                                        <div className="space-y-2">
                                            {customComforts.map((comfort, index) => (
                                                <div key={index} className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg">
                                                    <input type="checkbox" value={comfort} {...register("comforts")}
                                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4" />
                                                    <span className="text-sm text-gray-700 flex-1">{comfort}</span>
                                                    <button type="button" onClick={() => setCustomComforts(prev => prev.filter((_, i) => i !== index))}
                                                        className="text-red-500 hover:text-red-700 text-xs px-2 py-1">
                                                        Remove
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Add Custom Comfort */}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newComfort}
                                        onChange={(e) => setNewComfort(e.target.value)}
                                        placeholder="Add custom comfort (e.g., Live Music)"
                                        className="flex-1 rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm p-2.5 border"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                if (newComfort.trim()) {
                                                    setCustomComforts(prev => [...prev, newComfort.trim()]);
                                                    setNewComfort('');
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (newComfort.trim()) {
                                                setCustomComforts(prev => [...prev, newComfort.trim()]);
                                                setNewComfort('');
                                            }
                                        }}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
                                    >
                                        Add Comfort
                                    </button>
                                </div>
                            </div>

                            {/* Scan Categories */}
                            <div>
                                <div className="flex justify-between items-center border-b pb-4 mb-4">
                                    <h2 className="text-xl font-bold text-gray-800">Scan Categories</h2>
                                    <button type="button" onClick={() => append({ name: "" })}
                                        className="text-sm bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full hover:bg-indigo-100 font-medium">
                                        + Add Category
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500 mb-4">Define checkpoints where attendees can scan their QR codes (e.g., "Entry", "Lunch", "Gift").</p>
                                <div className="space-y-3">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="flex gap-4">
                                            <input {...register(`categories.${index}.name`)}
                                                placeholder="Category Name"
                                                className="flex-1 rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm p-2.5 border" />
                                            <button type="button" onClick={() => remove(index)}
                                                className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg">
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Policies */}
                    {currentStep === 4 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Policies & Terms</h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
                                <textarea {...register("terms")}
                                    rows={4}
                                    className="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm p-2.5 border"
                                    placeholder="Enter event rules, regulations, and terms..." />
                                <p className="text-xs text-gray-500 mt-1">Optional, can be added later.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cancellation Policy</label>
                                <textarea {...register("cancellationPolicy")}
                                    rows={3}
                                    className="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm p-2.5 border"
                                    placeholder="e.g. No refunds after booking..." />
                            </div>

                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 flex items-start">
                                <Info className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                                <p className="text-sm text-yellow-700">
                                    Please review all event details before publishing. Once published, core details like ticket price cannot be easily changed if tickets are sold.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Custom Fields */}
                    {currentStep === 5 && (
                        <div className="space-y-6 animate-fadeIn">
                            <h2 className="text-xl font-bold text-gray-800 border-b pb-4">Custom Registration Fields</h2>
                            <p className="text-sm text-gray-600">Add custom fields that users will fill during event registration.</p>

                            {/* Existing Custom Fields */}
                            {customFields.length > 0 && (
                                <div className="space-y-3 mb-6">
                                    <p className="text-sm font-medium text-gray-700">Current Custom Fields:</p>
                                    {customFields.map((field, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                            <div>
                                                <p className="font-medium text-gray-800">{field.label}</p>
                                                <p className="text-xs text-gray-500">
                                                    Type: {field.type} | {field.required ? 'Required' : 'Optional'}
                                                </p>
                                            </div>
                                            <button type="button" onClick={() => setCustomFields(prev => prev.filter((_, i) => i !== index))}
                                                className="text-red-500 hover:text-red-700 text-sm px-3 py-1">
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add New Field */}
                            <div className="border rounded-lg p-4 bg-gray-50">
                                <h3 className="font-semibold text-gray-800 mb-4">Add New Field</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Field Label</label>
                                        <input
                                            type="text"
                                            value={newFieldLabel}
                                            onChange={(e) => setNewFieldLabel(e.target.value)}
                                            placeholder="e.g., T-Shirt Size"
                                            className="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm p-2.5 border"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Field Type</label>
                                        <select
                                            value={newFieldType}
                                            onChange={(e) => setNewFieldType(e.target.value)}
                                            className="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm p-2.5 border"
                                        >
                                            <option value="text">Text</option>
                                            <option value="number">Number</option>
                                            <option value="email">Email</option>
                                            <option value="date">Date</option>
                                            <option value="checkbox">Checkbox</option>
                                            <option value="select">Dropdown</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={newFieldRequired}
                                            onChange={(e) => setNewFieldRequired(e.target.checked)}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 mr-2"
                                        />
                                        <label className="text-sm text-gray-700">Required Field</label>
                                    </div>
                                    <div className="flex items-end">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (newFieldLabel.trim()) {
                                                    setCustomFields(prev => [...prev, {
                                                        label: newFieldLabel.trim(),
                                                        type: newFieldType,
                                                        required: newFieldRequired
                                                    }]);
                                                    setNewFieldLabel('');
                                                    setNewFieldType('text');
                                                    setNewFieldRequired(false);
                                                }
                                            }}
                                            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                                        >
                                            Add Field
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="bg-gray-50 px-8 py-5 flex justify-between items-center border-t border-gray-100">
                    <div className="flex gap-3">
                        <button type="button" onClick={prevStep} disabled={currentStep === 1}
                            className={`flex items-center px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentStep === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'}`}>
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Back
                        </button>
                        {id && (
                            <button type="button" onClick={() => navigate('/admin/dashboard')}
                                className="flex items-center px-5 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                                Cancel Edit
                            </button>
                        )}
                    </div>

                    {currentStep < 5 ? (
                        <button type="button" onClick={nextStep}
                            className="flex items-center bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all shadow-md hover:shadow-lg">
                            Next Step
                            <ChevronRight className="w-4 h-4 ml-2" />
                        </button>
                    ) : (
                        <button type="submit" disabled={loading}
                            className={`flex items-center bg-green-600 text-white px-8 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 focus:ring-4 focus:ring-green-100 transition-all shadow-md hover:shadow-lg ${loading ? 'opacity-70 cursor-wait' : ''}`}>
                            {loading ? 'Saving...' : (id ? 'Update Event' : 'Create Event')}
                            {!loading && <Check className="w-4 h-4 ml-2" />}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
