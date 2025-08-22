// src/pages/api/weekly-update.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getWatchedItems } from '../../services/firestoreService';
import { AllManagedWatchedData, ManagedWatchedItem } from '../../types';

// Importamos TODAS as nossas funções de atualização semanais
import { updateWeeklyRelevantsIfNeeded } from '../../services/WeeklyRelevantsUpdateService';
import { updateRelevantReleasesIfNeeded } from '../../services/RelevantRadarUpdateService';
import { getWeeklyChallenge } from '../../services/ChallengeService';

const getUserData = async (): Promise<AllManagedWatchedData> => {
    const watchedItems: ManagedWatchedItem[] = await getWatchedItems();
    return watchedItems.reduce((acc, item) => {
        const rating = item.rating || 'meh';
        acc[rating].push(item);
        return acc;
    }, { amei: [], gostei: [], meh: [], naoGostei: [] } as AllManagedWatchedData);
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Acesso não autorizado.' });
  }

  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 1 = Segunda, 2 = Terça, 3 = Quarta
  let taskToRun: string | null = null;

  try {
    let userData: AllManagedWatchedData;

    // --- AGENDA SEMANAL INTERCALADA ---

    // TAREFA DE SEGUNDA-FEIRA: Desafio Semanal
    if (dayOfWeek === 1) {
        taskToRun = 'Desafio Semanal';
        console.log(`CRON SEMANAL: É Segunda! Disparando ${taskToRun}...`);
        userData = await getUserData();
        await getWeeklyChallenge(userData);
    }

    // TAREFA DE TERÇA-FEIRA: Relevantes da Semana
    else if (dayOfWeek === 5) {
        taskToRun = 'Relevantes da Semana';
        console.log(`CRON SEMANAL: É Terça! Disparando ${taskToRun}...`);
        userData = await getUserData();
        await updateWeeklyRelevantsIfNeeded(userData);
    }

    // TAREFA DE QUARTA-FEIRA: Radar Relevante (IA)
    else if (dayOfWeek === 3) {
        taskToRun = 'Radar Relevante (IA)';
        console.log(`CRON SEMANAL: É Quarta! Disparando ${taskToRun}...`);
        userData = await getUserData();
        await updateRelevantReleasesIfNeeded(userData);
    }

    if (taskToRun) {
        res.status(200).json({ message: `Tarefa semanal executada com sucesso: ${taskToRun}` });
    } else {
        res.status(200).json({ message: 'Nenhuma tarefa semanal agendada para hoje.' });
    }

  } catch (error) {
    console.error(`Erro no Cron Job Semanal ao executar ${taskToRun}:`, error);
    res.status(500).json({ message: 'Ocorreu um erro no servidor durante a atualização semanal.' });
  }
}