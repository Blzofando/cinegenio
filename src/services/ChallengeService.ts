// src/services/ChallengeService.ts

import { db } from './firebaseConfig';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { AllManagedWatchedData, Challenge, ChallengeStep } from '../types';
import { fetchWeeklyChallenge, formatWatchedDataForPrompt } from './GeminiService'; 
import { getTMDbDetails } from './TMDbService';

/**
 * Retorna o identificador único para a semana atual.
 * Ex: "2025-33" (Ano 2025, 33ª semana)
 */
const getCurrentWeekId = (): string => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const day = startOfYear.getDay() > 0 ? startOfYear.getDay() : 7;
    const weekNumber = Math.ceil((((now.getTime() - startOfYear.getTime()) / 86400000) + day) / 7);
    return `${now.getFullYear()}-${weekNumber}`;
};

/**
 * Busca o desafio da semana no Firebase. Se não existir, gera um novo.
 */
export const getWeeklyChallenge = async (watchedData: AllManagedWatchedData): Promise<Challenge> => {
    const weekId = getCurrentWeekId();
    const challengeRef = doc(db, 'challenges', weekId);
    const challengeSnap = await getDoc(challengeRef);

    if (challengeSnap.exists()) {
        return challengeSnap.data() as Challenge;
    }

    console.log("Gerando novo desafio para a semana:", weekId);
    
    const allWatchedTitles = Object.values(watchedData).flat().map(item => item.title).join(', ');
    const currentDate = new Date().toLocaleDateString('pt-BR', { month: 'long', day: 'numeric' });
    const formattedData = formatWatchedDataForPrompt(watchedData);

    const prompt = `Hoje é ${currentDate}. Você é o "CineGênio Pessoal". Sua tarefa é criar um "Desafio Semanal" criativo e temático para um usuário.

**TÍTULOS JÁ ASSISTIDOS (NUNCA SUGERIR):**
${allWatchedTitles}

**REGRAS:**
1.  **Tema Criativo:** Crie um nome de desafio ("challengeType") que seja intrigante (ex: "Maratona do Mestre do Suspense", "Complexidade Cinematográfica", "Viagem aos Anos 80").
2.  **Introdução Divertida:** A razão ("reason") deve ser uma introdução curta, divertida e bem trabalhada, no estilo: "No desafio desta semana, pelo seu apreço por [Gênero/Diretor que ele gosta], vamos explorar 3 filmes que vão quebrar a sua cabeça."
3.  **Passo Único ou Múltiplo:** O desafio pode ser assistir a um único filme ou uma lista de 2 a 7 títulos.
4.  **Conexão com o Gosto:** O desafio deve ter alguma conexão com o que o usuário já ama.

**PERFIL DO USUÁRIO:**
${formattedData}

**Sua Tarefa:**
Gere UM desafio e responda APENAS com o objeto JSON.`;
    
    const challengeIdea = await fetchWeeklyChallenge(prompt);

    // Agora, enriquece cada passo com os detalhes corretos
    const enrichedSteps = await Promise.all(
        challengeIdea.steps!.map(async (step) => {
            const details = await getTMDbDetails(step.tmdbId, step.tmdbMediaType);
            const releaseDate = details.release_date || details.first_air_date;
            const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
            
            return {
                tmdbId: step.tmdbId,
                tmdbMediaType: step.tmdbMediaType,
                title: `${details.title || details.name} (${year})`,
                posterUrl: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : undefined,
                completed: false,
            };
        })
    );

    const newChallenge: Challenge = {
        id: weekId,
        challengeType: challengeIdea.challengeType,
        reason: challengeIdea.reason,
        status: 'active',
        steps: enrichedSteps,
    };

    await setDoc(challengeRef, newChallenge);
    return newChallenge;
};

/**
 * Atualiza um desafio existente no Firebase.
 */
export const updateChallenge = async (challenge: Challenge): Promise<void> => {
    const challengeRef = doc(db, 'challenges', challenge.id);
    await setDoc(challengeRef, challenge, { merge: true });
};