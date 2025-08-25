import React from 'react';
import { View } from '../types';

interface MainMenuProps {
  setView: (view: View) => void;
}

// --- Componentes de UI para o Novo Design ---

// Card para a visualização em Desktop
const FeatureCard = ({ icon, title, onClick }: { icon: string; title: string; onClick: () => void; }) => (
    <button
        onClick={onClick}
        className="bg-gray-800/50 border border-transparent hover:border-indigo-500 hover:bg-gray-800/80 p-6 rounded-2xl text-left transition-all duration-300 group"
    >
        <div className="text-3xl mb-4 transition-transform duration-300 group-hover:scale-110">{icon}</div>
        <h3 className="font-bold text-white text-lg">{title}</h3>
    </button>
);

// Botão para a visualização em Mobile
const MobileMenuButton = ({ icon, text, onClick }: { icon: string, text: string, onClick: () => void }) => (
    <button
        onClick={onClick}
        className="bg-gray-800/70 hover:bg-indigo-600 text-white font-bold py-4 px-6 rounded-xl w-full flex items-center justify-start space-x-4 transition-all duration-300"
    >
        <span className="text-2xl">{icon}</span>
        <span className="text-lg">{text}</span>
    </button>
);

// Botão para o rodapé
const FooterButton = ({ icon, text, onClick }: { icon: string, text: string, onClick: () => void }) => (
    <button onClick={onClick} className="flex flex-col items-center gap-1 text-gray-400 hover:text-indigo-400 transition-colors">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs font-bold">{text}</span>
    </button>
);

// --- Componente Principal do Menu ---

