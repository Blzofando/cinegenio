// src/pages/api/update-relevants.ts (CORRIGIDO)

import type { VercelRequest, VercelResponse } from '@vercel/node'; // ALTERAÇÃO AQUI
import { updateWeeklyRelevantsIfNeeded } from '../../services/WeeklyRelevantsUpdateService';
import { getWatchedItems } from '../../services/firestoreService';
import { AllManagedWatchedData, ManagedWatchedItem, Rating } from '../../types';

export default async function handler(
  req: VercelRequest, // ALTERAÇÃO AQUI
  res: VercelResponse // ALTERAÇÃO AQUI
) {
  // Proteção com senha (Bearer Token)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Acesso não autorizado.' });
  }

  try {
    console.log('Cron Job acionado: Iniciando busca por dados de usuários...');
    // 1. Buscamos os dados do usuário do Firestore
    const watchedItems: ManagedWatchedItem[] = await getWatchedItems();

    // 2. Formatamos os dados da mesma forma que o App.tsx faz
    const watchedData = watchedItems.reduce((acc, item) => {
        const rating = item.rating || 'meh';
        acc[rating].push(item);
        return acc;
    }, { amei: [], gostei: [], meh: [], naoGostei: [] } as AllManagedWatchedData);

    console.log('Dados do usuário carregados. Disparando a atualização dos Relevantes da Semana...');

    // 3. Chamamos nossa função de atualização com os dados
    await updateWeeklyRelevantsIfNeeded(watchedData);

    console.log('Cron Job: Atualização concluída com sucesso.');
    res.status(200).json({ message: 'Atualização dos Relevantes da Semana concluída com sucesso.' });

  } catch (error) {
    console.error('Erro durante a execução do Cron Job:', error);
    // Enviamos uma resposta de sucesso mesmo em caso de erro para não sobrecarregar a Vercel com retentativas.
    // O erro já foi logado no console do servidor para depuração.
    res.status(200).json({ message: 'Processo finalizado (com erro interno, ver logs).' });
  }
}