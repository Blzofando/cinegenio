// src/services/TMDbRadarUpdateService.ts

import { db } from './firebaseConfig';
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { TMDbRadarItem, TMDbSearchResult } from '../types';
import { getNowPlayingMovies, getTopRatedOnProvider, getTrending } from './TMDbService';
import { setTMDbRadarCache } from './firestoreService';

const METADATA_DOC_ID = 'tmdbRadarMetadata';
const UPDATE_INTERVAL_DAYS = 1; // Atualiza a cada 1 dia

const shouldUpdate = async (): Promise<boolean> => {
    const metadataRef = doc(db, 'metadata', METADATA_DOC_ID);
    const metadataSnap = await getDoc(metadataRef);

    if (!metadataSnap.exists()) {
        console.log("Metadados do Radar TMDb não encontrados. Primeira atualização necessária.");
        return true;
    }

    const lastUpdate = (metadataSnap.data().lastUpdate as Timestamp).toDate();
    const daysSinceLastUpdate = (new Date().getTime() - lastUpdate.getTime()) / (1000 * 3600 * 24);

    if (daysSinceLastUpdate >= UPDATE_INTERVAL_DAYS) {
        console.log(`Já se passaram ${daysSinceLastUpdate.toFixed(1)} dias. Nova atualização diária do Radar TMDb necessária.`);
        return true;
    }

    console.log(`Cache do Radar TMDb está atualizado. Última atualização há ${daysSinceLastUpdate.toFixed(1)} dias.`);
    return false;
};

const toTMDbRadarItem = (item: TMDbSearchResult, listType: TMDbRadarItem['listType'], providerId?: number): TMDbRadarItem | null => {
    const releaseDate = item.release_date || item.first_air_date;
    if (!releaseDate) return null;
    
    const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
    const fullTitle = item.title || item.name;
    const yearRegex = /\(\d{4}\)/;
    const titleWithYear = yearRegex.test(fullTitle || '') 
        ? fullTitle 
        : `${fullTitle} (${new Date(releaseDate).getFullYear()})`;

    const radarItem: TMDbRadarItem = {
        id: item.id,
        tmdbMediaType: mediaType,
        title: titleWithYear || 'Título Desconhecido',
        releaseDate: releaseDate,
        type: mediaType,
        listType: listType,
    };
    
    if (item.poster_path) {
        radarItem.posterUrl = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
    }
    if (providerId) {
        radarItem.providerId = providerId;
    }
    
    return radarItem;
};

export const updateTMDbRadarCacheIfNeeded = async (): Promise<void> => {
    if (!(await shouldUpdate())) return;

    console.log("Iniciando atualização do cache do Radar TMDb (1 dia)...");

    const PROVIDER_IDS = { netflix: 8, prime: 119, max: 1899, disney: 337 };

    const [
        nowPlayingMovies, 
        trending, 
        topNetflix, 
        topPrime, 
        topMax, 
        topDisney
    ] = await Promise.all([
        getNowPlayingMovies(),
        getTrending(),
        getTopRatedOnProvider(PROVIDER_IDS.netflix),
        getTopRatedOnProvider(PROVIDER_IDS.prime),
        getTopRatedOnProvider(PROVIDER_IDS.max),
        getTopRatedOnProvider(PROVIDER_IDS.disney)
    ]);

    const nowPlayingItems = nowPlayingMovies.map(m => toTMDbRadarItem(m, 'now_playing')).filter((i): i is TMDbRadarItem => !!i);
    const trendingItems = trending.map(t => toTMDbRadarItem(t, 'trending')).filter((i): i is TMDbRadarItem => !!i);
    const netflixItems = topNetflix.map(m => toTMDbRadarItem(m, 'top_rated_provider', PROVIDER_IDS.netflix)).filter((i): i is TMDbRadarItem => !!i);
    const primeItems = topPrime.map(m => toTMDbRadarItem(m, 'top_rated_provider', PROVIDER_IDS.prime)).filter((i): i is TMDbRadarItem => !!i);
    const maxItems = topMax.map(m => toTMDbRadarItem(m, 'top_rated_provider', PROVIDER_IDS.max)).filter((i): i is TMDbRadarItem => !!i);
    const disneyItems = topDisney.map(m => toTMDbRadarItem(m, 'top_rated_provider', PROVIDER_IDS.disney)).filter((i): i is TMDbRadarItem => !!i);

    const allItemsMap = new Map<string, TMDbRadarItem>();
    [...nowPlayingItems, ...trendingItems, ...netflixItems, ...primeItems, ...maxItems, ...disneyItems].forEach(item => {
        if (item) {
            // Cria um ID único composto para evitar colisões entre listas
            const uniqueId = `${item.listType}-${item.providerId || ''}-${item.id}`;
            if (!allItemsMap.has(uniqueId)) {
                allItemsMap.set(uniqueId, item);
            }
        }
    });

    await setTMDbRadarCache(Array.from(allItemsMap.values()));
    await setDoc(doc(db, 'metadata', METADATA_DOC_ID), { lastUpdate: new Date() });

    console.log(`Cache do Radar TMDb atualizado! ${allItemsMap.size} itens salvos.`);
};