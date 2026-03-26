// Translation utility using LibreTranslate API (free, no API key required)

const LIBRE_TRANSLATE_APIS = [
  "https://libretranslate.com/translate",
  "https://translate.argosopentech.com/translate",
  "https://translate.terraprint.co/translate",
];

const MYMEMORY_API = "https://api.mymemory.translated.net/get";

const MAX_CHUNK_SIZE = 500;

// Helper to split text into chunks while preserving sentence boundaries
function splitIntoChunks(text: string, maxSize: number): string[] {
  const chunks: string[] = [];
  
  // Split by sentences (., !, ?) while keeping the punctuation
  const sentences = text.match(/[^.!?]*[.!?]+/g) || [text];
  let currentChunk = "";
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length <= maxSize) {
      currentChunk += sentence;
    } else {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      if (sentence.length > maxSize) {
        const words = sentence.split(" ");
        currentChunk = "";
        for (const word of words) {
          if (currentChunk.length + word.length + 1 <= maxSize) {
            currentChunk += (currentChunk ? " " : "") + word;
          } else {
            if (currentChunk.trim()) {
              chunks.push(currentChunk.trim());
            }
            currentChunk = word;
          }
        }
      } else {
        currentChunk = sentence;
      }
    }
  }
  
  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

export async function translateText(text: string, targetLang: string = "es"): Promise<string> {
  if (!text || text.trim() === "") return text;
  
  if (targetLang === "en") return text;
  
  if (text.length <= MAX_CHUNK_SIZE) {
    return translateSingle(text, targetLang);
  }
  
  const chunks = splitIntoChunks(text, MAX_CHUNK_SIZE);
  console.log(`[translate] Splitting long text (${text.length} chars) into ${chunks.length} chunks`);
  
  // Translate chunks with a small delay between each to avoid rate limiting
  const translatedChunks: string[] = [];
  for (const chunk of chunks) {
    const translated = await translateSingle(chunk, targetLang);
    translatedChunks.push(translated);
    if (chunks.indexOf(chunk) < chunks.length - 1) {
      await sleep(300);
    }
  }
  
  // Reconstruct the text preserving original structure
  return translatedChunks.join(" ");
}

async function translateSingle(text: string, targetLang: string): Promise<string> {
  for (const api of LIBRE_TRANSLATE_APIS) {
    try {
      const response = await fetch(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: text,
          source: "en",
          target: targetLang,
          format: "text",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.translatedText) {
          return data.translatedText;
        }
      }
    } catch (error) {
      continue;
    }
  }

  return translateWithMyMemory(text, targetLang);
}

