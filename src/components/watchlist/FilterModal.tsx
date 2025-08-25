// src/components/watchlist/FilterModal.tsx

import React from 'react';
import Modal from '../shared/modal';

type SortType = 'addedAt-desc' | 'addedAt-asc' | 'title-asc' | 'title-desc';

interface FilterModalProps { 
    isOpen: boolean; 
    onClose: () => void; 
    tempSortType: SortType; 
    setTempSortType: (sort: SortType) => void; 
    onApply: () => void; 
}

const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, tempSortType, setTempSortType, onApply }) => {
    if (!isOpen) return null;
    const sortOptions: {id: SortType, label: string}[] = [
        {id: 'addedAt-desc', label: 'Mais Recentes'},
        {id: 'addedAt-asc', label: 'Mais Antigos'},
        {id: 'title-asc', label: 'Título (A-Z)'},
        {id: 'title-desc', label: 'Título (Z-A)'}
    ];
    return (
        <Modal onClose={onClose}>
            <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-6">Filtros e Ordenação</h2>
                <div className="space-y-6">
                    <div>
                        <h3 className="font-semibold text-gray-300 mb-3">Ordenar por</h3>
                        <div className="flex flex-wrap gap-2">
                            {sortOptions.map(opt => (
                                <button key={opt.id} onClick={() => setTempSortType(opt.id)} className={`px-3 py-2 text-sm rounded-lg transition-colors ${tempSortType === opt.id ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{opt.label}</button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="mt-8 pt-4 border-t border-gray-700 flex justify-end">
                    <button onClick={onApply} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg">Aplicar</button>
                </div>
            </div>
        </Modal>
    );
};

export default FilterModal;