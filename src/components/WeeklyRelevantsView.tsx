// src/components/WeeklyRelevantsView.tsx

import React, { useState, useEffect, useContext } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { WatchedDataContext } from '../App';
import { WeeklyRelevants, WeeklyRelevantCategory, WeeklyRelevantItem } from '../types';
import { updateWeeklyRelevantsIfNeeded, weeklyRelevantsCollection } from '../services/WeeklyRelevantsUpdateService';

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


// --- Componentes Visuais ---

const CarouselCard: React.FC<{ item: WeeklyRelevantItem }> = ({ item }) => (
    <div className="flex-shrink-0 w-40 cursor-pointer group">
        <div className="relative overflow-hidden rounded-lg shadow-lg">
            <img src={item.posterUrl || 'https://placehold.co/400x600/374151/9ca3af?text=?'} alt={`Pôster de ${item.title}`} className="w-full h-60 object-cover transition-transform duration-300 group-hover:scale-105"/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            {/* Mostra a razão da IA ao passar o mouse */}
            <div className="absolute inset-0 p-3 bg-black/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center text-center">
                <p className="text-white text-xs italic">"{item.reason}"</p>
            </div>
        </div>
        <h3 className="text-white font-bold mt-2 truncate">{item.title}</h3>
        <p className="text-indigo-400 text-sm">{item.genre}</p>
    </div>
);

const Carousel: React.FC<{ category: WeeklyRelevantCategory }> = ({ category }) => (
    <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-4">{category.categoryTitle}</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
            {category.items.map(item => <CarouselCard key={item.id} item={item} />)}
        </div>
    </div>
);


// --- Componente Principal da Tela ---

const WeeklyRelevantsView: React.FC = () => {
    const { data: watchedData } = useContext(WatchedDataContext);
    const [weeklyData, setWeeklyData] = useState<WeeklyRelevants | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Dispara a verificação e possível atualização em segundo plano
        updateWeeklyRelevantsIfNeeded(watchedData);

        // "Ouve" as atualizações do documento da lista no Firestore
        const docRef = doc(weeklyRelevantsCollection, 'currentList');
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setWeeklyData(docSnap.data() as WeeklyRelevants);
            } else {
                // Se o documento não existe, a IA ainda está gerando a primeira lista
                setWeeklyData(null);
            }
            setIsLoading(false);
        }, (error) => {
            console.error("Erro ao ouvir a lista de Relevantes da Semana:", error);
            setIsLoading(false);
        });

        return () => unsubscribe(); // Limpa o "ouvinte" ao sair da tela
    }, [watchedData]);

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
            <Carousel key={category.categoryTitle} category={category} />
        ));
    };

    return (
        <div className="p-4">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold text-white">Relevantes da Semana</h1>
                <p className="text-lg text-gray-400 mt-2">Uma seleção da IA com base no seu gosto, atualizada toda segunda-feira.</p>
            </div>
            {renderContent()}
        </div>
    );
};

export default WeeklyRelevantsView;