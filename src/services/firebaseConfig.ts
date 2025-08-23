import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import * as admin from "firebase-admin";

const isServer = typeof window === 'undefined';

if (isServer) {
    if (!admin.apps.length) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_PRIVATE_KEY as string);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    }
} else {
    if (!getApps().length) {
        const firebaseConfig = {
            apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
            storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
            appId: import.meta.env.VITE_FIREBASE_APP_ID
        };
        initializeApp(firebaseConfig);
    }
}

export const db = isServer ? admin.firestore() : getFirestore();