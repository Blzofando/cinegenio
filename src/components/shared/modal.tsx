// src/components/shared/modal.tsx

import React from 'react';

interface ModalProps {
    children: React.ReactNode;
    onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ children, onClose }) => (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" 
        onClick={onClose}
    >
        <div 
            // Aumentamos a largura e adicionamos uma altura mínima para o modal
            className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] min-h-100 overflow-y-auto animate-fade-in-up" 
            onClick={e => e.stopPropagation()}
        >
            {children}
        </div>
    </div>
);

export default Modal;