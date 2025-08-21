// src/components/WeeklyRelevantsView.tsx

import React, { useState, useEffect, useContext } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { WatchedDataContext } from '../App';
import { WeeklyRelevants, WeeklyRelevantCategory, WeeklyRelevantItem } from '../types';
import { updateWeeklyRelevantsIfNeeded, weeklyRelevantsCollection } from '../services/WeeklyRelevantsUpdateService';
import { WatchlistContext } from '../contexts/WatchlistContext';
import { WatchProvider, WatchlistItem } from '../types'; // Adiciona WatchProvider e WatchlistItem
import { getTMDbDetails } from '../services/TMDbService'; // Adiciona getTMDbDetails
import { openProviderLinkFromTmdbName } from '../config/providerLinks'; // Adiciona openProviderLinkFromTmdbName

// --- Componentes de Carregamento (Esqueleto) ---

const CardSkeleton = () => (
    <div className="flex-shrink-0 w-40">
        <div className="w-full h-60 rounded-lg bg-gray-700 animate-pulse"></div>
        <div className="w-3/4 h-4 mt-2 rounded bg-gray-700 animate-pulse"></div>
        <div className="w-1/2 h-3 mt-2 rounded bg-gray-700 animate-pulse"></div>
    </div>
);

const CarouselSkeleton = () => (
    <div className="mb-12">
        <div className="h-8 w-1/3 mb-4 rounded bg-gray-700 animate-pulse"></div>
        <div className="flex gap-4">
            {Array.from({ length: 6 }).map((_, index) => <CardSkeleton key={index} />)}
        </div>
    </div>
);

const LoadingState = () => (
    <div>
        <CarouselSkeleton />
        <CarouselSkeleton />
    </div>
);