async function translateWithMyMemory(text: string, targetLang: string): Promise<string> {
  const maxRetries = 2;
  const baseDelay = 2000; // Longer delay for MyMemory

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const url = `${MYMEMORY_API}?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;
      const response = await fetch(url);

      if (!response.ok) {
        console.log(`[translate/mymemory] API error (attempt ${attempt + 1}): ${response.status}`);
        if (attempt === maxRetries) return text;
        await sleep(baseDelay * Math.pow(2, attempt));
        continue;
      }

      const data = await response.json();

      if (data.responseStatus === 429 || data.responseDetails?.includes("QUOTA")) {
        console.log(`[translate/mymemory] Quota exceeded`);
        return text; // Just return original text instead of failing
      }

      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        return data.responseData.translatedText;
      }

      if (attempt === maxRetries) return text;
      await sleep(baseDelay);

    } catch (error) {
      console.error(`[translate/mymemory] Error (attempt ${attempt + 1}):`, error);
      if (attempt === maxRetries) return text;
      await sleep(baseDelay * Math.pow(2, attempt));
    }
  }

  return text;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Translate array of strings (genres)
export async function translateArray(items: string[], targetLang: string = "es"): Promise<string[]> {
  if (!items || items.length === 0) return items;
  if (targetLang === "en") return items;
  
  // Translate each item sequentially with small delay
  const translated: string[] = [];
  for (const item of items) {
    const t = await translateText(item, targetLang);
    translated.push(t);
    if (items.indexOf(item) < items.length - 1) {
      await sleep(200);
    }
  }
  
  return translated;
}

const genreMap: Record<string, string> = {
  "Role-playing (RPG)": "Rol",
  "Adventure": "Aventura",
  "Action": "Acción",
  "RPG": "Rol",
  "Strategy": "Estrategia",
  "Puzzle": "Puzzle",
  "Shooter": "Disparos",
  "Platform": "Plataformas",
  "Fighting": "Lucha",
  "Sports": "Deportes",
  "Racing": "Carreras",
  "Simulation": "Simulación",
  "Indie": "Indie",
  "Casual": "Casual",
  "Arcade": "Arcade",
  "Hack and slash": "Hack and slash",
  "Visual novel": "Novela visual",
  "Survival": "Supervivencia",
  "Open world": "Mundo abierto",
  "Sandbox": "Sandbox",
  "Point-and-click": "Point-and-click",
  "Roguelike": "Roguelike",
  "Turn-based strategy": "Estrategia por turnos",
  "MOBA": "MOBA",
  "Educational": "Educativo",
  "Family": "Familia",
  "Board game": "Juego de mesa",
  "Party": "Fiesta",
  "Quiz": "Quiz",
  "Trial": "Trial",
  "Narrative": "Narrativa",
  "Music": "Música",
  "Rhythm": "Ritmo",
  "Fitness": "Fitness",
  "Card": "Cartas",
  "Tourism": "Turismo",
  "Business": "Negocios",
  "Drama": "Drama",
  "Science": "Ciencia",
  "Fantasy": "Fantasía",
  "Horror": "Terror",
  "Thriller": "Thriller",
  "Sci-Fi": "Ciencia ficción",
  "战争": "Guerra",
  "战争游戏": "Juego de guerra",
  "Interactive fiction": "Ficción interactiva",
  "MMO": "MMO",
  "Real Time Strategy": "Estrategia en tiempo real",
  "Tactical": "Táctico",
  "Japanese RPG": "RPG Japonés",
  "Western RPG": "RPG Occidental",
  "Multiplayer": "Multijugador",
  "Single player": "Un jugador",
  "MMORPG": "MMORPG",
};

export function mapGenreToSpanish(genre: string): string {
  return genreMap[genre] || genre;
}

export function mapGenresToSpanish(genres: string[]): string[] {
  return genres.map(g => mapGenreToSpanish(g));
}

const gameModeMap: Record<string, string> = {
  "Single player": "Un jugador",
  "Multiplayer": "Multijugador",
  "Co-operative": "Cooperativo",
  "Online Co-op": "Cooperativo en línea",
  "Split-screen": "Pantalla dividida",
  "Massively Multiplayer Online": "Multijugador en línea masivo",
  "MMO": "MMO",
  "Battle Royale": "Battle Royale",
  "Cross-platform multiplayer": "Multijugador multiplataforma",
  "Local Co-op": "Cooperativo local",
  "LAN Co-op": "Cooperativo LAN",
  "Downloadable Content": "Contenido descargable",
  "Steam Achievements": "Logros de Steam",
  "Steam Cloud": "Steam Cloud",
  "Partial Controller Support": "Soporte parcial de controlador",
  "Full controller support": "Soporte completo de controlador",
  "Remote Play on Phone": "Juego remoto en teléfono",
  "Remote Play on Tablet": "Juego remoto en tablet",
  "Remote Play on TV": "Juego remoto en TV",
  "Remote Play Together": "Juego remoto juntos",
};

export function mapGameModeToSpanish(mode: string): string {
  return gameModeMap[mode] || mode;
}

export function mapGameModesToSpanish(modes: string[]): string[] {
  return modes.map(m => mapGameModeToSpanish(m));
}

