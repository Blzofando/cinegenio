async function atualizarDados() {
  console.log("Simulando atualização de dados...");
}

export default async function handler(req: any, res: any) {
  console.log("Cron executado:", new Date().toISOString());
  await atualizarDados();
  res.status(200).json({ sucesso: true });
}