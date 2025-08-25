// src/components/WeeklyRelevantsView.tsx

import React, { useState, useEffect, useContext } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { WatchedDataContext } from '../App';
import { WeeklyRelevants, WeeklyRelevantCategory, WeeklyRelevantItem, WatchlistItem, DisplayableItem } from '../types';
import { updateWeeklyRelevantsIfNeeded, weeklyRelevantsCollection } from '../services/WeeklyRelevantsUpdateService';
import { WatchlistContext } from '../contexts/WatchlistContext';

// 1. IMPORTAÇÃO DO NOVO MODAL
import DetailsModal from './shared/DetailsModal';


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

// 2. COMPONENTES LOCAIS REMOVIDOS (Modal, WatchProvidersDisplay, DetailsModal)

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
    const [selectedItem, setSelectedItem] = useState<DisplayableItem | null>(null);

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

    const handleAddToWatchlist = (item: DisplayableItem) => {
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

    // 3. NOVA FUNÇÃO PARA RENDERIZAR OS BOTÕES DE AÇÃO
    const renderDetailsModalActions = () => {
        if (!selectedItem) return null;

        const isItemInWatchlist = isInWatchlist(selectedItem.id);

        return (
            <>
                <button 
                    onClick={() => handleAddToWatchlist(selectedItem)} 
                    disabled={isItemInWatchlist} 
                    className="w-full sm:w-auto flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    {isItemInWatchlist ? 'Já está na Watchlist' : 'Adicionar à Watchlist'}
                </button>
                <button 
                    onClick={() => setSelectedItem(null)} 
                    className="w-full sm:w-auto flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg"
                >
                    Fechar
                </button>
            </>
        );
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
            {/* 4. USO DO NOVO MODAL COMPARTILHADO */}
            {selectedItem && (
                <DetailsModal 
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                    actions={renderDetailsModalActions()}
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