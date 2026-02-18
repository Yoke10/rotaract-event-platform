import { db } from './firebaseConfig';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

const CLUBS_COLLECTION = 'clubs';

export const clubService = {
    // Get all clubs
    getClubs: async () => {
        try {
            const q = query(collection(db, CLUBS_COLLECTION), orderBy('name', 'asc'));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error fetching clubs: ", error);
            throw error;
        }
    },

    // Add a new club
    addClub: async (name) => {
        try {
            const newClub = {
                name: name.trim(),
                createdAt: new Date()
            };
            const docRef = await addDoc(collection(db, CLUBS_COLLECTION), newClub);
            return { id: docRef.id, ...newClub };
        } catch (error) {
            console.error("Error adding club: ", error);
            throw error;
        }
    },

    // Delete a club
    deleteClub: async (id) => {
        try {
            await deleteDoc(doc(db, CLUBS_COLLECTION, id));
        } catch (error) {
            console.error("Error deleting club: ", error);
            throw error;
        }
    }
};
