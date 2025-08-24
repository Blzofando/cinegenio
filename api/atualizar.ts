// api/cron.ts
import { updateWeeklyRelevantsIfNeeded } from '@services/WeeklyRelevantsUpdateService';
import { updateRelevantReleasesIfNeeded } from '@services/RelevantRadarUpdateService';
import { updateTMDbRadarCacheIfNeeded } from '@services/TMDbRadarUpdateService';
import { getWeeklyChallenge } from '@services/ChallengeService';
import { AllManagedWatchedData , ManagedWatchedItem } from '../../src/types';
// import { items } from '...'; // 🔹 Defina ou importe de onde vem "items"
const items: ManagedWatchedItem[] = [];
// Monta dados agrupados
const groupedData: AllManagedWatchedData = (items || []).reduce(
  (acc, item) => {
    const rating = item.rating || 'meh';
    acc[rating].push(item);
    return acc;
  },
  { amei: [], gostei: [], meh: [], naoGostei: [] } as AllManagedWatchedData
);

export default async function handler(req: Request) {
  try {
    try {
      await updateWeeklyRelevantsIfNeeded(groupedData);
    } catch (err) {
      console.error("Falha na atualização silenciosa dos Relevantes da Semana:", err);
    }

    try {
      await getWeeklyChallenge(groupedData);
    } catch (err) {
      console.error("Falha na atualização silenciosa do Desafio Semanal:", err);
    }

    try {
      await updateRelevantReleasesIfNeeded(groupedData);
    } catch (err) {
      console.error("Falha na atualização silenciosa do Radar Relevante:", err);
    }

    try {
      await updateTMDbRadarCacheIfNeeded();
    } catch (err) {
      console.error("Falha na atualização silenciosa do Radar TMDb:", err);
    }

    return new Response('Cron executado com sucesso!', { status: 200 });
  } catch (err) {
    console.error('Erro no cron:', err);
    return new Response('Falha na execução', { status: 500 });
  }
}