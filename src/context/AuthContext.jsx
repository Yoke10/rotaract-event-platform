import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../services/firebaseConfig';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
// import { auth, db, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, doc, getDoc, setDoc } from '../services/mockFirebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log("Logged UID:", user.uid);

                // Check admins collection first (as per user request)
                const adminRef = doc(db, "admins", user.uid);
                const adminSnap = await getDoc(adminRef);

                if (adminSnap.exists()) {
                    console.log("Admin access granted (Session Restored)");
                    setUserRole('admin');
                } else {
                    console.log("Not an admin, checking user role...");
                    // Fallback to checking users collection for normal user role
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        setUserRole(userDoc.data().role || 'user');
                    } else {
                        setUserRole('user');
                    }
                }
                setCurrentUser(user);
            } else {
                setCurrentUser(null);
                setUserRole(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signup = async (email, password, name, mobile) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create user document in 'users' collection
        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            name,
            email,
            mobile,
            role: 'user',
            createdAt: new Date()
        });

        return user;
    };

    const login = async (email, password) => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            const user = result.user;
            console.log("Login Auth Success. UID:", user.uid);

            // Check admins collection
            const adminRef = doc(db, "admins", user.uid);
            const adminSnap = await getDoc(adminRef);

            if (adminSnap.exists()) {
                console.log("Admin access granted (Login)");
                return { user, role: 'admin' };
            } else {
                console.log("Access Denied: Not admin (Login Check)");
                // Valid user but not admin
                const userDoc = await getDoc(doc(db, "users", user.uid));
                const role = userDoc.exists() ? (userDoc.data().role || 'user') : 'user';
                return { user, role };
            }
        } catch (error) {
            console.error("Login Error in Context:", error);
            throw error;
        }
    };

    const googleLogin = async () => {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Check if user exists, if not create
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: user.displayName,
                email: user.email,
                mobile: '', // Google doesn't provide mobile by default
                role: 'user',
                createdAt: new Date(),
                photoURL: user.photoURL
            });
        }

        const role = userDoc.exists() ? userDoc.data().role : 'user';
        return { user, role };
    };

    const logout = () => {
        return signOut(auth);
    };

    const value = {
        currentUser,
        userRole,
        signup,
        login,
        googleLogin,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
