// src/components/PredictView.tsx

import React, { useState, useContext, useMemo, useCallback } from 'react';
import { Recommendation, TMDbSearchResult } from '../types';
import { getPredictionAsRecommendation } from '../services/RecommendationService';
import { WatchedDataContext } from '../App';
import RecommendationCard from './RecommendationCard';
import { searchTMDb } from '../services/TMDbService';

const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center space-y-2 mt-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400"></div>
        <span className="text-lg text-gray-400">Analisando os confins do cinema...</span>
    </div>
);

const PredictView: React.FC = () => {
    const { data: watchedData } = useContext(WatchedDataContext);

    // Novos estados para a busca
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<TMDbSearchResult[]>([]);
    const [selectedSuggestion, setSelectedSuggestion] = useState<TMDbSearchResult | null>(null);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

    const [result, setResult] = useState<Recommendation | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Funções de busca com debounce
    const debounceSearch = useCallback((searchFn: (q: string) => void, delay: number) => {
        let timeoutId: NodeJS.Timeout;
        return (q: string) => { clearTimeout(timeoutId); timeoutId = setTimeout(() => searchFn(q), delay); };
    }, []);

    const fetchSuggestions = async (q: string) => {
        if (q.length < 3) { setSuggestions([]); return; }
        setIsLoadingSuggestions(true);
        try {
            const results = await searchTMDb(q);
            setSuggestions(results.slice(0, 5));
        } catch (err) { console.error(err); } 
        finally { setIsLoadingSuggestions(false); }
    };

    const debouncedFetch = useMemo(() => debounceSearch(fetchSuggestions, 300), [debounceSearch]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = e.target.value;
        setQuery(newQuery);
        setError(null);
        setResult(null);
        debouncedFetch(newQuery);
    };

    const handleSuggestionClick = (suggestion: TMDbSearchResult) => {
        setSelectedSuggestion(suggestion);
        setQuery(suggestion.title || suggestion.name || '');
        setSuggestions([]);
    };

    const handleAnalyze = async () => {
        if (!selectedSuggestion) {
            setError('Por favor, selecione um título da lista para analisar.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            // Chamamos a função passando o objeto com ID e mediaType
            const predictionResult = await getPredictionAsRecommendation({ 
                id: selectedSuggestion.id, 
                mediaType: selectedSuggestion.media_type as 'movie' | 'tv' 
            }, watchedData);
            setResult(predictionResult);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
            console.error(err);
            setError(`Desculpe, não foi possível fazer a análise. ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center p-4 text-center">
            <h1 className="text-4xl font-bold text-white mb-2">Será que vou gostar?</h1>
            <p className="text-lg text-gray-400 mb-8 max-w-2xl">
                Selecione um filme ou série e o CineGênio analisará se tem a ver com seu perfil.
            </p>

            <div className="w-full max-w-lg mb-8">
                {/* Lógica de visualização condicional */}
                {!selectedSuggestion ? (
                    <div className="relative">
                        <input
                            type="text"
                            value={query}
                            onChange={handleInputChange}
                            placeholder="Comece a digitar um título..."
                            className="w-full bg-gray-800 text-white p-4 rounded-lg border-2 border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                        />
                        {isLoadingSuggestions && <div className="absolute right-3 top-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-400"></div></div>}
                        {suggestions.length > 0 && (
                            <ul className="absolute z-10 w-full bg-gray-700 border border-gray-600 rounded-lg mt-1 max-h-80 overflow-y-auto shadow-lg">
                                {suggestions.map(s => (
                                    <li key={s.id} onClick={() => handleSuggestionClick(s)} className="p-3 hover:bg-indigo-600 cursor-pointer flex items-center gap-4">
                                        <img src={s.poster_path ? `https://image.tmdb.org/t/p/w92${s.poster_path}` : 'https://placehold.co/50x75/374151/9ca3af?text=?'} alt="poster" className="w-12 h-[72px] object-cover rounded-md bg-gray-800"/>
                                        <div>
                                            <p className="font-bold text-white">{s.title || s.name}</p>
                                            <p className="text-sm text-gray-400">{s.media_type === 'movie' ? 'Filme' : 'Série'} ({new Date(s.release_date || s.first_air_date || '').getFullYear()})</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ) : (
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                        <div className="flex items-start gap-4">
                            <img src={selectedSuggestion.poster_path ? `https://image.tmdb.org/t/p/w92${selectedSuggestion.poster_path}` : 'https://placehold.co/80x120/374151/9ca3af?text=?'} alt="poster" className="w-20 h-[120px] object-cover rounded-md bg-gray-800"/>
                            <div className="flex-grow text-left">
                                <p className="font-bold text-white text-lg">{selectedSuggestion.title || selectedSuggestion.name}</p>
                                <p className="text-sm text-gray-400">{selectedSuggestion.media_type === 'movie' ? 'Filme' : 'Série'} ({new Date(selectedSuggestion.release_date || selectedSuggestion.first_air_date || '').getFullYear()})</p>
                                <button 
                                    type="button" 
                                    onClick={() => { setSelectedSuggestion(null); setQuery(''); setResult(null); }} 
                                    className="text-xs text-indigo-400 hover:underline mt-2"
                                >
                                    Trocar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <button
                    onClick={handleAnalyze}
                    disabled={isLoading || !selectedSuggestion}
                    className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all transform hover:scale-105 shadow-lg disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Analisando...' : 'Analisar'}
                </button>
            </div>

            {isLoading && <LoadingSpinner />}
            {error && <p className="mt-4 text-red-400 bg-red-900/50 p-4 rounded-lg w-full max-w-lg">{error}</p>}

            {result && !isLoading && (
                <RecommendationCard recommendation={result} />
            )}
        </div>
    );
};

export default PredictView;