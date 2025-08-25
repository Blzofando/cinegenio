import React, { useState, useContext } from 'react';
import { WatchedDataContext } from '../../App';
import { Rating, TMDbSearchResult } from '../../types';
import Modal from './modal';
import TitleSelector from './TitleSelector';

const ratingOptions: { rating: Rating; emoji: string; label: string }[] = [
    { rating: 'amei', emoji: '😍', label: 'Amei' },
    { rating: 'gostei', emoji: '👍', label: 'Gostei' },
    { rating: 'meh', emoji: '😐', label: 'Meh' },
    { rating: 'naoGostei', emoji: '👎', label: 'Não Gostei' },
];

interface AddModalProps {
    mode: 'watchlist' | 'collection';
    onClose: () => void;
    // A função de submit agora é passada como prop, tornando o modal mais reutilizável
    onSubmit: (item: TMDbSearchResult, rating?: Rating) => Promise<void>;
}

const AddModal: React.FC<AddModalProps> = ({ mode, onClose, onSubmit }) => {
    const [rating, setRating] = useState<Rating>('gostei');
    const [selectedSuggestion, setSelectedSuggestion] = useState<TMDbSearchResult | null>(null);
    const { loading: isAdding } = useContext(WatchedDataContext);
    const [error, setError] = useState('');

    const handleTitleSelect = (selection: TMDbSearchResult | null) => {
        setSelectedSuggestion(selection);
        if (error) setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedSuggestion) {
            setError('Por favor, selecione um título válido da lista de sugestões.');
            return;
        }

        setError('');
        try {
            // Chama a função onSubmit passada pelo componente pai
            await onSubmit(selectedSuggestion, mode === 'collection' ? rating : undefined);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Falha ao adicionar título.');
        }
    };

    const titleText = mode === 'collection' ? 'Adicionar Novo Título' : 'Adicionar à Watchlist';

    return (
        // Usando max-w-xl para um modal mais largo
        <Modal onClose={onClose}>
            <form onSubmit={handleSubmit} className="p-6">
                <h2 className="text-2xl font-bold text-white mb-6 text-center">{titleText}</h2>
                
                <div className="mb-6">
                    <TitleSelector
                        label="Comece a digitar um título..."
                        onTitleSelect={handleTitleSelect}
                    />
                </div>

                {mode === 'collection' && (
                    <div className="my-6">
                        <label className="block text-sm font-medium text-gray-300 mb-3 text-center">Minha Avaliação</label>
                        <div className="flex justify-center gap-2 sm:gap-4">
                            {ratingOptions.map(opt => (
                                <button key={opt.rating} type="button" onClick={() => setRating(opt.rating)} className={`px-4 py-2 text-lg rounded-lg transition-all duration-200 flex flex-col items-center gap-1 w-20 ${rating === opt.rating ? 'bg-indigo-600 text-white scale-110 shadow-lg' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}>
                                    <span className="text-2xl">{opt.emoji}</span>
                                    <span className="text-xs font-bold">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
                
                <div className="flex justify-end gap-3 border-t border-gray-700 pt-4 mt-4">
                    <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                    <button type="submit" disabled={isAdding || !selectedSuggestion} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed">
                        {isAdding ? 'Adicionando...' : 'Adicionar'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AddModal;