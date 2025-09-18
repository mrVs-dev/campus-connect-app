// src/lib/firebase/firebase.ts
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

let app: FirebaseApp;
let auth: Auth;

// This function ensures that Firebase is initialized only once and only on the client-side.
function getFirebaseAuth() {
  if (typeof window !== 'undefined' && !auth) {
    // Moved config object inside the function to ensure env vars are available.
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    };

    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    auth = getAuth(app);
  }
  // On the server, we return a placeholder object.
  // The actual auth logic will only run on the client.
  // @ts-ignore
  return auth;
}

export { getFirebaseAuth };
