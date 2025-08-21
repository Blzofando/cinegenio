// src/services/WeeklyRelevantsUpdateService.ts

import { db } from './firebaseConfig';
import { doc, getDoc, setDoc, Timestamp, collection } from "firebase/firestore";
import { AllManagedWatchedData, WeeklyRelevants } from '../types';
import { formatWatchedDataForPrompt, fetchWeeklyRelevants } from './GeminiService';
import { getTMDbDetails } from './TMDbService';

// Onde salvaremos a lista e os metadados de atualização
const RELEVANTS_COLLECTION_NAME = 'weeklyRelevants';
const METADATA_COLLECTION_NAME = 'metadata';
const METADATA_DOC_ID = 'weeklyRelevantsMetadata';

// Referência à coleção para uso futuro na tela de visualização
export const weeklyRelevantsCollection = collection(db, RELEVANTS_COLLECTION_NAME);

/**
 * Verifica se uma nova lista precisa ser gerada.
 * A lógica é: se a última atualização foi antes da última segunda-feira, atualize.
 */
const shouldUpdate = async (): Promise<boolean> => {
    const metadataRef = doc(db, METADATA_COLLECTION_NAME, METADATA_DOC_ID);
    const metadataSnap = await getDoc(metadataRef);

    if (!metadataSnap.exists()) {
        console.log("Metadados dos Relevantes da Semana não encontrados. Primeira atualização necessária.");
        return true;
    }

    const lastUpdate = (metadataSnap.data().lastUpdate as Timestamp).toDate();

    const today = new Date();
    const lastMonday = new Date(today);
    // Lógica para encontrar a data da última segunda-feira
    lastMonday.setDate(today.getDate() - (today.getDay() + 6) % 7);
    lastMonday.setHours(0, 0, 0, 0);

    if (lastUpdate < lastMonday) {
        console.log("A última atualização foi antes desta segunda-feira. Nova lista de Relevantes da Semana necessária.");
        return true;
    }

    console.log("Cache dos Relevantes da Semana está atualizado.");
    return false;
};

/**
 * A função principal que orquestra a atualização.
 */
export const updateWeeklyRelevantsIfNeeded = async (watchedData: AllManagedWatchedData): Promise<void> => {
    // Se não precisar atualizar, a função para aqui.
    if (!(await shouldUpdate())) {
        return;
    }

    console.log("Iniciando atualização da lista de Relevantes da Semana...");

    try {
        const formattedData = formatWatchedDataForPrompt(watchedData);

        const prompt = `
            Você é o "CineGênio Pessoal". Sua tarefa é gerar uma lista de EXATAMENTE 50 filmes e séries JÁ LANÇADOS que sejam altamente relevantes para o perfil de gosto do usuário.

            REGRAS IMPORTANTES:
            1. EXCLUA terminantemente qualquer título que já esteja na lista de assistidos do usuário.
            2. Foque em títulos que já foram lançados. Não inclua lançamentos futuros.
            3. Agrupe os 50 títulos em EXATAMENTE 5 categorias criativas e interessantes, com 10 TÍTULOS CADA.
            4. Pelo menos UMA das 5 categorias DEVE ser exclusivamente sobre 'Séries'.
            5. A resposta DEVE ser um JSON válido, seguindo a estrutura exata do schema abaixo. Para cada item, use a busca na internet para encontrar as informações pedidas.

            **PERFIL DE GOSTO DO USUÁRIO (NÃO INCLUIR ESTES TÍTULOS):**
            ${formattedData}

            **SCHEMA JSON DE RESPOSTA (um array de 'WeeklyRelevantCategory'):**
            [
            {
                "categoryTitle": "Nome da Categoria 1",
                "items": [
                { "id": 123, "tmdbMediaType": "movie", "title": "Nome do Filme (Ano)", "poster_path": "/caminho_do_poster.jpg", "genre": "Ação", "synopsis": "Breve sinopse do filme.", "reason": "Motivo curto pelo qual este filme é relevante para o usuário." },
                // ... mais 9 itens
                ]
            },
            // ... mais 4 categorias
            ]
        `;

        // Aqui precisaríamos de uma nova função no GeminiService para tratar a resposta
        // Por enquanto, vamos simular a chamada e o parse
        const aiResult = await fetchWeeklyRelevants(prompt);

        // Enriquecemos os dados com a URL completa do pôster
        const finalCategories = aiResult.categories.map(category => ({
            ...category,
            items: category.items.map(item => ({
                ...item,
                posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : undefined,
            }))
        }));

        const weeklyRelevants: WeeklyRelevants = {
            generatedAt: Date.now(),
            categories: finalCategories,
        };

        // Salva a lista completa em um único documento
        const listDocRef = doc(db, RELEVANTS_COLLECTION_NAME, 'currentList');
        await setDoc(listDocRef, weeklyRelevants);

        // Atualiza o carimbo de data/hora da atualização
        const metadataRef = doc(db, METADATA_COLLECTION_NAME, METADATA_DOC_ID);
        await setDoc(metadataRef, { lastUpdate: new Date() });

        console.log(`Relevantes da Semana atualizados! ${finalCategories.flatMap(c => c.items).length} itens salvos.`);

    } catch (error) {
        console.error("Falha ao atualizar a lista de Relevantes da Semana:", error);
    }
};