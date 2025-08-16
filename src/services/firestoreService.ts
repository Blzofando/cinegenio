// src/services/firestoreService.ts

import { db } from './firebaseConfig';
import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc, writeBatch } from "firebase/firestore";
import { ManagedWatchedItem, Rating, WatchlistItem, TMDbRadarItem, RelevantRadarItem, Challenge } from '../types';

// --- COLEÇÃO PRINCIPAL (ASSISTIDOS) ---
const WATCHED_COLLECTION_NAME = 'watchedItems';

export const getWatchedItems = async (): Promise<ManagedWatchedItem[]> => {
    const querySnapshot = await getDocs(collection(db, WATCHED_COLLECTION_NAME));
    const items: ManagedWatchedItem[] = [];
    querySnapshot.forEach((doc) => {
        items.push(doc.data() as ManagedWatchedItem);
    });
    return items;
};

export const addWatchedItem = async (itemData: ManagedWatchedItem): Promise<void> => {
    const itemDocRef = doc(db, WATCHED_COLLECTION_NAME, itemData.id.toString());
    await setDoc(itemDocRef, itemData);
};

export const removeWatchedItem = async (id: number): Promise<void> => {
    const itemDocRef = doc(db, WATCHED_COLLECTION_NAME, id.toString());
    await deleteDoc(itemDocRef);
};

export const updateWatchedItem = async (id: number, updatedData: Partial<ManagedWatchedItem>): Promise<void> => {
    const itemDocRef = doc(db, WATCHED_COLLECTION_NAME, id.toString());
    await updateDoc(itemDocRef, updatedData);
};


// --- COLEÇÃO DA WATCHLIST ---
const WATCHLIST_COLLECTION_NAME = 'watchlist';

export const addToWatchlist = async (itemData: WatchlistItem): Promise<void> => {
    const itemDocRef = doc(db, WATCHLIST_COLLECTION_NAME, itemData.id.toString());
    await setDoc(itemDocRef, itemData);
};

export const removeFromWatchlist = async (id: number): Promise<void> => {
    const itemDocRef = doc(db, WATCHLIST_COLLECTION_NAME, id.toString());
    await deleteDoc(itemDocRef);
};

export const updateWatchlistItem = async (id: number, dataToUpdate: Partial<WatchlistItem>): Promise<void> => {
    const itemDocRef = doc(db, WATCHLIST_COLLECTION_NAME, id.toString());
    await updateDoc(itemDocRef, dataToUpdate);
};


// --- COLEÇÕES DO RADAR DE LANÇAMENTOS ---

// Exporta a referência da coleção para que o RadarView possa "ouvi-la"
export const tmdbRadarCacheCollection = collection(db, 'tmdbRadarCache');
export const relevantReleasesCollection = collection(db, 'relevantReleases');

// Funções para a lista rápida (TMDb)
export const getTMDbRadarCache = async (): Promise<TMDbRadarItem[]> => {
    const querySnapshot = await getDocs(tmdbRadarCacheCollection);
    const items: TMDbRadarItem[] = [];
    querySnapshot.forEach((doc) => { items.push(doc.data() as TMDbRadarItem); });
    return items;
};

export const setTMDbRadarCache = async (releases: TMDbRadarItem[]): Promise<void> => {
    const batch = writeBatch(db);
    const oldDocsSnapshot = await getDocs(tmdbRadarCacheCollection);
    oldDocsSnapshot.forEach(document => { batch.delete(document.ref); });
    releases.forEach(release => {
        const uniqueId = `${release.listType}_${release.providerId || ''}_${release.id}`;
        const newDocRef = doc(tmdbRadarCacheCollection, uniqueId);
        batch.set(newDocRef, release);
    });
    await batch.commit();
};

// Funções para a lista relevante (IA)
export const getRelevantReleases = async (): Promise<RelevantRadarItem[]> => {
    const querySnapshot = await getDocs(relevantReleasesCollection);
    const items: RelevantRadarItem[] = [];
    querySnapshot.forEach((doc) => { items.push(doc.data() as RelevantRadarItem); });
    return items;
};

export const setRelevantReleases = async (releases: RelevantRadarItem[]): Promise<void> => {
    const batch = writeBatch(db);
    const oldDocsSnapshot = await getDocs(relevantReleasesCollection);
    oldDocsSnapshot.forEach(document => { batch.delete(document.ref); });
    releases.forEach(release => {
        const newDocRef = doc(relevantReleasesCollection, release.id.toString());
        batch.set(newDocRef, release);
    });
    await batch.commit();
};


// --- COLEÇÃO DOS DESAFIOS kk---
const CHALLENGES_COLLECTION_NAME = 'challenges';

export const getChallengesHistory = async (): Promise<Challenge[]> => {
    const querySnapshot = await getDocs(collection(db, CHALLENGES_COLLECTION_NAME));
    const items: Challenge[] = [];
    querySnapshot.forEach((doc) => { items.push(doc.data() as Challenge); });
    return items;
};

export const updateChallenge = async (challenge: Challenge): Promise<void> => {
    const challengeRef = doc(db, CHALLENGES_COLLECTION_NAME, challenge.id);
    await setDoc(challengeRef, challenge, { merge: true });
};