const MainMenu: React.FC<MainMenuProps> = ({ setView }) => {
  return (
    // Container principal com fundo escuro
    <div className="min-h-screen w-full bg-gradient-to-b from-gray-900 to-black text-white relative overflow-hidden">
        {/* Elemento de fundo decorativo inspirado na imagem de referência */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
            {/* SVG do Rolo de Filme */}
            <svg className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2 text-indigo-800/50 w-32 h-32 rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 2v20h19V2H2.5zM7 2v20M12 2v20M17 2v20M2 7h20M2 12h20M2 17h20"/></svg>
            {/* SVG da Claquete */}
            <svg className="absolute bottom-1/4 right-1/4 transform translate-x-1/2 translate-y-1/2 text-fuchsia-800/50 w-32 h-32 -rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M18.8 9.8L12 16l-6.8-6.2L2 12.2V20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-7.8l-3.2-3.2zM2 6l5 6L12 6l5 6 5-6z"/></svg>
            {/* SVG do Rolo de Filme Rotacionado */}
            <svg className="absolute top-1/2 right-1/3 transform -translate-x-1/2 -translate-y-1/2 text-purple-800/50 w-28 h-28 -rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 2v20h19V2H2.5zM7 2v20M12 2v20M17 2v20M2 7h20M2 12h20M2 17h20"/></svg>
            {/* SVG da Claquete Rotacionada */}
            <svg className="absolute bottom-1/3 left-1/3 transform translate-x-1/2 translate-y-1/2 text-blue-800/50 w-36 h-36 rotate-18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M18.8 9.8L12 16l-6.8-6.2L2 12.2V20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-7.8l-3.2-3.2zM2 6l5 6L12 6l5 6 5-6z"/></svg>
        </div>

        {/* Layout principal que se adapta para desktop e mobile */}
        <div className="relative z-10 min-h-screen flex flex-col p-4">
            
            {/* ---- VISUALIZAÇÃO PARA DESKTOP (TELAS LARGAS) ---- */}
            <div className="hidden lg:flex flex-grow items-center justify-center">
                <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Coluna da Esquerda: Título e Ação Principal */}
                    <div className="text-left">
                        <h1 className="text-6xl font-extrabold tracking-tight">
                            CineGênio <span className="text-indigo-400">Pessoal</span>
                        </h1>
                        <p className="mt-4 text-2xl text-gray-400">Seu assistente de entretenimento pessoal.</p>
                        <button
                            onClick={() => setView(View.CHAT)}
                            className="mt-10 bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-bold py-4 px-10 rounded-full shadow-lg hover:shadow-fuchsia-500/40 transition-all duration-300 transform hover:scale-105 text-xl"
                        >
                           💬 Fale com o Gênio
                        </button>
                    </div>
                    {/* Coluna da Direita: Grid de Funcionalidades */}
                    <div className="grid grid-cols-2 gap-4">
                        <FeatureCard icon="💡" title="Sugestão Personalizada" onClick={() => setView(View.SUGGESTION)} />
                        <FeatureCard icon="🎲" title="Sugestão Aleatória" onClick={() => setView(View.RANDOM)} />
                        <FeatureCard icon="📡" title="Radar de Lançamentos" onClick={() => setView(View.RADAR)} />
                        <FeatureCard icon="🏆" title="Desafio do Gênio" onClick={() => setView(View.CHALLENGE)} />
                        <FeatureCard icon="⚔️" title="Duelo de Títulos" onClick={() => setView(View.DUEL)} />
                        {/* --- BOTÃO ADICIONADO AQUI --- */}
                        <FeatureCard icon="🗓️" title="Relevantes da Semana" onClick={() => setView(View.WEEKLY_RELEVANTS)} />
                    </div>
                </div>
            </div>

            {/* ---- VISUALIZAÇÃO PARA MOBILE (TELAS ESTREITAS) ---- */}
            <div className="lg:hidden flex flex-col flex-grow justify-center text-center">
                <div className="mb-12">
                    <h1 className="text-5xl font-extrabold tracking-tight">
                        CineGênio <span className="text-indigo-400">Pessoal</span>
                    </h1>
                    <p className="mt-4 text-lg text-gray-400">Seu assistente de cinema e séries.</p>
                </div>
                <div className="space-y-3">
                    <MobileMenuButton icon="💬" text="Fale com o Gênio" onClick={() => setView(View.CHAT)} />
                    <MobileMenuButton icon="💡" text="Sugestão Personalizada" onClick={() => setView(View.SUGGESTION)} />
                    <MobileMenuButton icon="📡" text="Radar de Lançamentos" onClick={() => setView(View.RADAR)} />
                    {/* --- BOTÃO ADICIONADO AQUI --- */}
                    <MobileMenuButton icon="🗓️" text="Relevantes da Semana" onClick={() => setView(View.WEEKLY_RELEVANTS)} />
                    <MobileMenuButton icon="🏆" text="Desafio do Gênio" onClick={() => setView(View.CHALLENGE)} />
                    <MobileMenuButton icon="🎲" text="Sugestão Aleatória" onClick={() => setView(View.RANDOM)} />
                    <MobileMenuButton icon="⚔️" text="Duelo de Títulos" onClick={() => setView(View.DUEL)} />
                </div>
            </div>

            {/* Rodapé Fixo (Apenas em telas menores) */}
            <footer className="fixed bottom-0 left-0 w-full bg-gray-800/50 backdrop-blur-md p-4 border-t border-gray-700 z-20 lg:hidden">
                <div className="flex justify-around items-center">
                    <FooterButton icon="📚" text="Minha Coleção" onClick={() => setView(View.COLLECTION)} />
                    <FooterButton icon="📋" text="Watchlist" onClick={() => setView(View.WATCHLIST)} />
                    <FooterButton icon="📊" text="Meus Insights" onClick={() => setView(View.STATS)} />
                </div>
            </footer>

            {/* Rodapé para telas maiores (igual antes) */}
            <footer className="w-full max-w-md mx-auto bg-gray-800/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-700 mt-8 flex-shrink-0 hidden lg:block">
                <div className="flex justify-around items-center">
                    <FooterButton icon="📚" text="Minha Coleção" onClick={() => setView(View.COLLECTION)} />
                    <FooterButton icon="📋" text="Watchlist" onClick={() => setView(View.WATCHLIST)} />
                    <FooterButton icon="📊" text="Meus Insights" onClick={() => setView(View.STATS)} />
                </div>
            </footer>
        </div>
    </div>
  );
};

export default MainMenu;