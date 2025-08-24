export default async function handler(req, res) {
  console.log("Cron executado:", new Date().toISOString());
  
  // Aqui vai sua lógica de atualização
  await atualizarDados();

  res.status(200).json({ sucesso: true, executadoEm: new Date() });
  
}
