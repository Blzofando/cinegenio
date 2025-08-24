import type { NextApiRequest, NextApiResponse } from 'next';
import { updateWeeklyRelevantsIfNeeded } from '../../src/services/WeeklyRelevantsUpdateService';
import { getWeeklyChallenge } from '../../src/services/ChallengeService';
import { updateRelevantReleasesIfNeeded } from '../../src/services/RelevantRadarUpdateService';
import { updateTMDbRadarCacheIfNeeded } from '../../src/services/TMDbRadarUpdateService';


const watchedData = {
  amei: [],
  gostei: [],
  meh: [],
  naoGostei: []
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[CRON] Disparando atualizações automáticas...');

  try {
    await updateWeeklyRelevantsIfNeeded(watchedData)
      .catch(err => console.error('[ERRO] Relevantes da Semana:', err));

    await getWeeklyChallenge(watchedData)
      .catch(err => console.error('[ERRO] Desafio Semanal:', err));

    await updateRelevantReleasesIfNeeded(watchedData)
      .catch(err => console.error('[ERRO] Radar Relevante IA:', err));

    await updateTMDbRadarCacheIfNeeded()
      .catch(err => console.error('[ERRO] Radar TMDb:', err));

    res.status(200).json({ ok: true, message: 'Atualizações disparadas com sucesso.' });
  } catch (err: any) {
    console.error('[ERRO GERAL]:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
}