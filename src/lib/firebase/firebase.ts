
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore";
import { getMessaging, type Messaging } from "firebase/messaging";

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let messaging: Messaging | undefined;

let isFirebaseConfigured = false;

function initFirebase(config: any) {
    // A check to see if the config is populated, but also not with placeholder values.
    isFirebaseConfigured = !!config.apiKey && config.apiKey.includes('AIza');

    if (!isFirebaseConfigured) {
        console.warn("Firebase configuration is missing or incomplete. Please check your environment variables.");
        return { app: {} as FirebaseApp, auth: {} as Auth, db: {} as Firestore, messaging: undefined, isFirebaseConfigured: false };
    }

    if (!getApps().length) {
        app = initializeApp(config);
    } else {
        app = getApp();
    }
    auth = getAuth(app);
    db = getFirestore(app);
    
    if (typeof window !== 'undefined') {
        try {
            messaging = getMessaging(app);
        } catch (e) {
            console.error("Could not initialize Firebase Messaging:", e);
            messaging = undefined;
        }
    }
    
    return { app, auth, db, messaging, isFirebaseConfigured: true };
}


export { app, auth, db, messaging, initFirebase, isFirebaseConfigured };
