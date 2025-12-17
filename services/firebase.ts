
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, child } from "firebase/database";

// --- FIREBASE CONFIGURATION (UPDATED) ---
const firebaseConfig = {
  apiKey: "AIzaSyDcFkBP_jfuWAAW8NwUzO0UpcifIcfb6iM",
  authDomain: "iic-nst.firebaseapp.com",
  databaseURL: "https://iic-nst-default-rtdb.firebaseio.com",
  projectId: "iic-nst",
  storageBucket: "iic-nst.appspot.com",
  messagingSenderId: "SENDER_ID", // Optional
  appId: "APP_ID" // Optional
};

let db: any = null;
let isConnected = false;

// Initialize Firebase
try {
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    isConnected = true;
    console.log("🔥 Firebase Initialized Successfully");
} catch (e) {
    console.error("Firebase Init Error:", e);
    isConnected = false;
}

// Helper to sanitize keys (Firebase doesn't like ., #, $, [, ])
const sanitize = (key: string) => key.replace(/[.#$\[\]]/g, '_');

// --- DATABASE FUNCTIONS ---

export const checkFirebaseConnection = (): boolean => {
    return isConnected;
};

export const saveChapterData = async (key: string, data: any) => {
    if (!db) {
        localStorage.setItem(key, JSON.stringify(data)); // Fallback
        return;
    }
    try {
        await set(ref(db, 'content/' + sanitize(key)), data);
    } catch (e) {
        console.error("Firebase Save Error", e);
        localStorage.setItem(key, JSON.stringify(data)); // Fallback
    }
};

export const getChapterData = async (key: string) => {
    // Try LocalStorage first for speed/offline
    const local = localStorage.getItem(key);
    if (local) return JSON.parse(local);

    if (!db) return null;

    try {
        const snapshot = await get(child(ref(db), 'content/' + sanitize(key)));
        if (snapshot.exists()) {
            const val = snapshot.val();
            // Cache it locally for next time
            localStorage.setItem(key, JSON.stringify(val));
            return val;
        }
    } catch (e) {
        console.error("Firebase Read Error", e);
    }
    return null;
};

// Function to bulk save links
export const bulkSaveLinks = async (updates: Record<string, any>) => {
    if (!db) return;
    try {
        // We iterate because we sanitized keys differently
        const promises = Object.keys(updates).map(key => {
            return set(ref(db, 'content/' + sanitize(key)), updates[key]);
        });
        await Promise.all(promises);
    } catch(e) {
        console.error("Bulk Save Error", e);
    }
};
