// src/services/firebaseConfig.server.ts
import dotenv from "dotenv";
dotenv.config();

import admin from "firebase-admin";

function getServiceAccount() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Faltam variáveis de ambiente do Firebase Admin. " +
      "Defina FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY."
    );
  }

  // Corrige quebras de linha quando armazenado como string
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\n/g, "\n");

  return { projectId, clientEmail, privateKey };
}

if (!admin.apps.length) {
  const { projectId, clientEmail, privateKey } = getServiceAccount();

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL || undefined,
  });
}

export const db = admin.firestore();
export type Timestamp = admin.firestore.Timestamp;
