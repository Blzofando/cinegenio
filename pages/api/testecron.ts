// Este código é o mais simples possível para testar POST
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return res.status(200).json({ sucesso: true, metodo: 'POST', recebido: req.body });
  }

  if (req.method === 'GET') {
    return res.status(200).json({ sucesso: true, metodo: 'GET' });
  }

  return res.status(405).json({ erro: 'Método não permitido' });
}