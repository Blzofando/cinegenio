// src/pages/api/update-tmdb-radar.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { updateTMDbRadarCacheIfNeeded } from '../../services/TMDbRadarUpdateService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Acesso não autorizado.' });
  }

  try {
    await updateTMDbRadarCacheIfNeeded();
    res.status(200).json({ message: 'Radar Geral (TMDb) atualizado com sucesso.' });
  } catch (error) {
    console.error('Erro no Cron Job do Radar TMDb:', error);
    res.status(200).json({ message: 'Processo finalizado (com erro interno, ver logs).' });
  }
}