export const auth = { currentUser: null };
export const db = {};
export const storage = {};

// Helper to simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Auth Mocks ---

export const onAuthStateChanged = (authObj, callback) => {
    const savedUser = localStorage.getItem('mock_user');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        authObj.currentUser = user;
        callback(user);
    } else {
        callback(null);
    }
    return () => { };
};

export const signInWithEmailAndPassword = async (authObj, email, password) => {
    await delay(500);
    if (email === 'admin@rotaract.com' && password === 'admin123') {
        const user = { uid: 'admin_1', email, displayName: 'Admin User' };
        localStorage.setItem('mock_user', JSON.stringify(user));
        authObj.currentUser = user;

        // Ensure admin user doc exists
        const users = JSON.parse(localStorage.getItem('rotaract_users') || '{}');
        if (!users['admin_1']) {
            users['admin_1'] = { uid: 'admin_1', email, role: 'admin', name: 'Admin User' };
            localStorage.setItem('rotaract_users', JSON.stringify(users));
        }

        // Trigger reload to update auth state listener (simple hack for mock)
        window.location.reload();
        return { user };
    }
    // Check registered users
    const users = JSON.parse(localStorage.getItem('rotaract_users') || '{}');
    const foundUser = Object.values(users).find(u => u.email === email); // In reality password should be checked
    if (foundUser) {
        localStorage.setItem('mock_user', JSON.stringify(foundUser));
        authObj.currentUser = foundUser;
        window.location.reload();
        return { user: foundUser };
    }

    throw new Error("Invalid credentials (Mock: try admin@rotaract.com / admin123)");
};

export const createUserWithEmailAndPassword = async (authObj, email, password) => {
    await delay(500);
    const uid = 'user_' + Date.now();
    const user = { uid, email };
    localStorage.setItem('mock_user', JSON.stringify(user));
    authObj.currentUser = user;
    // window.location.reload(); // Context usually handles this by receiving the user object return
    return { user };
};

export const signOut = async (authObj) => {
    await delay(200);
    localStorage.removeItem('mock_user');
    authObj.currentUser = null;
    window.location.reload();
};

// --- Firestore Mocks ---

export const collection = (db, path) => ({ path });
export const doc = (db, path, id) => ({ path, id: id || 'new_' + Date.now() });
export const serverTimestamp = () => new Date().toISOString();

export const getDoc = async (docRef) => {
    await delay(200);
    const collectionName = docRef.path.split('/')[0]; // Simple parsing
    const id = docRef.id;

    const storeKey = `rotaract_${collectionName}`; // e.g., rotaract_users
    const data = JSON.parse(localStorage.getItem(storeKey) || '{}');
    const docData = data[id];

    return {
        exists: () => !!docData,
        data: () => docData,
        id
    };
};

export const setDoc = async (docRef, data) => {
    await delay(200);
    const collectionName = docRef.path.split('/')[0]; // e.g. "users" from "users/uid"
    // Handle "users" vs other collections. 
    // If docRef was created with doc(db, "users", uid), path is "users", id is uid.
    // Wait, earlier I implemented doc as returning {path, id}. 
    // If usage is doc(db, "users", "123"), path is "users", id is "123".

    const storeKey = `rotaract_${collectionName}`;
    const storeData = JSON.parse(localStorage.getItem(storeKey) || '{}');

    storeData[docRef.id] = { ...data, id: docRef.id };
    localStorage.setItem(storeKey, JSON.stringify(storeData));
};

export const addDoc = async (collectionRef, data) => {
    await delay(200);
    const collectionName = collectionRef.path;
    const id = 'doc_' + Date.now();

    const storeKey = `rotaract_${collectionName}`;
    const storeData = JSON.parse(localStorage.getItem(storeKey) || '{}');

    storeData[id] = { ...data, id };
    localStorage.setItem(storeKey, JSON.stringify(storeData));

    return { id };
};

export const updateDoc = async (docRef, data) => {
    await delay(200);
    const collectionName = docRef.path; // This might be wrong if docRef comes from doc(). 
    // Let's rely on how doc() is constructed.
    // If doc is created via doc(db, 'coll', 'id'), path should be 'coll'. 

    const storeKey = `rotaract_${collectionName}`;
    const storeData = JSON.parse(localStorage.getItem(storeKey) || '{}');

    if (storeData[docRef.id]) {
        storeData[docRef.id] = { ...storeData[docRef.id], ...data };
        localStorage.setItem(storeKey, JSON.stringify(storeData));
    } else {
        throw new Error("Document not found");
    }
};

export const deleteDoc = async (docRef) => {
    await delay(200);
    const collectionName = docRef.path;
    const storeKey = `rotaract_${collectionName}`;
    const storeData = JSON.parse(localStorage.getItem(storeKey) || '{}');

    delete storeData[docRef.id];
    localStorage.setItem(storeKey, JSON.stringify(storeData));
};

export const getDocs = async (queryRef) => {
    await delay(200);
    // queryRef is just a collection ref or query object in our mock
    const collectionName = queryRef.path;
    const storeKey = `rotaract_${collectionName}`;
    const storeData = JSON.parse(localStorage.getItem(storeKey) || '{}');

    const docs = Object.values(storeData).map(d => ({
        id: d.id,
        data: () => d
    }));

    return { docs };
};

export const query = (collectionRef, ...constraints) => {
    // We ignore constraints for this simple mock
    return collectionRef;
};

export const where = () => { };
export const orderBy = () => { };


// --- Storage Mocks ---

export const ref = (storage, path) => ({ path });
export const uploadBytes = async (ref, file) => {
    await delay(500);
    return { ref };
};
export const getDownloadURL = async (ref) => {
    return "https://via.placeholder.com/300"; // Dummy image
};
