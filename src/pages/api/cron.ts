// src/pages/api/cron.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getWatchedItems } from '../../services/firestoreService';
import { AllManagedWatchedData, ManagedWatchedItem, Rating } from '../../types';

// Importamos TODAS as nossas funções de atualização
import { updateWeeklyRelevantsIfNeeded } from '../../services/WeeklyRelevantsUpdateService';
import { updateRelevantReleasesIfNeeded } from '../../services/RelevantRadarUpdateService';
import { updateTMDbRadarCacheIfNeeded } from '../../services/TMDbRadarUpdateService';
import { getWeeklyChallenge } from '../../services/ChallengeService';

// Função auxiliar para buscar e formatar os dados do usuário, evitando repetição de código
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
  // Proteção de segurança
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Acesso não autorizado.' });
  }

  // Pega a data e hora atual no fuso horário UTC, que é o padrão dos servidores
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0 = Domingo, 1 = Segunda, 2 = Terça, etc.
  const hour = now.getUTCHours();

  let tasksRun: string[] = [];

  try {
    // --- A AGENDA DO NOSSO GERENTE ---

    // TAREFA 1: Relevantes da Semana (Segunda-feira às 4h UTC / 01h Brasília)
    if (dayOfWeek === 1 && hour === 4) {
        console.log('CRON: Disparando atualização dos Relevantes da Semana...');
        const watchedData = await getUserData();
        await updateWeeklyRelevantsIfNeeded(watchedData);
        tasksRun.push('Relevantes da Semana');
    }

    // TAREFA 2: Desafio Semanal (Segunda-feira às 3h UTC / 00h Brasília)
    if (dayOfWeek === 1 && hour === 3) {
        console.log('CRON: Disparando atualização do Desafio Semanal...');
        const watchedData = await getUserData();
        await getWeeklyChallenge(watchedData);
        tasksRun.push('Desafio Semanal');
    }

    // TAREFA 3: Radar Relevante (IA) (Segunda-feira às 5h UTC / 02h Brasília)
    if (dayOfWeek === 1 && hour === 5) {
        console.log('CRON: Disparando atualização do Radar Relevante (IA)...');
        const watchedData = await getUserData();
        await updateRelevantReleasesIfNeeded(watchedData);
        tasksRun.push('Radar Relevante (IA)');
    }

    // TAREFA 4: Radar Geral (TMDb) (Todo dia às 8h UTC / 05h Brasília)
    if (hour === 8) {
        console.log('CRON: Disparando atualização do Radar Geral (TMDb)...');
        await updateTMDbRadarCacheIfNeeded();
        tasksRun.push('Radar Geral (TMDb)');
    }

    if (tasksRun.length === 0) {
        res.status(200).json({ message: 'Nenhuma tarefa agendada para esta hora.' });
    } else {
        res.status(200).json({ message: `Tarefas executadas: ${tasksRun.join(', ')}` });
    }

  } catch (error) {
    console.error('Erro durante a execução do Cron Job Mestre:', error);
    res.status(500).json({ message: 'Ocorreu um erro no servidor durante a execução das tarefas agendadas.' });
  }
}