// --- Componentes do Modal de Detalhes ---
const Modal = ({ children, onClose }: { children: React.ReactNode, onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in-up" onClick={e => e.stopPropagation()}>
            {children}
        </div>
    </div>
);

const WatchProvidersDisplay: React.FC<{ providers: WatchProvider[] }> = ({ providers }) => (
    <div className="flex flex-wrap gap-3">
        {providers.map(p => (
            <button
                key={p.provider_id}
                onClick={() => openProviderLinkFromTmdbName(p.provider_name)}
                title={`Assistir em ${p.provider_name}`}
                className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 rounded-lg"
            >
                <img 
                    src={`https://image.tmdb.org/t/p/w92${p.logo_path}`} 
                    alt={p.provider_name}
                    className="w-12 h-12 rounded-lg object-cover bg-gray-700 transition-transform hover:scale-110"
                />
            </button>
        ))}
    </div>
);

interface DetailsModalProps {
    item: WeeklyRelevantItem;
    onClose: () => void;
    onAddToWatchlist: (item: WeeklyRelevantItem) => void;
    isInWatchlist: boolean;
}
const DetailsModal: React.FC<DetailsModalProps> = ({ item, onClose, onAddToWatchlist, isInWatchlist }) => {
    const [providers, setProviders] = useState<WatchProvider[] | null>(null);
    const [isLoadingProviders, setIsLoadingProviders] = useState(true);

    useEffect(() => {
        getTMDbDetails(item.id, item.tmdbMediaType)
            .then(data => {
                const availableProviders = data?.['watch/providers']?.results?.BR?.flatrate;
                if (availableProviders) {
                    setProviders(availableProviders);
                }
            })
            .catch(err => console.error("Falha ao buscar provedores de streaming", err))
            .finally(() => setIsLoadingProviders(false));
    }, [item.id, item.tmdbMediaType]);

    const year = item.title.match(/\((\d{4})\)/)?.[1];

    return (
        <Modal onClose={onClose}>
            <div className="p-6">
                <div className="flex flex-col sm:flex-row gap-6">
                    <img src={item.posterUrl || 'https://placehold.co/400x600/374151/9ca3af?text=?'} alt={`Pôster de ${item.title}`} className="w-40 h-60 object-cover rounded-lg shadow-md flex-shrink-0 mx-auto sm:mx-0"/>
                    <div className="flex-grow">
                        <h2 className="text-3xl font-bold text-white mb-2">{item.title}</h2>
                        <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mb-4 text-sm text-gray-400">
                            <span>{item.tmdbMediaType === 'movie' ? 'Filme' : 'Série'}</span>
                            {year && <><span>&bull;</span><span>{year}</span></>}
                            <span>&bull;</span>
                            <span>{item.genre}</span>
                        </div>
                        <p className="text-gray-300 text-sm mb-4">{item.synopsis}</p>
                    </div>
                </div>
                {isLoadingProviders ? <div className="h-12 mt-4 bg-gray-700 rounded animate-pulse"></div> : (
                    providers && providers.length > 0 && (
                        <div className="mt-4">
                            <h3 className="text-xl font-semibold text-gray-300 mb-3">Onde Assistir</h3>
                            <WatchProvidersDisplay providers={providers} />
                        </div>
                    )
                )}
                <div className="mt-6 pt-6 border-t border-gray-700 flex flex-col sm:flex-row gap-3">
                    <button onClick={() => onAddToWatchlist(item)} disabled={isInWatchlist} className="w-full sm:w-auto flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed">
                        {isInWatchlist ? 'Já está na Watchlist' : 'Adicionar à Watchlist'}
                    </button>
                    <button onClick={onClose} className="w-full sm:w-auto flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Fechar</button>
                </div>
            </div>
        </Modal>
    );
};

// --- Componentes Visuais ---
const CarouselCard: React.FC<{ item: WeeklyRelevantItem; onClick: (item: WeeklyRelevantItem) => void; }> = ({ item, onClick }) => (
    <div onClick={() => onClick(item)} className="flex-shrink-0 w-40 cursor-pointer group">
        <div className="relative overflow-hidden rounded-lg shadow-lg">
            <img src={item.posterUrl || 'https://placehold.co/400x600/374151/9ca3af?text=?'} alt={`Pôster de ${item.title}`} className="w-full h-60 object-cover transition-transform duration-300 group-hover:scale-105"/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <div className="absolute inset-0 p-3 bg-black/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center text-center">
                <p className="text-white text-xs italic">"{item.reason}"</p>
            </div>
        </div>
        <h3 className="text-white font-bold mt-2 truncate">{item.title}</h3>
        <p className="text-indigo-400 text-sm">{item.genre}</p>
    </div>
);

const Carousel: React.FC<{ category: WeeklyRelevantCategory; onItemClick: (item: WeeklyRelevantItem) => void; }> = ({ category, onItemClick }) => (
    <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">{category.categoryTitle}</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
            {category.items.map(item => <CarouselCard key={item.id} item={item} onClick={onItemClick} />)}
        </div>
    </div>
);


// --- Componente Principal da Tela ---
const WeeklyRelevantsView: React.FC = () => {
    const { data: watchedData } = useContext(WatchedDataContext);
    const { addToWatchlist, isInWatchlist } = useContext(WatchlistContext);
    const [weeklyData, setWeeklyData] = useState<WeeklyRelevants | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<WeeklyRelevantItem | null>(null);

    useEffect(() => {
        updateWeeklyRelevantsIfNeeded(watchedData);

        const docRef = doc(weeklyRelevantsCollection, 'currentList');
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setWeeklyData(docSnap.data() as WeeklyRelevants);
            } else {
                setWeeklyData(null);
            }
            setIsLoading(false);
        }, (error) => {
            console.error("Erro ao ouvir a lista de Relevantes da Semana:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [watchedData]);

    const handleAddToWatchlist = (item: WeeklyRelevantItem) => {
        const watchlistItem: WatchlistItem = {
            id: item.id,
            tmdbMediaType: item.tmdbMediaType,
            title: item.title,
            posterUrl: item.posterUrl,
            addedAt: Date.now()
        };
        addToWatchlist(watchlistItem);
        setSelectedItem(null); // Fecha o modal após adicionar
    };

    const renderContent = () => {
        if (isLoading) {
            return <LoadingState />;
        }
        if (!weeklyData || weeklyData.categories.length === 0) {
            return (
                <div className="text-center py-16">
                    <p className="text-2xl text-gray-400">Analisando seu perfil...</p>
                    <p className="text-gray-500 mt-2">O Gênio está preparando sua primeira lista semanal de recomendações. Volte em breve!</p>
                </div>
            );
        }
        return weeklyData.categories.map(category => (
            <Carousel key={category.categoryTitle} category={category} onItemClick={setSelectedItem} />
        ));
    };

    return (
        <div className="p-4">
            {selectedItem && (
                <DetailsModal 
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                    onAddToWatchlist={handleAddToWatchlist}
                    isInWatchlist={isInWatchlist(selectedItem.id)}
                />
            )}
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold text-white">Relevantes da Semana</h1>
                <p className="text-lg text-gray-400 mt-2">Uma seleção da IA com base no seu gosto, atualizada toda segunda-feira.</p>
            </div>
            {renderContent()}
        </div>
    );
};

export default WeeklyRelevantsView;