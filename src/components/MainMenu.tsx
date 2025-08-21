// src/components/MainMenu.tsx (Novo Design)

import React from 'react';
import { View } from '../types';

interface MainMenuProps {
  setView: (view: View) => void;
}

// Botão principal, com um design mais limpo e responsivo
const MenuButton = ({ icon, text, onClick }: { icon: string, text: string, onClick: () => void }) => (
    <button
      onClick={onClick}
      className="bg-gray-800 hover:bg-indigo-600 text-white font-bold py-3 sm:py-4 px-6 rounded-lg w-full flex items-center justify-start space-x-4 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-lg hover:shadow-indigo-500/50 text-base sm:text-lg"
    >
      <span className="text-xl sm:text-2xl">{icon}</span>
      <span>{text}</span>
    </button>
);

// Botão menor para o rodapé
const FooterButton = ({ icon, text, onClick }: { icon: string, text: string, onClick: () => void }) => (
    <button onClick={onClick} className="flex flex-col items-center gap-1 text-gray-400 hover:text-indigo-400 transition-colors">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs font-bold">{text}</span>
    </button>
);

const MainMenu: React.FC<MainMenuProps> = ({ setView }) => {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      
      <div className="w-full max-w-md text-center flex-grow flex flex-col justify-center">
        <div className="mb-12">
            <h1 className="text-5xl font-extrabold text-white tracking-tight">
            CineGênio <span className="text-indigo-400">Pessoal</span>
            </h1>
            <p className="mt-4 text-lg text-gray-400">Seu assistente de cinema e séries.</p>
        </div>
        <div className="space-y-3">
            <MenuButton icon="💬" text="Fale com o Gênio" onClick={() => setView(View.CHAT)} />
            <MenuButton icon="🎲" text="Sugestão Aleatória" onClick={() => setView(View.RANDOM)} />
            <MenuButton icon="💡" text="Sugestão Personalizada" onClick={() => setView(View.SUGGESTION)} />
            <MenuButton icon="🔮" text="Será que vou gostar?" onClick={() => setView(View.PREDICT)} />
            <MenuButton icon="⚔️" text="Duelo de Títulos" onClick={() => setView(View.DUEL)} />
            <MenuButton icon="📡" text="Radar de Lançamentos" onClick={() => setView(View.RADAR)} />
            <MenuButton icon="🗓️" text="Relevantes da Semana" onClick={() => setView(View.WEEKLY_RELEVANTS)} />
            <MenuButton icon="🏆" text="Desafio do Gênio" onClick={() => setView(View.CHALLENGE)} />
        </div>
      </div>

      <footer className="w-full max-w-md bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl border border-gray-700 mt-8">
        <div className="flex justify-around items-center">
            <FooterButton icon="📚" text="Minha Coleção" onClick={() => setView(View.COLLECTION)} />
            <FooterButton icon="📋" text="Watchlist" onClick={() => setView(View.WATCHLIST)} />
            <FooterButton icon="📊" text="Meus Insights" onClick={() => setView(View.STATS)} />
        </div>
      </footer>
    </div>
  );
};

export default MainMenu;