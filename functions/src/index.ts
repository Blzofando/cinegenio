// functions/src/index.ts (VERSÃO FINAL E CORRIGIDA)
// Importamos os tipos que vamos precisar (da cópia que fizemos)
import { AllManagedWatchedData, ManagedWatchedItem } from "./types";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import * as admin from "firebase-admin";

// Inicializa o Firebase Admin
admin.initializeApp();
const db = admin.firestore();


// Importamos as funções de serviço do nosso projeto principal
// ATENÇÃO: Estes caminhos agora apontam para fora da pasta 'functions'
import { updateTMDbRadarCacheIfNeeded } from "../../src/services/TMDbRadarUpdateService";
import { updateRelevantReleasesIfNeeded } from "../../src/services/RelevantRadarUpdateService";
import { updateWeeklyRelevantsIfNeeded } from "../../src/services/WeeklyRelevantsUpdateService";
import { getWeeklyChallenge } from "../../src/services/ChallengeService";

/**
 * Função auxiliar que busca todos os itens assistidos do Firestore e os
 * formata no padrão que nossas funções de serviço esperam.
 */
const getUserData = async (): Promise<AllManagedWatchedData> => {
    const watchedItemsSnapshot = await db.collection('watchedItems').get();
    const watchedItems: ManagedWatchedItem[] = [];
    watchedItemsSnapshot.forEach(doc => {
        watchedItems.push(doc.data() as ManagedWatchedItem);
    });

    return watchedItems.reduce((acc, item) => {
        const rating = item.rating || 'meh';
        acc[rating].push(item);
        return acc;
    }, { amei: [], gostei: [], meh: [], naoGostei: [] } as AllManagedWatchedData);
};


// --- NOSSOS 4 CRON JOBS AGENDADOS (SINTAXE v2 CORRIGIDA) ---

// 1. Radar Geral (TMDb): Todo dia às 06:00 (Brasília)
export const tmdbDailyUpdate = onSchedule({
    schedule: "1 8 * * *",
    timeZone: "America/Sao_Paulo",
}, async (event) => {
    logger.info("Executando atualização diária do Radar TMDb...");
    await updateTMDbRadarCacheIfNeeded();
    logger.info("Atualização diária do Radar TMDb concluída.");
});

// 2. Radar Relevante (IA): Toda Terça-feira às 02:00 (Brasília)
export const radarRelevantUpdate = onSchedule({
    schedule: "0 2 * * 2",
    timeZone: "America/Sao_Paulo",
}, async (event) => {
    logger.info("Atualizando Radar de Relevantes (IA)...");
    const watchedData = await getUserData();
    await updateRelevantReleasesIfNeeded(watchedData);
    logger.info("Atualização do Radar de Relevantes (IA) concluída.");
});

// 3. Relevantes da Semana: Toda Segunda-feira às 00:00 (Brasília)
export const weeklyRelevantsUpdate = onSchedule({
    schedule: "0 0 * * 1",
    timeZone: "America/Sao_Paulo",
}, async (event) => {
    logger.info("Gerando Relevantes da Semana...");
    const watchedData = await getUserData();
    await updateWeeklyRelevantsIfNeeded(watchedData);
    logger.info("Geração dos Relevantes da Semana concluída.");
});

// 4. Desafio do Gênio: Toda Segunda-feira às 00:00 (Brasília)
export const weeklyChallengeUpdate = onSchedule({
    schedule: "0 0 * * 1",
    timeZone: "America/Sao_Paulo",
}, async (event) => {
    logger.info("Criando novo Desafio do Gênio...");
    const watchedData = await getUserData();
    await getWeeklyChallenge(watchedData);
    logger.info("Criação do Desafio do Gênio concluída.");
});