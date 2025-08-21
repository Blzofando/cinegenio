// src/services/GeminiService.ts

import { GoogleGenAI, Type } from "@google/genai";
import { AllManagedWatchedData, ManagedWatchedItem, Recommendation, DuelResult, Challenge } from '../types';

// Exportando esta função para que outros serviços possam usá-la
export const formatWatchedDataForPrompt = (data: AllManagedWatchedData): string => {
    const formatList = (list: ManagedWatchedItem[]) => list.map(item => `- ${item.title} (Tipo: ${item.type}, Gênero: ${item.genre})`).join('\n') || 'Nenhum';
    return `
**Amei (obras que considero perfeitas, alvo principal para inspiração):**
${formatList(data.amei)}

**Gostei (obras muito boas, boas pistas do que faltou para ser 'amei'):**
${formatList(data.gostei)}

**Indiferente (obras que achei medianas, armadilhas a evitar):**
${formatList(data.meh)}

**Não Gostei (obras que não me agradaram, elementos a excluir completamente):**
${formatList(data.naoGostei)}
    `.trim();
};


// --- Schemas da IA ---
const recommendationSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.INTEGER, description: "O ID numérico do TMDb do título recomendado." },
        tmdbMediaType: { type: Type.STRING, enum: ['movie', 'tv'], description: "O tipo de mídia no TMDb ('movie' ou 'tv')." },
        title: { type: Type.STRING, description: "O título oficial do filme/série, incluindo o ano. Ex: 'Interestelar (2014)'" },
        type: { type: Type.STRING, enum: ['Filme', 'Série', 'Anime', 'Programa'], description: "A categoria da mídia." },
        genre: { type: Type.STRING, description: "O gênero principal da mídia. Ex: 'Ficção Científica/Aventura'." },
        synopsis: { type: Type.STRING, description: "Uma sinopse curta e envolvente de 2-3 frases." },
        probabilities: {
            type: Type.OBJECT,
            properties: {
                amei: { type: Type.INTEGER, description: "Probabilidade (0-100) de o usuário AMAR." },
                gostei: { type: Type.INTEGER, description: "Probabilidade (0-100) de o usuário GOSTAR." },
                meh: { type: Type.INTEGER, description: "Probabilidade (0-100) de o usuário achar MEDIANO." },
                naoGostei: { type: Type.INTEGER, description: "Probabilidade (0-100) de o usuário NÃO GOSTAR." }
            },
            required: ["amei", "gostei", "meh", "naoGostei"]
        },
        analysis: { type: Type.STRING, description: "Sua análise detalhada mas curta, explicando por que esta recomendação se encaixa no perfil do usuário." }
    },
    required: ["id", "tmdbMediaType", "title", "type", "genre", "synopsis", "probabilities", "analysis"]
};

const duelSchema = {
    type: Type.OBJECT,
    properties: {
        title1: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                analysis: { type: Type.STRING, description: "Análise detalhada mas curta do porquê o usuário gostaria (ou não) deste título." },
                probability: { type: Type.INTEGER, description: "Probabilidade (0-100) de o usuário preferir este título no confronto." }
            },
            required: ["title", "analysis", "probability"]
        },
        title2: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                analysis: { type: Type.STRING, description: "Análise detalhada mas curta do porquê o usuário gostaria (ou não) deste título." },
                probability: { type: Type.INTEGER, description: "Probabilidade (0-100) de o usuário preferir este título no confronto." }
            },
            required: ["title", "analysis", "probability"]
        },
        verdict: { 
            type: Type.STRING, 
            description: "O veredito final do Gênio. Seja criativo, divertido e um pouco dramático. Declare um vencedor claro. IMPORTANTE: Mantenha o veredito com no máximo 3 frases curtas." 
        }
    },
    required: ["title1", "title2", "verdict"]
};

const radarSchema = {
    type: Type.OBJECT,
    properties: {
        releases: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.INTEGER },
                    tmdbMediaType: { type: Type.STRING, enum: ['movie', 'tv'] },
                    title: { type: Type.STRING },
                    reason: { type: Type.STRING, description: "Uma frase curta explicando por que este lançamento é relevante para o usuário." }
                },
                required: ["id", "tmdbMediaType", "title", "reason"]
            }
        }
    },
    required: ["releases"]
};

const probabilitySchema = {
    type: Type.OBJECT,
    properties: {
        loveProbability: { type: Type.INTEGER, description: "A probabilidade (0-100) de o usuário AMAR o título." }
    },
    required: ["loveProbability"]
};

// NOVO SCHEMA PARA OS RELEVANTES DA SEMANA
const weeklyRelevantsSchema = {
    type: Type.OBJECT,
    properties: {
        categories: {
            type: Type.ARRAY,
            description: "Um array de 5 a 7 categorias.",
            items: {
                type: Type.OBJECT,
                properties: {
                    categoryTitle: { type: Type.STRING, description: "O nome criativo para a categoria." },
                    items: {
                        type: Type.ARRAY,
                        description: "Uma lista de itens de mídia para esta categoria.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.INTEGER, description: "O ID numérico do TMDb." },
                                tmdbMediaType: { type: Type.STRING, enum: ['movie', 'tv'] },
                                title: { type: Type.STRING, description: "O título oficial, incluindo o ano." },
                                poster_path: { type: Type.STRING, description: "O caminho para o pôster do TMDb, ex: /caminho.jpg" },
                                genre: { type: Type.STRING, description: "O gênero principal." },
                                synopsis: { type: Type.STRING, description: "Uma sinopse curta de 1-2 frases." },
                                reason: { type: Type.STRING, description: "Motivo curto pelo qual este item é relevante." }
                            },
                            required: ["id", "tmdbMediaType", "title", "poster_path", "genre", "synopsis", "reason"]
                        }
                    }
                },
                required: ["categoryTitle", "items"]
            }
        }
    },
    required: ["categories"]
};

