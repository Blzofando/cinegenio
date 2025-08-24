import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Método não permitido' });
  }

  console.log(`[CRON TESTE] Rota disparada via ${req.method} em ${new Date().toISOString()}`);

  res.status(200).json({
    ok: true,
    message: 'Rota de teste executada com sucesso.',
    method: req.method,
    timestamp: new Date().toISOString()
  });
}