import type { VercelRequest, VercelResponse } from '@vercel/node';
import { updateWeeklyRelevantsIfNeeded } from '../src/services/WeeklyRelevantsUpdateService';
import { updateRelevantReleasesIfNeeded } from '../src/services/RelevantRadarUpdateService';
import { updateTMDbRadarCacheIfNeeded } from '../src/services/TMDbRadarUpdateService';
import { getWeeklyChallenge } from '../src/services/ChallengeService';
import { db } from '../src/services/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { AllManagedWatchedData, ManagedWatchedItem, Rating } from '../src/types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log("Cron executado:", new Date().toISOString());

    // Buscar dados atuais do Firestore (igual no App.tsx)
    const snap = await getDocs(collection(db, 'watchedItems'));
    const items: ManagedWatchedItem[] = [];
    snap.forEach(doc => items.push(doc.data() as ManagedWatchedItem));

    const groupedData = items.reduce((acc, item) => {
      const rating = item.rating || 'meh';
      acc[rating].push(item);
      return acc;
    }, { amei: [], gostei: [], meh: [], naoGostei: [] } as AllManagedWatchedData);

    // Ordenar igual no App
    (Object.keys(groupedData) as Rating[]).forEach(ratingKey => {
      groupedData[ratingKey].sort((a, b) => b.createdAt - a.createdAt);
    });

    // Disparar as mesmas atualizações automáticas
    await updateWeeklyRelevantsIfNeeded(groupedData);
    await getWeeklyChallenge(groupedData);
    await updateRelevantReleasesIfNeeded(groupedData);
    await updateTMDbRadarCacheIfNeeded();

    res.status(200).json({ sucesso: true, mensagem: "Atualizações silenciosas executadas com sucesso." });
  } catch (error) {
    console.error("Erro ao executar cron:", error);
    res.status(500).json({ sucesso: false, erro: (error as Error).message });
  }
}