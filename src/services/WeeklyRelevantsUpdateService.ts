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
 * A função principal que orquestra a atualização. (VERSÃO ROBUSTA FINAL)
 */
export const updateWeeklyRelevantsIfNeeded = async (watchedData: AllManagedWatchedData): Promise<void> => {
    if (!(await shouldUpdate())) {
        return;
    }

    console.log("Iniciando atualização da lista de Relevantes da Semana...");

    try {
        const formattedData = formatWatchedDataForPrompt(watchedData);

        // 1. PROMPT ATUALIZADO: Pede para a IA focar apenas na seleção de IDs.
        const prompt = `
            Você é o "CineGênio Pessoal". Sua tarefa é analisar o **PERFIL DE GOSTO DO USUÁRIO** e, considerando a **LISTA DE EXCLUSÃO**, gerar uma lista de **EXATAMENTE 50** IDs de filmes e séries JÁ LANÇADOS que sejam altamente relevantes.

            **PERFIL DE GOSTO DO USUÁRIO (Use como inspiração):**
            ${formattedData}

            **LISTA DE EXCLUSÃO (NÃO inclua NENHUM destes títulos na sua resposta):**
            ${formattedData}

            REGRAS CRÍTICAS:
            1. **FOCO NO ID:** Sua única tarefa é selecionar os títulos e retornar seus IDs. Não precisa buscar pôster, sinopse, etc.
            2. **EXCLUSÃO É PRIORIDADE MÁXIMA:** É absolutamente proibido incluir qualquer título da "LISTA DE EXCLUSÃO".
            3. **QUANTIDADE E VARIEDADE:** Gere EXATAMENTE 5 categorias criativas, cada uma com 10 títulos, totalizando 50. Pelo menos UMA categoria deve ser exclusivamente de "Séries".
            4. **FORMATO JSON:** A resposta DEVE ser um JSON válido, seguindo o schema.

            **SCHEMA JSON DE RESPOSTA:**
            [
              {
                "categoryTitle": "Nome da Categoria 1",
                "items": [
                  { "id": 123, "tmdbMediaType": "movie", "reason": "Motivo curto pelo qual este ID é relevante." },
                  ...
                ]
              },
              ...
            ]
        `;

        const aiResult = await fetchWeeklyRelevants(prompt);

        // 2. BUSCA DE DETALHES NO TMDB: Agora nosso código busca os detalhes para cada ID retornado.
        const finalCategories = await Promise.all(
            aiResult.categories.map(async (category) => {
                const enrichedItems = await Promise.all(
                    category.items.map(async (itemFromAI) => {
                        try {
                            const details = await getTMDbDetails(itemFromAI.id, itemFromAI.tmdbMediaType as 'movie' | 'tv');
                            // Construímos nosso objeto final com dados 100% precisos do TMDb
                            return {
                                id: itemFromAI.id,
                                tmdbMediaType: itemFromAI.tmdbMediaType as 'movie' | 'tv',
                                title: details.title || details.name || 'Título não encontrado',
                                posterUrl: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : undefined,
                                genre: details.genres?.[0]?.name || 'Indefinido',
                                synopsis: details.overview || 'Sinopse não disponível.',
                                reason: itemFromAI.reason,
                            };
                        } catch (e) {
                            console.error(`Falha ao buscar detalhes para o ID ${itemFromAI.id}`, e);
                            return null; // Retorna nulo se um ID específico falhar
                        }
                    })
                );

                return {
                    ...category,
                    // Filtramos qualquer item que possa ter falhado na busca de detalhes
                    items: enrichedItems.filter(item => item !== null),
                };
            })
        );

        const weeklyRelevants: WeeklyRelevants = {
            generatedAt: Date.now(),
            categories: finalCategories,
        };

        const listDocRef = doc(weeklyRelevantsCollection, 'currentList');
        await setDoc(listDocRef, weeklyRelevants);

        const metadataRef = doc(db, METADATA_COLLECTION_NAME, METADATA_DOC_ID);
        await setDoc(metadataRef, { lastUpdate: new Date() });

        console.log(`Relevantes da Semana atualizados! ${finalCategories.flatMap(c => c.items).length} itens salvos.`);

    } catch (error) {
        console.error("Falha ao atualizar a lista de Relevantes da Semana:", error);
    }
};