// SCHEMA DO DESAFIO ATUALIZADO PARA SER MAIS PRECISO
const challengeSchema = {
    type: Type.OBJECT,
    properties: {
        challengeType: { type: Type.STRING, description: "Um nome criativo para o tipo de desafio." },
        reason: { type: Type.STRING, description: "Uma justificativa curta, divertida e bem trabalhada." },
        steps: {
            type: Type.ARRAY,
            description: "Uma lista de 2 a 7 títulos para o desafio.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "O título oficial do filme/série." },
                    tmdbId: { type: Type.INTEGER, description: "O ID numérico do TMDb do título." },
                    tmdbMediaType: { type: Type.STRING, enum: ['movie', 'tv'], description: "O tipo de mídia no TMDb." }
                },
                required: ["title", "tmdbId", "tmdbMediaType"]
            }
        }
    },
    required: ["challengeType", "reason", "steps"]
};


// --- Funções de Chamada à IA ---
export const fetchRecommendation = async (prompt: string): Promise<Omit<Recommendation, 'posterUrl'>> => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
        return { id: 129, tmdbMediaType: 'movie', title: "Mock: A Viagem de Chihiro (2001)", type: 'Anime', genre: "Animação/Fantasia", synopsis: "Mock synopsis", probabilities: { amei: 85, gostei: 10, meh: 4, naoGostei: 1 }, analysis: "Mock analysis" };
    }
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY as string });
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: recommendationSchema }});
    return JSON.parse(response.text.trim());
};

// NOVA FUNÇÃO PARA OS RELEVANTES DA SEMANA
export const fetchWeeklyRelevants = async (prompt: string): Promise<{ categories: any[] }> => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
        // Mock de segurança caso a API Key não esteja configurada
        return { categories: [{"categoryTitle":"Ação Inteligente","items":[{"id":27205,"tmdbMediaType":"movie","title":"A Origem (2010)","poster_path":"/9e3Dz7aCANy5ahtlF5K8LgL6e0A.jpg","genre":"Ação","synopsis":"Dom Cobb é um ladrão que rouba informações...","reason":"Baseado no seu gosto por ficção científica complexa."}]}] };
    }
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY as string });
    const response = await ai.models.generateContent({ 
        model: "gemini-2.5-flash", // Usando um modelo robusto para a tarefa complexa
        contents: prompt, 
        config: { responseMimeType: "application/json", responseSchema: weeklyRelevantsSchema }
    });
    return JSON.parse(response.text.trim());
};

export const fetchDuelAnalysis = async (prompt: string): Promise<DuelResult> => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
        return { title1: { title: "Mock 1", analysis: "Análise 1", probability: 80 }, title2: { title: "Mock 2", analysis: "Análise 2", probability: 70 }, verdict: "Veredito Mock" };
    }
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY as string });
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: duelSchema }});
    return JSON.parse(response.text.trim());
};

export const fetchPersonalizedRadar = async (prompt: string): Promise<{ releases: { id: number; tmdbMediaType: 'movie' | 'tv'; title: string; reason: string; }[] }> => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
        return { releases: [] };
    }
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY as string });
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: radarSchema }});
    return JSON.parse(response.text.trim());
};

export const fetchBestTMDbMatch = async (prompt: string): Promise<number | null> => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
        return null;
    }
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY as string });
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { tools: [{googleSearch: {}}] }});
    const text = response.text.trim();
    const parsedId = parseInt(text, 10);
    return !isNaN(parsedId) ? parsedId : null;
};

export const fetchLoveProbability = async (prompt: string): Promise<number> => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
        return Math.floor(Math.random() * 31) + 70;
    }
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY as string });
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: probabilitySchema }
    });
    const result = JSON.parse(response.text.trim()) as { loveProbability: number };
    return result.loveProbability;
};

// FUNÇÃO DO DESAFIO ATUALIZADA
export const fetchWeeklyChallenge = async (prompt: string): Promise<Omit<Challenge, 'id' | 'status'>> => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
        // Mock para desenvolvimento com um desafio de múltiplos passos
        return { 
            challengeType: "Maratona Clássicos do Terror", 
            reason: "Você adora suspense, mas que tal explorar as raízes do terror com estes clássicos?",
            steps: [
                { title: "O Exorcista (1973)", tmdbId: 9552, tmdbMediaType: 'movie', completed: false },
                { title: "O Iluminado (1980)", tmdbId: 694, tmdbMediaType: 'movie', completed: false },
                { title: "Psicose (1960)", tmdbId: 539, tmdbMediaType: 'movie', completed: false },
            ]
        };
    }

    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY as string });
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: challengeSchema }
    });

    // A resposta da IA já virá no formato correto, mas precisamos garantir os tipos
    const result = JSON.parse(response.text.trim());
    return result as Omit<Challenge, 'id' | 'status'>;
};