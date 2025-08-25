// src/components/shared/DetailsModal.tsx

import React, { useState, useEffect } from 'react';
import { DisplayableItem, WatchProvider } from '../../types';
import { getTMDbDetails, getProviders } from '../../services/TMDbService';
import { openProviderLinkFromTmdbName } from '../../config/providerLinks';

// --- Componentes Internos ---
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

// --- Props do Modal Universal ---
interface DetailsModalProps {
    item: DisplayableItem;
    onClose: () => void;
    actions: React.ReactNode;
    // --- NOVA PROP ADICIONADA ---
    customContent?: React.ReactNode;
}

// --- Componente Principal do Modal ---
const DetailsModal: React.FC<DetailsModalProps> = ({ item, onClose, actions, customContent }) => {
    const [details, setDetails] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!item) return;
        setIsLoading(true);
        
        getTMDbDetails(item.id, item.tmdbMediaType)
            .then(data => setDetails(data))
            .catch(err => console.error(`Falha ao buscar detalhes para o item ${item.id}:`, err))
            .finally(() => setIsLoading(false));

    }, [item]);
    
    const providers = getProviders(details);

    return (
        <Modal onClose={onClose}>
            <div className="p-6">
                <div className="flex flex-col sm:flex-row gap-6">
                    <img src={item.posterUrl || 'https://placehold.co/400x600/374151/9ca3af?text=?'} alt={`Pôster de ${item.title}`} className="w-40 h-60 object-cover rounded-lg shadow-md flex-shrink-0 mx-auto sm:mx-0"/>
                    <div className="flex-grow">
                        <h2 className="text-3xl font-bold text-white mb-2">{item.title}</h2>
                        {isLoading ? (
                            <div className="h-5 bg-gray-700 rounded animate-pulse w-3/4 mb-4"></div>
                        ) : (
                            <div className="flex items-center flex-wrap gap-x-4 gap-y-2 mb-4 text-sm text-gray-400">
                                <span>{details?.media_type === 'movie' ? 'Filme' : 'Série'}</span>
                                <span>&bull;</span>
                                <span>{details?.genres?.[0]?.name || 'N/A'}</span>
                                {details?.vote_average > 0 && (
                                     <><span className="hidden sm:inline">&bull;</span><span className="flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg><span className="font-bold text-white">{details.vote_average.toFixed(1)}</span></span></>
                                )}
                            </div>
                        )}
                        <h3 className="text-lg font-semibold text-gray-300 mt-4 mb-1">Sinopse</h3>
                        {isLoading ? (
                            <div className="space-y-2 mt-4"><div className="h-4 bg-gray-700 rounded animate-pulse w-full"></div><div className="h-4 bg-gray-700 rounded animate-pulse w-5/6"></div></div>
                        ) : (
                            <p className="text-gray-300 text-sm mb-4">{details?.overview || "Sinopse não disponível."}</p>
                        )}
                    </div>
                </div>
                
                {/* --- LOCAL ONDE O CONTEÚDO CUSTOMIZADO SERÁ INSERIDO --- */}
                {customContent}

                {isLoading ? (
                    <div className="h-20 mt-4 bg-gray-700 rounded animate-pulse"></div>
                ) : (
                    providers?.flatrate && providers.flatrate.length > 0 && (
                        <div className="mt-4">
                            <h3 className="text-xl font-semibold text-gray-300 mb-3">Onde Assistir</h3>
                            <WatchProvidersDisplay providers={providers.flatrate} />
                        </div>
                    )
                )}

                <div className="mt-6 pt-6 border-t border-gray-700 flex flex-col sm:flex-row gap-3">
                    {actions}
                </div>
            </div>
        </Modal>
    );
};

export default DetailsModal;