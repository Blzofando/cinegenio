// src/pages/api/update-challenge.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getWeeklyChallenge } from '../../services/ChallengeService';
import { getWatchedItems } from '../../services/firestoreService';
import { AllManagedWatchedData, ManagedWatchedItem, Rating } from '../../types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Acesso não autorizado.' });
  }

  try {
    const watchedItems: ManagedWatchedItem[] = await getWatchedItems();
    const watchedData = watchedItems.reduce((acc, item) => {
        const rating = item.rating || 'meh';
        acc[rating].push(item);
        return acc;
    }, { amei: [], gostei: [], meh: [], naoGostei: [] } as AllManagedWatchedData);

    // A própria função getWeeklyChallenge já tem a lógica de criar um novo se não existir.
    await getWeeklyChallenge(watchedData);

    res.status(200).json({ message: 'Verificação/criação do Desafio Semanal concluída.' });
  } catch (error) {
    console.error('Erro no Cron Job do Desafio Semanal:', error);
    res.status(200).json({ message: 'Processo finalizado (com erro interno, ver logs).' });
  }
}