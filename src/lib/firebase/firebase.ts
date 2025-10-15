
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore";
import { getMessaging, type Messaging } from "firebase/messaging";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// More robust check to ensure all necessary keys are present
export const isFirebaseConfigured = 
    !!firebaseConfig.apiKey &&
    !!firebaseConfig.projectId;


let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let messaging: Messaging | undefined;

function initializeFirebase() {
    if (!isFirebaseConfigured) {
        console.warn("Firebase configuration is missing or incomplete. Key properties like apiKey or projectId are missing.");
        // Create dummy objects to prevent crashes in the app
        app = {} as FirebaseApp;
        auth = {} as Auth;
        db = {} as Firestore;
        messaging = undefined;
        return;
    }

    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Check if window is defined (i.e., we are on the client-side) to initialize messaging
    if (typeof window !== 'undefined') {
        try {
            messaging = getMessaging(app);
        } catch (e) {
            console.error("Could not initialize Firebase Messaging:", e);
            messaging = undefined;
        }
    }
}

// Call the function to initialize Firebase
initializeFirebase();

export { app, auth, db, messaging };
