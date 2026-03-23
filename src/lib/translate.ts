// Translation utility using MyMemory API (free, no API key required)
// Handles long texts by splitting into chunks

const MYMEMORY_API = "https://api.mymemory.translated.net/get";

// Maximum characters per request for MyMemory
const MAX_CHUNK_SIZE = 450;

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
      // If current chunk is not empty, save it
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      // If single sentence is too long, split by words
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
  
  // If target is English, no need to translate
  if (targetLang === "en") return text;
  
  // For short texts, translate directly
  if (text.length <= MAX_CHUNK_SIZE) {
    return translateSingle(text, targetLang);
  }
  
  // For long texts, split and translate in chunks
  const chunks = splitIntoChunks(text, MAX_CHUNK_SIZE);
  console.log(`[translate] Splitting long text (${text.length} chars) into ${chunks.length} chunks`);
  
  const translatedChunks = await Promise.all(
    chunks.map(chunk => translateSingle(chunk, targetLang))
  );
  
  // Reconstruct the text preserving original structure
  return translatedChunks.join(" ");
}

async function translateSingle(text: string, targetLang: string): Promise<string> {
  const maxRetries = 2;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const url = `${MYMEMORY_API}?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log(`[translate] API error (attempt ${attempt + 1}): ${response.status}`);
        if (attempt === maxRetries) return text;
        await sleep(500 * (attempt + 1)); // Exponential backoff
        continue;
      }
      
      const data = await response.json();
      
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        return data.responseData.translatedText;
      }
      
      console.log(`[translate] Unexpected response format:`, data);
      if (attempt === maxRetries) return text;
      await sleep(500);
      
    } catch (error) {
      console.error(`[translate] Error (attempt ${attempt + 1}):`, error);
      if (attempt === maxRetries) return text;
      await sleep(500 * (attempt + 1));
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
  
  // Translate each item in parallel
  const translated = await Promise.all(
    items.map(item => translateText(item, targetLang))
  );
  
  return translated;
}

// Map English genres to Spanish
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

// Map multiple genres to Spanish
export function mapGenresToSpanish(genres: string[]): string[] {
  return genres.map(g => mapGenreToSpanish(g));
}
