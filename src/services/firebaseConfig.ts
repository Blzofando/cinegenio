// src/services/firebaseConfig.ts

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Detecta se está no navegador ou no backend
const isBrowser = typeof window !== 'undefined';

// Usa as variáveis corretas conforme o ambiente
const firebaseConfig = {
  apiKey: isBrowser
    ? import.meta.env.VITE_FIREBASE_API_KEY
    : process.env.FIREBASE_API_KEY,
  authDomain: isBrowser
    ? import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
    : process.env.FIREBASE_AUTH_DOMAIN,
  projectId: isBrowser
    ? import.meta.env.VITE_FIREBASE_PROJECT_ID
    : process.env.FIREBASE_PROJECT_ID,
  storageBucket: isBrowser
    ? import.meta.env.VITE_FIREBASE_STORAGE_BUCKET
    : process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: isBrowser
    ? import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID
    : process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: isBrowser
    ? import.meta.env.VITE_FIREBASE_APP_ID
    : process.env.FIREBASE_APP_ID,
};

// Evita inicializar o Firebase mais de uma vez
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Exporta o Firestore
export const db = getFirestore(app);