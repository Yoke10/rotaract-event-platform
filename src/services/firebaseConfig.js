import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyBpEEHfD2WNGzlaEEn2CRj9wXR3ryzgQPA",
    authDomain: "rotaregister.firebaseapp.com",
    projectId: "rotaregister",
    storageBucket: "rotaregister.firebasestorage.app",
    messagingSenderId: "853293617868",
    appId: "1:853293617868:web:c1ca48d439653c70102869"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
