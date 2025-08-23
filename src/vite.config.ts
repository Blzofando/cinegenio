import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react'; // Adicionei o plugin do React, que é padrão

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
        plugins: [react()], // Mantemos os plugins
        define: {
            'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
            'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
                // ALTERAÇÃO: Adicionamos esta linha para corrigir o erro
                'firebase-admin': path.resolve(__dirname, './src/empty-module.js'),
            }
        }
    };
});