// src/components/watchlist/RouletteModal.tsx

import React from 'react';
import { WatchlistItem } from '../../types';
import Modal from '../shared/modal';

interface RouletteModalProps { 
    item: WatchlistItem | null; 
    onClose: () => void; 
    onSpinAgain: () => void; 
    onMarkAsWatched: (item: WatchlistItem) => void; 
}

const RouletteModal: React.FC<RouletteModalProps> = ({ item, onClose, onSpinAgain, onMarkAsWatched }) => {
    if(!item) return null;
    return (
        <Modal onClose={onClose}>
             <div className="p-6 text-center">
                <img src={item.posterUrl || 'https://placehold.co/400x600/374151/9ca3af?text=?'} alt={`Pôster de ${item.title}`} className="w-48 h-72 object-cover rounded-lg shadow-lg mx-auto mb-4"/>
                <h3 className="text-2xl font-bold text-white">O Gênio escolheu:</h3>
                <p className="text-3xl font-bold text-indigo-400 mb-6">{item.title}</p>
                <div className="mt-6 pt-6 border-t border-gray-700 flex flex-col sm:flex-row gap-3">
                    <button onClick={() => onMarkAsWatched(item)} className="w-full sm:w-auto flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">Já Assisti</button>
                    <button onClick={onSpinAgain} className="w-full sm:w-auto flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Rodar a roleta</button>
                </div>
            </div>
        </Modal>
    )
};

export default RouletteModal;