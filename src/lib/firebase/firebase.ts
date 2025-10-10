
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore";
import { getMessaging, type Messaging } from "firebase/messaging";

// This will run on the server when the app builds
console.log(
  "[Firebase/server] NEXT_PUBLIC_FIREBASE_PROJECT_ID:",
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
);

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
    !!firebaseConfig.authDomain &&
    !!firebaseConfig.projectId &&
    !!firebaseConfig.storageBucket &&
    !!firebaseConfig.messagingSenderId &&
    !!firebaseConfig.appId;


let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let messaging: Messaging | undefined;

if (isFirebaseConfigured) {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  db = getFirestore(app);
  
  // Check if window is defined (i.e., we are on the client-side)
  if (typeof window !== 'undefined') {
    // This will run in the browser console
    console.log(
      "[Firebase/client] NEXT_PUBLIC_FIREBASE_PROJECT_ID:",
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    );
    messaging = getMessaging(app);
  }

} else {
  console.warn("Firebase configuration is missing or incomplete. The application will run in a limited mode.");
  // Provide mock objects if Firebase is not configured to avoid runtime errors
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
  messaging = undefined;
}

export { app, auth, db, messaging };
