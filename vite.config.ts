import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
        plugins: [react()],
        define: {
            'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
            'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
                // CORREÇÃO: Esta linha diz ao Vite para substituir 'firebase-admin'
                // por um arquivo vazio no build do frontend, resolvendo o erro.
                'firebase-admin': path.resolve(__dirname, './src/empty-module.js'),
            }
        }
    };
});