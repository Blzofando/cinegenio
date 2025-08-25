// server.ts
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors()); // Permite chamadas do frontend
app.use(express.json()); // Permite ler JSON no body

app.post('/api/testecron', (req, res) => {
  console.log('Recebido:', req.body);
  res.json({ sucesso: true, recebido: req.body });
});

app.listen(PORT, () => {
  console.log(`Servidor backend rodando em http://localhost:${PORT}`);
});