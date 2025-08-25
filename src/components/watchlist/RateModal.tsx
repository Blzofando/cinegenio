// src/components/watchlist/RateModal.tsx

import React from 'react';
import { WatchlistItem, Rating } from '../../types';
import Modal from '../shared/modal';

const ratingOptions: { rating: Rating; emoji: string; label: string }[] = [
    { rating: 'amei', emoji: '😍', label: 'Amei' },
    { rating: 'gostei', emoji: '👍', label: 'Gostei' },
    { rating: 'meh', emoji: '😐', label: 'Meh' },
    { rating: 'naoGostei', emoji: '👎', label: 'Não Gostei' },
];

interface RateModalProps {
    item: WatchlistItem;
    onRate: (rating: Rating) => void;
    onCancel: () => void;
}

const RateModal: React.FC<RateModalProps> = ({ item, onRate, onCancel }) => {
    return (
        <Modal onClose={onCancel}>
            <div className="bg-gray-800 border-gray-700 p-6 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Você assistiu a "{item.title}"!</h2>
                <p className="text-gray-400 mb-6">O que você achou?</p>
                <div className="flex justify-center gap-2 sm:gap-4 mb-6">
                    {ratingOptions.map(opt => (
                        <button key={opt.rating} onClick={() => onRate(opt.rating)} className="px-4 py-2 text-lg rounded-lg transition-all duration-200 flex flex-col items-center gap-1 w-20 bg-gray-700 hover:bg-indigo-600 text-gray-300 hover:text-white">
                            <span className="text-2xl">{opt.emoji}</span>
                            <span className="text-xs font-bold">{opt.label}</span>
                        </button>
                    ))}
                </div>
                <button onClick={onCancel} className="text-sm text-indigo-400 hover:underline">Cancelar</button>
            </div>
        </Modal>
    );
};

export default RateModal;