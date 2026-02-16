import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { eventService } from '../../services/eventService';
import { useNavigate } from 'react-router-dom';

export default function CreateEvent() {
    const { register, control, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            categories: [{ name: "Entry" }]
        }
    });
    const { fields, append, remove } = useFieldArray({
        control,
        name: "categories"
    });

    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Default clubs list
    const defaultClubs = ["Rotaract Club of Bombay", "Rotaract Club of Delhi", "Rotaract Club of Bangalore"];

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const posterFile = data.poster[0];
            // Format data
            const eventData = {
                ...data,
                poster: null, // Don't save file object
                ticketPrice: Number(data.ticketPrice),
                // totalTickets: Number(data.totalTickets), // Removed as per request
                accessCode: data.accessCode, // Global access code
                clubs: defaultClubs, // For now, static list or could be dynamic
                categories: data.categories.map(cat => cat.name) // Just names now
            };

            await eventService.createEvent(eventData, posterFile);
            navigate('/admin/dashboard');
        } catch (error) {
            console.error(error);
            alert("Failed to create event");
        }
        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8" >
            <h1 className="text-3xl font-bold mb-8">Create New Event</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow">

                {/* Basic Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Event Name</label>
                        <input
                            {...register("name", { required: true })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <input
                            type="date"
                            {...register("date", { required: true })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Time</label>
                        <input
                            type="time"
                            {...register("time", { required: true })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Location</label>
                        <input
                            {...register("location", { required: true })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Ticket Price (₹)</label>
                        <input
                            type="number"
                            {...register("ticketPrice", { required: true, min: 0 })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Access Code</label>
                        <input
                            type="text"
                            {...register("accessCode", { required: true })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                            placeholder="e.g. EVENT2025"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Registration Close Date</label>
                        <input
                            type="date"
                            {...register("registrationCloseDate", { required: true })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        {...register("description", { required: true })}
                        rows={4}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Event Poster</label>
                    <input
                        type="file"
                        accept="image/*"
                        {...register("poster")}
                        className="mt-1 block w-full"
                    />
                </div>

                {/* Scan Categories */}
                <div className="border-t pt-4">
                    <h3 className="text-lg font-medium mb-4">QR Scan Categories</h3>
                    <p className="text-sm text-gray-500 mb-4">Define check-in points (e.g., Entry, Lunch).</p>

                    {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-4 mb-2">
                            <input
                                {...register(`categories.${index}.name`)}
                                placeholder="Category Name (e.g. Lunch)"
                                className="flex-1 rounded-md border-gray-300 shadow-sm border p-2"
                            />
                            <button type="button" onClick={() => remove(index)} className="text-red-600">Remove</button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => append({ name: "" })}
                        className="mt-2 text-sm text-indigo-600 hover:text-indigo-900"
                    >
                        + Add Category
                    </button>
                </div>

                <div className="flex justify-end pt-5">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/dashboard')}
                        className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        {loading ? 'Creating...' : 'Create Event'}
                    </button>
                </div>
            </form>
        </div >
    );
}
