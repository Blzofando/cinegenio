// src/pages/api/daily-update.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { updateTMDbRadarCacheIfNeeded } from '../../services/TMDbRadarUpdateService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Acesso não autorizado.' });
  }

  try {
    console.log('CRON DIÁRIO: Disparando atualização do Radar Geral (TMDb)...');
    await updateTMDbRadarCacheIfNeeded();
    res.status(200).json({ message: 'Radar Geral (TMDb) atualizado com sucesso.' });
  } catch (error) {
    console.error('Erro no Cron Job Diário:', error);
    res.status(500).json({ message: 'Ocorreu um erro no servidor durante a atualização diária.' });
  }
}