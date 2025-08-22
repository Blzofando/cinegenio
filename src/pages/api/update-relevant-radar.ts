// src/pages/api/update-relevant-radar.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { updateRelevantReleasesIfNeeded } from '../../services/RelevantRadarUpdateService';
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

    await updateRelevantReleasesIfNeeded(watchedData);

    res.status(200).json({ message: 'Radar Relevante (IA) atualizado com sucesso.' });
  } catch (error) {
    console.error('Erro no Cron Job do Radar Relevante:', error);
    res.status(200).json({ message: 'Processo finalizado (com erro interno, ver logs).' });
  }
}