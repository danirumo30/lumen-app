// Translation utility using MyMemory API (free, no API key required)
// Translate text from English to target language

const MYMEMORY_API = "https://api.mymemory.translated.net/get";

export async function translateText(text: string, targetLang: string = "es"): Promise<string> {
  if (!text || text.trim() === "") return text;
  
  // If target is English, no need to translate
  if (targetLang === "en") return text;
  
  try {
    const url = `${MYMEMORY_API}?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log("[translate] API error, returning original");
      return text;
    }
    
    const data = await response.json();
    
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
    
    return text;
  } catch (error) {
    console.error("[translate] Error:", error);
    return text;
  }
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
};

export function mapGenreToSpanish(genre: string): string {
  return genreMap[genre] || genre;
}

// Map multiple genres to Spanish
export function mapGenresToSpanish(genres: string[]): string[] {
  return genres.map(g => mapGenreToSpanish(g));
}
