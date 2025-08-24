// api/startApp.ts
import app from '../src/App';

// A função padrão de API no Vercel usando a Web API
export default async function handler(req: Request): Promise<Response> {
  console.log('[CRON] Iniciando app.tsx...');

  try {
    // Executa seu app principal
    await app();

    return new Response(
      JSON.stringify({ ok: true, message: 'app.tsx executado com sucesso' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[ERRO] ao executar app.tsx:', error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}