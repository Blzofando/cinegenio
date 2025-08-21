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

            Você é o "CineGênio Pessoal". Sua tarefa é analisar o **PERFIL DE GOSTO DO USUÁRIO** e, considerando a **LISTA DE EXCLUSÃO**, gerar uma lista de **EXATAMENTE 50** filmes e séries JÁ LANÇADOS que sejam altamente relevantes.



            **PERFIL DE GOSTO DO USUÁRIO (Use como inspiração):**

            ${formattedData}



            **LISTA DE EXCLUSÃO (NÃO inclua NENHUM destes títulos na sua resposta):**

            ${formattedData}



            REGRAS CRÍTICAS:

            1. **EXCLUSÃO É PRIORIDADE MÁXIMA:** É absolutamente proibido incluir qualquer título da "LISTA DE EXCLUSÃO".

            2. **CONTEÚDO JÁ LANÇADO:** Apenas títulos que o usuário pode assistir hoje. Sem lançamentos futuros.

            3. **QUANTIDADE E VARIEDADE:** Gere EXATAMENTE 5 categorias criativas, cada uma com 10 títulos, totalizando 50. Pelo menos UMA categoria deve ser exclusivamente de "Séries".

            4. **DADOS COMPLETOS E OBRIGATÓRIOS:** Para cada item, é OBRIGATÓRIO encontrar e fornecer todas as informações do schema, especialmente o \`poster_path\`. Itens sem pôster não são aceitáveis.

            5. **FORMATO JSON:** A resposta DEVE ser um JSON válido, seguindo o schema abaixo.



            **SCHEMA JSON DE RESPOSTA:**

            [

            {

                "categoryTitle": "Nome da Categoria 1",

                "items": [

                { "id": 123, "tmdbMediaType": "movie", "title": "Nome do Filme (Ano)", "poster_path": "/caminho_obrigatorio.jpg", "genre": "Ação", "synopsis": "Breve sinopse do filme.", "reason": "Motivo curto pelo qual este filme é relevante." },

                ...

                ]

            },

            ...

            ]

        `;



        // Aqui precisaríamos de uma nova função no GeminiService para tratar a resposta

        // Por enquanto, vamos simular a chamada e o parse

        const aiResult = await fetchWeeklyRelevants(prompt);



        // Enriquecemos os dados com a URL completa do pôster, com um "plano B" para garantir a imagem

        const finalCategories = await Promise.all(

            aiResult.categories.map(async (category) => {

                const enrichedItems = await Promise.all(

                    category.items.map(async (item) => {

                        let finalPosterPath = item.poster_path;



                        // PLANO B: Se a IA não retornou o pôster, nós buscamos no TMDb.

                        if (!finalPosterPath) {

                            console.log(`Pôster faltando para "${item.title}", buscando no TMDb...`);

                            try {

                                const details = await getTMDbDetails(item.id, item.tmdbMediaType as 'movie' | 'tv');

                                finalPosterPath = details.poster_path;

                            } catch (e) {

                                console.error(`Falha ao buscar pôster para o ID ${item.id}`, e);

                            }

                        }



                        return {

                            ...item,

                            posterUrl: finalPosterPath ? `https://image.tmdb.org/t/p/w500${finalPosterPath}` : undefined,

                        };

                    })

                );



                return {

                    ...category,

                    items: enrichedItems,

                };

            })

        );



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