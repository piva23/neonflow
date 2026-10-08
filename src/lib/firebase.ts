/**
 * Firebase Adapter — NeonFlow (Music Player)
 * 
 * Simple Firebase initialization. Authentication state managed via AuthGate component.
 */

// Check if Firebase config exists - exact name expected by AuthGate.tsx
export const isFirebaseConfigured = () => !!import.meta.env.VITE_FIREBASE_API_KEY;

// Initialize Firebase App if configured, get auth and firestore
let authInstance = null;
let dbInstance = null;

if (isFirebaseConfigured()) {
  import('firebase/app').then(firebase => {
    const app = firebase.initializeApp({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    });
    authInstance = firebase.getAuth ? firebase.getAuth(app) : null;
    dbInstance = firebase.getFirestore ? firebase.getFirestore(app) : null;
  });
}

// Export auth instance - exact name expected by AuthGate.tsx
export const auth = authInstance;

// Export db instance
export const db = dbInstance;