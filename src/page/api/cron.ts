// src/pages/api/cron.ts (VERSÃO FINAL COM AGENDA INTERCALADA)

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getWatchedItems } from '../../services/firestoreService';
import { AllManagedWatchedData, ManagedWatchedItem } from '../../types';

// Importamos TODAS as nossas funções de atualização
import { updateWeeklyRelevantsIfNeeded } from '../../services/WeeklyRelevantsUpdateService';
import { updateRelevantReleasesIfNeeded } from '../../services/RelevantRadarUpdateService';
import { updateTMDbRadarCacheIfNeeded } from '../../services/TMDbRadarUpdateService';
import { getWeeklyChallenge } from '../../services/ChallengeService';

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
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Acesso não autorizado.' });
  }

  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0 = Domingo, 1 = Segunda, 2 = Terça
  const tasksRun: string[] = [];
  let userData: AllManagedWatchedData | null = null;

  try {
    // --- AGENDA DIÁRIA INTELIGENTE ---

    // TAREFA DE SEGUNDA-FEIRA
    if (dayOfWeek === 1) {
        console.log('CRON: É Segunda! Disparando tarefas semanais...');
        userData = await getUserData();
        await getWeeklyChallenge(userData);
        tasksRun.push('Desafio Semanal');
    }

    // TAREFA DE TERÇA-FEIRA
    else if (dayOfWeek === 2) {
        console.log('CRON: É Terça! Disparando tarefas semanais...');
        userData = await getUserData();
        await updateWeeklyRelevantsIfNeeded(userData);
        tasksRun.push('Relevantes da Semana');
    }

    // TAREFA DE QUARTA-FEIRA
    else if (dayOfWeek === 3) {
        console.log('CRON: É Quarta! Disparando tarefas semanais...');
        userData = await getUserData();
        await updateRelevantReleasesIfNeeded(userData);
        tasksRun.push('Radar Relevante (IA)');
    }

    // TAREFAS DOS OUTROS DIAS (QUINTA A DOMINGO)
    else {
        console.log('CRON: Disparando atualização diária do Radar Geral (TMDb)...');
        await updateTMDbRadarCacheIfNeeded();
        tasksRun.push('Radar Geral (TMDb)');
    }

    if (tasksRun.length === 0) {
        res.status(200).json({ message: 'Nenhuma tarefa semanal agendada para hoje.' });
    } else {
        res.status(200).json({ message: `Tarefa executada com sucesso: ${tasksRun.join(', ')}` });
    }

  } catch (error) {
    console.error('Erro durante a execução do Cron Job Mestre:', error);
    res.status(500).json({ message: 'Ocorreu um erro no servidor durante a execução da tarefa agendada.' });
  }
}