// src/services/RelevantRadarUpdateService.ts

import { db } from './firebaseConfig';
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { AllManagedWatchedData, RelevantRadarItem, TMDbSearchResult } from '../types';
import { getUpcomingMovies, getOnTheAirTV } from './TMDbService';
import { fetchPersonalizedRadar, formatWatchedDataForPrompt } from './GeminiService';
import { setRelevantReleases } from './firestoreService';

const METADATA_DOC_ID = 'relevantRadarMetadata';
const UPDATE_INTERVAL_DAYS = 7; // Atualiza a cada 7 dias

const shouldUpdate = async (): Promise<boolean> => {
    const metadataRef = doc(db, 'metadata', METADATA_DOC_ID);
    const metadataSnap = await getDoc(metadataRef);

    if (!metadataSnap.exists()) {
        console.log("Metadados do Radar Relevante não encontrados. Primeira atualização necessária.");
        return true;
    }

    const lastUpdate = (metadataSnap.data().lastUpdate as Timestamp)?.toDate() || new Date(0);
    const daysSinceLastUpdate = (new Date().getTime() - lastUpdate.getTime()) / (1000 * 3600 * 24);

    if (daysSinceLastUpdate >= UPDATE_INTERVAL_DAYS) {
        console.log(`Já se passaram ${daysSinceLastUpdate.toFixed(1)} dias. Nova atualização semanal (Relevantes) necessária.`);
        return true;
    }

    console.log(`Cache do Radar Relevante está atualizado. Última atualização há ${daysSinceLastUpdate.toFixed(1)} dias.`);
    return false;
};

// Função auxiliar para converter um resultado do TMDb para o nosso tipo RelevantRadarItem
const toRelevantRadarItem = (item: TMDbSearchResult, reason: string): RelevantRadarItem | null => {
    const releaseDate = item.release_date || item.first_air_date;
    if (!releaseDate) return null;

    const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
    const fullTitle = item.title || item.name;
    const yearRegex = /\(\d{4}\)/;
    const titleWithYear = yearRegex.test(fullTitle || '') 
        ? fullTitle 
        : `${fullTitle} (${new Date(releaseDate).getFullYear()})`;
    
    const radarItem: RelevantRadarItem = {
        id: item.id,
        tmdbMediaType: mediaType,
        title: titleWithYear || 'Título Desconhecido',
        releaseDate: releaseDate,
        type: mediaType,
        reason: reason,
    };

    if (item.poster_path) {
        radarItem.posterUrl = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
    }
    
    return radarItem;
};


export const updateRelevantReleasesIfNeeded = async (watchedData: AllManagedWatchedData): Promise<void> => {
    if (!(await shouldUpdate())) {
        return;
    }

    console.log("Iniciando atualização da lista semanal (Relevantes)...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [upcomingMovies, onTheAirShows] = await Promise.all([getUpcomingMovies(), getOnTheAirTV()]);

    const futureContent = [...upcomingMovies, ...onTheAirShows].filter(item => {
        const releaseDate = new Date(item.release_date || item.first_air_date || '');
        return releaseDate >= today;
    });

    if (futureContent.length === 0) {
        console.log("Nenhum conteúdo futuro encontrado para análise da IA.");
        return;
    }
    
    const releasesForPrompt = futureContent.map(r => `- ${r.title || r.name} (ID: ${r.id})`).join('\n');
    const formattedData = formatWatchedDataForPrompt(watchedData);
    const prompt = `Analise o perfil e a lista de lançamentos e selecione até 20 que sejam mais relevantes.\n\n**PERFIL:**\n${formattedData}\n\n**LANÇAMENTOS:**\n${releasesForPrompt}`;
    
    const aiResult = await fetchPersonalizedRadar(prompt);

    const relevantItems = aiResult.releases
        .map(release => {
            const original = futureContent.find(r => r.id === release.id);
            return original ? toRelevantRadarItem(original, release.reason) : null;
        })
        .filter((item): item is RelevantRadarItem => item !== null);
    
    await setRelevantReleases(relevantItems);
    await setDoc(doc(db, 'metadata', METADATA_DOC_ID), { lastUpdate: new Date() });

    console.log(`Lista semanal (Relevantes) atualizada! ${relevantItems.length} itens salvos.`);
};