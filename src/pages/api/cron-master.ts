// src/pages/api/cron-master.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getWatchedItems } from '../../services/firestoreService';
import { AllManagedWatchedData, ManagedWatchedItem } from '../../types';

// Importamos TODAS as nossas funções de atualização
import { updateWeeklyRelevantsIfNeeded } from '../../services/WeeklyRelevantsUpdateService';
import { updateRelevantReleasesIfNeeded } from '../../services/RelevantRadarUpdateService';
import { updateTMDbRadarCacheIfNeeded } from '../../services/TMDbRadarUpdateService';
import { getWeeklyChallenge } from '../../services/ChallengeService';

// Função auxiliar para buscar os dados do usuário, pois o servidor não tem o contexto do App
const getUserData = async (): Promise<AllManagedWatchedData> => {
    const watchedItems: ManagedWatchedItem[] = await getWatchedItems();
    return watchedItems.reduce((acc, item) => {
        const rating = item.rating || 'meh';
        acc[rating].push(item);
        return acc;
    }, { amei: [], gostei: [], meh: [], naoGostei: [] } as AllManagedWatchedData);
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Proteção para garantir que só a Vercel (ou alguém com a senha) possa rodar esta função
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Acesso não autorizado.' });
  }

  const now = new Date();
  // getUTCDay() é importante pois o servidor da Vercel roda em UTC. 
  // Domingo = 0, Segunda = 1, Terça = 2, Quarta = 3, etc.
  const dayOfWeek = now.getUTCDay(); 
  let taskRun: string | null = null;

  try {
    let userData: AllManagedWatchedData;

    // --- A AGENDA INTELIGENTE ---

    // SEGUNDA-FEIRA (dayOfWeek === 1)
    if (dayOfWeek === 1) {
        taskRun = 'Desafio Semanal';
        console.log(`CRON MESTRE: É Segunda! Disparando ${taskRun}...`);
        userData = await getUserData();
        await getWeeklyChallenge(userData);
    }
    // TERÇA-FEIRA (dayOfWeek === 2)
    else if (dayOfWeek === 2) {
        taskRun = 'Relevantes da Semana';
        console.log(`CRON MESTRE: É Terça! Disparando ${taskRun}...`);
        userData = await getUserData();
        await updateWeeklyRelevantsIfNeeded(userData);
    }
    // QUARTA-FEIRA (dayOfWeek === 3)
    else if (dayOfWeek === 3) {
        taskRun = 'Radar Relevante (IA)';
        console.log(`CRON MESTRE: É Quarta! Disparando ${taskRun}...`);
        userData = await getUserData();
        await updateRelevantReleasesIfNeeded(userData);
    }
    // OUTROS DIAS (QUINTA, SEXTA, SÁBADO, DOMINGO)
    else {
        taskRun = 'Radar Geral (TMDb)';
        console.log(`CRON MESTRE: Disparando atualização diária do ${taskRun}...`);
        await updateTMDbRadarCacheIfNeeded();
    }

    res.status(200).json({ message: `Tarefa executada com sucesso: ${taskRun}` });

  } catch (error) {
    console.error(`Erro no Cron Job Mestre ao executar ${taskRun || 'tarefa desconhecida'}:`, error);
    res.status(500).json({ message: 'Ocorreu um erro no servidor durante a execução da tarefa agendada.' });
  }
}