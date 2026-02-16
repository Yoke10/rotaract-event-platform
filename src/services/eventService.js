import { db, storage } from './firebaseConfig';
import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, orderBy, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// import { db, storage, collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, orderBy, deleteDoc, ref, uploadBytes, getDownloadURL } from './mockFirebase';

const EVENTS_COLLECTION = 'events';

export const eventService = {
    // Create a new event
    createEvent: async (eventData, posterFile) => {
        try {
            let posterURL = '';
            if (posterFile) {
                const posterRef = ref(storage, `events/${Date.now()}_${posterFile.name}`);
                const uploadResult = await uploadBytes(posterRef, posterFile);
                posterURL = await getDownloadURL(uploadResult.ref);
            }

            const newEvent = {
                ...eventData,
                posterURL,
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
                scanned: false,
                scannedAt: null
            };

            const docRef = await addDoc(collection(db, BOOKINGS_COLLECTION), booking);
            return { ...booking, firestoreId: docRef.id };
        } catch (error) {
            console.error("Error creating booking: ", error);
            throw error;
        }
    },

    // Get user bookings
    getUserBookings: async (userId) => {
        try {
            const BOOKINGS_COLLECTION = 'bookings';
            const q = query(
                collection(db, BOOKINGS_COLLECTION),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ firestoreId: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching bookings: ", error);
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
