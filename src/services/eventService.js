import { db } from './firebaseConfig';
import { collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, query, where, orderBy, increment } from 'firebase/firestore';


const EVENTS_COLLECTION = 'events';

export const eventService = {
    // Create a new event
    // Create a new event
    createEvent: async (eventData) => {
        try {
            // Removed image upload as per request to fix locking/hanging issues
            // and simplify the form

            const newEvent = {
                ...eventData,
                ticketsSold: 0,
                createdAt: new Date(),
                status: 'active' // or 'draft'
            };

            const docRef = await addDoc(collection(db, EVENTS_COLLECTION), newEvent);
            return docRef.id;
        } catch (error) {
            console.error("Error creating event: ", error);
            throw error;
        }
    },

    // Get all events
    getAllEvents: async () => {
        try {
            const q = query(collection(db, EVENTS_COLLECTION), orderBy('date', 'asc'));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching events: ", error);
            throw error;
        }
    },

    // Get single event
    getEvent: async (id) => {
        try {
            const docRef = doc(db, EVENTS_COLLECTION, id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            } else {
                return null;
            }
        } catch (error) {
            console.error("Error fetching event: ", error);
            throw error;
        }
    },

    // Update event
    updateEvent: async (id, data) => {
        try {
            const docRef = doc(db, EVENTS_COLLECTION, id);
            await updateDoc(docRef, data);
        } catch (error) {
            console.error("Error updating event: ", error);
            throw error;
        }
    },

    // Delete event
    deleteEvent: async (id) => {
        try {
            await deleteDoc(doc(db, EVENTS_COLLECTION, id));
        } catch (error) {
            console.error("Error deleting event: ", error);
            throw error;
        }
    },

    // Create booking
    createBooking: async (bookingData) => {
        try {
            const BOOKINGS_COLLECTION = 'bookings';
            const booking = {
                ...bookingData,
                id: `BKG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                createdAt: new Date().toISOString(),
                status: 'pending_details', // Changed from 'confirmed' to 'pending_details'
                // scanned: false, // Moved to tickets
                // scannedAt: null // Moved to tickets
            };

            // Add booking to Firestore
            const docRef = await addDoc(collection(db, BOOKINGS_COLLECTION), booking);

            // Update event's ticketsSold count
            const eventRef = doc(db, EVENTS_COLLECTION, bookingData.eventId);

            // Get current event to check if ticketsSold exists
            const eventSnap = await getDoc(eventRef);
            if (eventSnap.exists()) {
                const eventData = eventSnap.data();
                // If ticketsSold doesn't exist, initialize it first
                if (typeof eventData.ticketsSold === 'undefined') {
                    await updateDoc(eventRef, { ticketsSold: 0 });
                }
                // Now increment
                await updateDoc(eventRef, {
                    ticketsSold: increment(bookingData.numberOfTickets || 1)
                });
            }

            return { ...booking, firestoreId: docRef.id };
        } catch (error) {
            console.error("Error creating booking: ", error);
            throw error;
        }
    },

    // Update Internal booking with participant details and generate tickets
    generateTickets: async (bookingId, bookingFirestoreId, participants) => {
        try {
            const TICKETS_COLLECTION = 'tickets';
            const BOOKINGS_COLLECTION = 'bookings';
            const generatedTickets = [];

            // 1. Create a ticket for each participant
            for (const participant of participants) {
                const ticketId = `TKT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                // Critical Validation: Event ID is mandatory
                if (!participant.eventId) {
                    throw new Error(`Ticket generation failed: Missing Event ID for participant ${participant.name}`);
                }

                const ticket = {
                    ticketId: ticketId,
                    bookingId: bookingId,
                    bookingFirestoreId: bookingFirestoreId,
                    eventId: String(participant.eventId).trim(), // Force string and trim
                    eventName: participant.eventName || null,
                    participantName: participant.name || null,
                    participantEmail: participant.email || null,
                    participantMobile: participant.mobile || null,
                    participantClub: participant.club || null,
                    category: participant.category || 'Standard',
                    scanned: false,
                    scannedAt: null,
                    createdAt: new Date().toISOString(),
                    status: 'valid'
                };

                // Firestore throws on undefined, so we must ensure no undefined values
                Object.keys(ticket).forEach(key => ticket[key] === undefined && delete ticket[key]);

                console.log("Creating ticket:", ticket);
                const ticketRef = await addDoc(collection(db, TICKETS_COLLECTION), ticket);
                generatedTickets.push({ ...ticket, firestoreId: ticketRef.id });
            }

            // 2. Update Booking Status to Confirmed
            const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingFirestoreId);
            await updateDoc(bookingRef, {
                status: 'confirmed',
                participants: participants, // Store participant summary in booking too?
                ticketsGenerated: true
            });

            return generatedTickets;
        } catch (error) {
            console.error("Error generating tickets: ", error);
            throw error;
        }
    },

    // Get tickets for an event (for check-in dashboard)
    getEventTickets: async (eventId) => {
        try {
            const TICKETS_COLLECTION = 'tickets';
            const q = query(
                collection(db, TICKETS_COLLECTION),
                where('eventId', '==', eventId)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ firestoreId: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching event tickets: ", error);
            throw error;
        }
    },

    // Get user bookings
    getUserBookings: async (userId) => {
        try {
            const BOOKINGS_COLLECTION = 'bookings';
            const q = query(
                collection(db, BOOKINGS_COLLECTION),
                where('userId', '==', userId)
            );
            const querySnapshot = await getDocs(q);
            const bookings = querySnapshot.docs.map(doc => ({ firestoreId: doc.id, ...doc.data() }));

            // Sort by createdAt in JavaScript to avoid Firestore index requirement
            return bookings.sort((a, b) => {
                const dateA = new Date(a.createdAt || 0);
                const dateB = new Date(b.createdAt || 0);
                return dateB - dateA; // Descending order
            });
        } catch (error) {
            console.error("Error fetching bookings: ", error);
            throw error;
        }
    },

    // Get event bookings
    getEventBookings: async (eventId) => {
        try {
            const BOOKINGS_COLLECTION = 'bookings';
            const q = query(
                collection(db, BOOKINGS_COLLECTION),
                where('eventId', '==', eventId)
            );
            const querySnapshot = await getDocs(q);
            const bookings = querySnapshot.docs.map(doc => ({ firestoreId: doc.id, ...doc.data() }));

            // Sort by createdAt in JavaScript to avoid Firestore index requirement
            return bookings.sort((a, b) => {
                const dateA = new Date(a.createdAt || 0);
                const dateB = new Date(b.createdAt || 0);
                return dateB - dateA; // Descending order
            });
        } catch (error) {
            console.error("Error fetching event bookings: ", error);
            throw error;
        }
    },

    // Get booking by ID (for QR scanner)
    getBookingById: async (bookingId) => {
        try {
            const BOOKINGS_COLLECTION = 'bookings';
            const q = query(
                collection(db, BOOKINGS_COLLECTION),
                where('id', '==', bookingId)
            );
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                return { firestoreId: doc.id, ...doc.data() };
            }
            return null;
        } catch (error) {
            console.error("Error fetching booking: ", error);
            throw error;
        }
    },

    // Get Ticket by ID (For QR Scanner)
    getTicketById: async (ticketId) => {
        try {
            if (!ticketId || typeof ticketId !== 'string' || !ticketId.startsWith('TKT_')) {
                return null; // Fast reject invalid IDs
            }
            const TICKETS_COLLECTION = 'tickets';
            const q = query(
                collection(db, TICKETS_COLLECTION),
                where('ticketId', '==', ticketId.trim())
            );
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const docSnap = querySnapshot.docs[0];
                return { firestoreId: docSnap.id, ...docSnap.data() };
            }
            return null;
        } catch (error) {
            console.error("Error fetching ticket: ", error);
            throw error;
        }
    },

    // Get tickets for a specific booking
    getBookingTickets: async (bookingId) => {
        try {
            const TICKETS_COLLECTION = 'tickets';
            // Query by bookingFirestoreId or bookingId (string). 
            // We store both, but bookingFirestoreId is more reliable if available.
            // Let's try bookingFirestoreId first as we save it in generateTickets
            const q = query(
                collection(db, TICKETS_COLLECTION),
                where('bookingFirestoreId', '==', bookingId)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ firestoreId: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching booking tickets: ", error);
            throw error;
        }
    },

    // Mark ticket as scanned for a specific category/station
    // category must be a plain string (e.g. "Entry", "Lunch")
    markTicketScanned: async (firestoreId, category = 'Entry') => {
        try {
            const TICKETS_COLLECTION = 'tickets';
            const docRef = doc(db, TICKETS_COLLECTION, firestoreId);

            // Sanitize category: must be a plain string, no objects
            const safeCategory = (typeof category === 'string')
                ? category.trim()
                : (category?.name || 'Entry');

            const now = new Date().toISOString();

            // Use dot-notation update to write into the scans map
            // e.g. scans.Entry = "2024-01-01T10:00:00.000Z"
            const updatePayload = {
                [`scans.${safeCategory}`]: now,
                lastScannedCategory: safeCategory,
            };

            // Only update legacy fields if this is an 'Entry' scan
            // This prevents a 'Lunch' scan from falsely marking the ticket as 'Entry' verified
            if (safeCategory === 'Entry') {
                updatePayload.scanned = true;
                updatePayload.scannedAt = now;
            }

            await updateDoc(docRef, updatePayload);
            return { success: true, category: safeCategory, scannedAt: now };
        } catch (error) {
            console.error("Error marking ticket as scanned: ", error);
            throw error;
        }
    },

    // Mark booking as scanned
    markBookingScanned: async (firestoreId) => {
        try {
            const BOOKINGS_COLLECTION = 'bookings';
            const docRef = doc(db, BOOKINGS_COLLECTION, firestoreId);
            await updateDoc(docRef, {
                scanned: true,
                scannedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error("Error marking booking as scanned: ", error);
            throw error;
        }
    }
};
