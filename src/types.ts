// src/types.ts (Completo e Reestruturado)

export type MediaType = 'Filme' | 'Série' | 'Anime' | 'Programa';
export type Rating = 'amei' | 'gostei' | 'meh' | 'naoGostei';

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface WatchProviders {
  link: string;
  flatrate?: WatchProvider[];
}

export interface WatchedItem {
  id: number;
  tmdbMediaType: 'movie' | 'tv';
  title: string;
  type: MediaType;
  genre: string;
}

export interface ManagedWatchedItem extends WatchedItem {
  rating: Rating;
  synopsis?: string;
  createdAt: number;
  posterUrl?: string;
  voteAverage?: number;
  watchProviders?: WatchProviders;
}

export interface WatchlistItem {
  id: number;
  tmdbMediaType: 'movie' | 'tv';
  title: string;
  posterUrl?: string;
  addedAt: number;
  loveProbability?: number;
}

export interface ChallengeStep {
    title: string;
    tmdbId: number;
    completed: boolean;
}

export interface Challenge {
    id: string; 
    challengeType: string;
    reason: string;
    status: 'active' | 'completed' | 'lost';
    tmdbId?: number;
    tmdbMediaType?: 'movie' | 'tv';
    title?: string;
    posterUrl?: string;
    steps?: ChallengeStep[];
}

// Tipo para os itens rápidos (Nos Cinemas, Top 10s, Tendências)
export interface TMDbRadarItem {
    id: number;
    tmdbMediaType: 'movie' | 'tv';
    title: string;
    posterUrl?: string;
    releaseDate: string;
    type: 'movie' | 'tv';
    listType: 'now_playing' | 'top_rated_provider' | 'trending'; 
    providerId?: number;
}

// Tipo para os itens relevantes (curados pela IA)
export interface RelevantRadarItem {
    id: number;
    tmdbMediaType: 'movie' | 'tv';
    title: string;
    posterUrl?: string;
    releaseDate: string;
    type: 'movie' | 'tv';
    reason: string;
}


export type AllManagedWatchedData = {
  [key in Rating]: ManagedWatchedItem[];
};

export interface Recommendation {
  id: number;
  tmdbMediaType: 'movie' | 'tv';
  title: string;
  type: MediaType;
  genre: string;
  synopsis: string;
  probabilities: {
    amei: number;
    gostei: number;
    meh: number;
    naoGostei: number;
  };
  analysis: string;
  posterUrl?: string;
}

export interface DuelResult {
    title1: { title: string; posterUrl?: string; analysis: string; probability: number; };
    title2: { title: string; posterUrl?: string; analysis: string; probability: number; };
    verdict: string;
}

export interface TMDbSearchResult {
    id: number;
    title?: string;
    name?: string;
    overview: string;
    popularity: number;
    media_type: 'movie' | 'tv';
    poster_path: string | null;
    genre_ids: number[];
    release_date?: string;
    first_air_date?: string;
}

export type SuggestionFilters = {
    category: MediaType | null;
    genres: string[];
    keywords: string;
};

export enum View {
  MENU,
  RANDOM,
  SUGGESTION,
  PREDICT,
  COLLECTION,
  STATS,
  WATCHLIST,
  DUEL,
  RADAR,
  CHALLENGE,
  CHAT
}