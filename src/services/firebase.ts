import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { OrbitItem } from '../engine/types';

// Initialize Firebase only if config is present
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

let db = null;
let auth = null;
let analytics = null;
let isInitialized = false;
let currentUser: User | null = null;

if (firebaseConfig.apiKey) {
    if (getApps().length === 0) {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        analytics = getAnalytics(app);
        isInitialized = true;
        console.log('[Firebase] Initialized with Analytics & Auth');

        // Auto-sign in anonymously
        signInAnonymously(auth).catch((error) => {
            console.error('[Firebase] Auth failed. If using Anonymous Auth, check if it is ENABLED in the Firebase Console.', error);
            if (error.code === 'auth/admin-restricted-operation') {
                console.warn('[Firebase] IMPORTANT: You must enable "Anonymous" sign-in provider in Authentication > Sign-in method in the Firebase Console.');
            }
        });

        // Track auth state
        onAuthStateChanged(auth, (user) => {
            currentUser = user;
            if (user) {
                console.log('[Firebase] Signed in as', user.uid);
            } else {
                console.log('[Firebase] Signed out');
            }
        });
    }
} else {
    console.log('[Firebase] Skipping initialization - no config found');
}

export const firebaseService = {
    isAvailable: isInitialized,

    /**
     * Sync complete state to cloud
     * Uses authenticated user ID
     */
    async syncState(items: OrbitItem[]) {
        if (!db || !currentUser) return;

        try {
            await setDoc(doc(db, 'orbits', currentUser.uid), {
                items,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        } catch (e) {
            console.warn('[Firebase] Sync failed', e);
        }
    },

    /**
     * Subscribe to remote changes
     * Waits for auth before setting up listener
     */
    subscribeToRemote(callback: (items: OrbitItem[]) => void) {
        if (!db || !auth) return () => { };

        // If already signed in, subscribe immediately
        if (currentUser) {
            return setupListener(currentUser.uid, callback);
        }

        // Otherwise wait for auth
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                setupListener(user.uid, callback);
            }
        });

        return unsubscribeAuth;
    },

    getUserId() {
        return currentUser?.uid || null;
    }
};

function setupListener(userId: string, callback: (items: OrbitItem[]) => void) {
    return onSnapshot(doc(db, 'orbits', userId), (doc) => {
        const data = doc.data();
        if (data && data.items) {
            callback(data.items as OrbitItem[]);
        }
    });
}
