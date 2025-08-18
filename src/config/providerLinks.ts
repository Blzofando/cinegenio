// src/config/providerLinks.ts

export type ProviderDeepLink = {
  scheme: string;   // deep link do app
  fallback: string; // fallback web
};

// 🔗 Mapeamento dos provedores (keys padronizadas)
export const providerDeepLinks: Record<string, ProviderDeepLink> = {
  netflix: { scheme: "nflx://", fallback: "https://www.netflix.com" },
  prime: { scheme: "primevideo://", fallback: "https://www.primevideo.com" },
  disney: { scheme: "disneyplus://", fallback: "https://www.disneyplus.com" },
  star: { scheme: "starplus://", fallback: "https://www.starplus.com" },
  max: { scheme: "hbomax://", fallback: "https://www.max.com" },
  appletv: { scheme: "tv://", fallback: "https://tv.apple.com" },
  paramount: { scheme: "paramountplus://", fallback: "https://www.paramountplus.com" },
  globoplay: { scheme: "globoplay://", fallback: "https://globoplay.globo.com" },
  crunchyroll: { scheme: "crunchyroll://", fallback: "https://www.crunchyroll.com" },
  youtube: { scheme: "vnd.youtube://", fallback: "https://www.youtube.com" },
  claro: { scheme: "clarovideo://", fallback: "https://www.clarovideo.com" },
  looke: { scheme: "looke://", fallback: "https://www.looke.com.br" }
};

// 📝 Mapeamento dos nomes que vêm da API do TMDB para as nossas keys
export const tmdbProviderMap: Record<string, string> = {
  "Netflix": "netflix",
  "Amazon Prime Video": "prime",
  "Disney Plus": "disney",
  "Star Plus": "star",
  "Max": "max",
  "HBO Max": "max",
  "Apple TV Plus": "appletv",
  "Apple TV+": "appletv",
  "Paramount Plus": "paramount",
  "Paramount+": "paramount",
  "Globoplay": "globoplay",
  "Crunchyroll": "crunchyroll",
  "YouTube": "youtube",
  "Claro video": "claro",
  "Looke": "looke",
};

// Função base (separada para organização)
function openProviderLink(providerKey: string) {
  const provider = providerDeepLinks[providerKey];
  if (!provider) {
    console.warn(`Provedor ${providerKey} não mapeado para deep link.`);
    return;
  }
  
  // Tenta redirecionar para o deep link.
  window.location.href = provider.scheme;

  // Define um fallback para o site se o app não responder.
  setTimeout(() => {
    // Se o utilizador ainda estiver na página, significa que o app não abriu.
    // Esta é uma forma simples e eficaz de detetar a falha.
    window.location.href = provider.fallback;
  }, 2000); 
}

// 🚀 Função principal que será usada nos nossos componentes
export function openProviderLinkFromTmdbName(tmdbName: string) {
  const providerKey = tmdbProviderMap[tmdbName];
  if (!providerKey) {
    console.warn(`Provedor "${tmdbName}" não mapeado.`);
    // Se não encontrarmos o provedor no nosso mapa, não fazemos nada.
    return;
  }
  openProviderLink(providerKey);
}