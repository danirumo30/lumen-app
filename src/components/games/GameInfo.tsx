"use client";

import React, { useState } from "react";
import { useAuth } from "@/modules/auth/infrastructure/contexts/AuthContext";
import { Modal } from "@/components/ui/Modal";
import { supabase } from "@/lib/supabase";

interface Game {
  id: string;
  igdbId: number;
  name: string;
  coverUrl: string | null;
  summary: string | null;
  genres: string[];
  gameModes: string[];
  platforms: string[];
  releaseDate: string | null;
  releaseYear: number | null;
  rating: number | null;
  involvedCompanies: string[];
}

interface GameStatus {
  isFavorite: boolean;
  playStatus: "playing" | "completed" | "dropped" | "planned" | null;
  playtimeMinutes: number;
  startedAt: string | null;
  completedAt: string | null;
}

interface GameInfoProps {
  game: Game;
  gameStatus: GameStatus;
  onStatusChange: (status: string | null) => void;
  onPlaytimeChange: (minutes: number) => void;
}

// Platform icons map - using simplified recognizable icons
const platformIcons: Record<string, React.ReactElement> = {
  PC: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
    </svg>
  ),
  "PlayStation 5": (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8.984 2.5v15.932l3.54 1.142V6.645c0-.688.318-1.15.828-.991.665.189.795.814.795 1.505v5.873c2.438 1.191 4.357-.002 4.357-3.148 0-3.233-1.125-4.67-4.357-5.48V2.5c0-.687-.227-.935-.827-.935H8.984zm.785 4.073c1.02.06 1.918.467 2.393 1.448h.039V5.672c0-.653-.341-.913-.859-.913-.495 0-.845.26-.845.808v3.234c0 .295.037.537.099.75h1.164c-.593-1.655-1.719-2.228-1.991-2.877z"/>
    </svg>
  ),
  "PlayStation 4": (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8.984 2.5v15.932l3.54 1.142V6.645c0-.688.318-1.15.828-.991.665.189.795.814.795 1.505v5.873c2.438 1.191 4.357-.002 4.357-3.148 0-3.233-1.125-4.67-4.357-5.48V2.5c0-.687-.227-.935-.827-.935H8.984zm.785 4.073c1.02.06 1.918.467 2.393 1.448h.039V5.672c0-.653-.341-.913-.859-.913-.495 0-.845.26-.845.808v3.234c0 .295.037.537.099.75h1.164c-.593-1.655-1.719-2.228-1.991-2.877z"/>
    </svg>
  ),
  Xbox: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.102 5.588C1.152 7.256 0 9.32 0 11.754c0 1.89.63 3.67 1.777 5.072l.01-.002C3.114 18.4 4.22 19.5 5.5 20.4c1.28-.9 2.386-2 3.713-2.576l.01.002c1.147-1.402 1.777-3.182 1.777-5.072 0-.97-.24-1.897-.677-2.748C8.5 9.6 7 8.5 5.5 7.7V6.3c1.5.6 2.5 1.5 2.5 1.5l-.1-.1c-2-1-4.5-1.4-6.5-.6l.8-.9c.6-.5 1.5-.4 2 .2.4.6.4 1.5-.2 2l-.4.4zm13.796 0c2 1 4.5 1.4 6.5.6l-.8.9c-.6.5-1.5.4-2-.2-.4-.6-.4-1.5.2-2l.4-.4c2-1 2.5-2.5 2.5-2.5s-1-1.5-2.5-1.5V7.7c1.5.8 3 1.9 4.323 2.7.437.851.677 1.778.677 2.748 0 1.89-.63 3.67-1.777 5.072l-.01-.002c-1.327.576-2.433 1.676-3.713 2.576-1.28-.9-2.386-2-3.713-2.576l-.01.002C1.63 15.426 1 13.646 1 11.754c0-2.434 1.152-4.498 4.102-6.166l-.004.001zM12 8c2.5 0 4.5 1.5 4.5 3.5S14.5 15 12 15s-4.5-1.5-4.5-3.5S9.5 8 12 8zm0 1.5c-1.5 0-2.5.75-2.5 2s1 2 2.5 2 2.5-.75 2.5-2-1-2-2.5-2z"/>
    </svg>
  ),
  "Xbox Series X": (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.102 5.588C1.152 7.256 0 9.32 0 11.754c0 1.89.63 3.67 1.777 5.072l.01-.002C3.114 18.4 4.22 19.5 5.5 20.4c1.28-.9 2.386-2 3.713-2.576l.01.002c1.147-1.402 1.777-3.182 1.777-5.072 0-.97-.24-1.897-.677-2.748C8.5 9.6 7 8.5 5.5 7.7V6.3c1.5.6 2.5 1.5 2.5 1.5l-.1-.1c-2-1-4.5-1.4-6.5-.6l.8-.9c.6-.5 1.5-.4 2 .2.4.6.4 1.5-.2 2l-.4.4zm13.796 0c2 1 4.5 1.4 6.5.6l-.8.9c-.6.5-1.5.4-2-.2-.4-.6-.4-1.5.2-2l.4-.4c2-1 2.5-2.5 2.5-2.5s-1-1.5-2.5-1.5V7.7c1.5.8 3 1.9 4.323 2.7.437.851.677 1.778.677 2.748 0 1.89-.63 3.67-1.777 5.072l-.01-.002c-1.327.576-2.433 1.676-3.713 2.576-1.28-.9-2.386-2-3.713-2.576l-.01.002C1.63 15.426 1 13.646 1 11.754c0-2.434 1.152-4.498 4.102-6.166l-.004.001zM12 8c2.5 0 4.5 1.5 4.5 3.5S14.5 15 12 15s-4.5-1.5-4.5-3.5S9.5 8 12 8zm0 1.5c-1.5 0-2.5.75-2.5 2s1 2 2.5 2 2.5-.75 2.5-2-1-2-2.5-2z"/>
    </svg>
  ),
  "Xbox One": (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.102 5.588C1.152 7.256 0 9.32 0 11.754c0 1.89.63 3.67 1.777 5.072l.01-.002C3.114 18.4 4.22 19.5 5.5 20.4c1.28-.9 2.386-2 3.713-2.576l.01.002c1.147-1.402 1.777-3.182 1.777-5.072 0-.97-.24-1.897-.677-2.748C8.5 9.6 7 8.5 5.5 7.7V6.3c1.5.6 2.5 1.5 2.5 1.5l-.1-.1c-2-1-4.5-1.4-6.5-.6l.8-.9c.6-.5 1.5-.4 2 .2.4.6.4 1.5-.2 2l-.4.4zm13.796 0c2 1 4.5 1.4 6.5.6l-.8.9c-.6.5-1.5.4-2-.2-.4-.6-.4-1.5.2-2l.4-.4c2-1 2.5-2.5 2.5-2.5s-1-1.5-2.5-1.5V7.7c1.5.8 3 1.9 4.323 2.7.437.851.677 1.778.677 2.748 0 1.89-.63 3.67-1.777 5.072l-.01-.002c-1.327.576-2.433 1.676-3.713 2.576-1.28-.9-2.386-2-3.713-2.576l-.01.002C1.63 15.426 1 13.646 1 11.754c0-2.434 1.152-4.498 4.102-6.166l-.004.001zM12 8c2.5 0 4.5 1.5 4.5 3.5S14.5 15 12 15s-4.5-1.5-4.5-3.5S9.5 8 12 8zm0 1.5c-1.5 0-2.5.75-2.5 2s1 2 2.5 2 2.5-.75 2.5-2-1-2-2.5-2z"/>
    </svg>
  ),
  "Nintendo Switch": (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.5 8.5c0-.55.45-1 1-1h1.25a1 1 0 011 .9v2.2a1 1 0 01-.9 1.1H5.5a1 1 0 01-1-1V8.5zm12.5 0c0-.55.45-1 1-1h1.25a1 1 0 011 .9v2.2a1 1 0 01-.9 1.1H18a1 1 0 01-1-1V8.5zM12 2C6.5 2 2 5.58 2 10c0 4.42 4.5 8 10 8s10-3.58 10-8c0-4.42-4.5-8-10-8zm0 14.5c-4.14 0-8-2.94-8-6.5 0-3.56 3.86-6.5 8-6.5s8 2.94 8 6.5c0 3.56-3.86 6.5-8 6.5z"/>
    </svg>
  ),
  "Nintendo Switch 2": (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.5 8.5c0-.55.45-1 1-1h1.25a1 1 0 011 .9v2.2a1 1 0 01-.9 1.1H5.5a1 1 0 01-1-1V8.5zm12.5 0c0-.55.45-1 1-1h1.25a1 1 0 011 .9v2.2a1 1 0 01-.9 1.1H18a1 1 0 01-1-1V8.5zM12 2C6.5 2 2 5.58 2 10c0 4.42 4.5 8 10 8s10-3.58 10-8c0-4.42-4.5-8-10-8zm0 14.5c-4.14 0-8-2.94-8-6.5 0-3.56 3.86-6.5 8-6.5s8 2.94 8 6.5c0 3.56-3.86 6.5-8 6.5z"/>
    </svg>
  ),
  iOS: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  ),
  Android: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-2.86-1.21-6.08-1.21-8.94 0L5.65 5.67c-.19-.29-.51-.38-.83-.22-.31.16-.43.54-.26.85L6.4 9.48C3.3 11.25 1.28 14.44 1 18h22c-.28-3.56-2.3-6.75-5.4-8.52zM10 15.5L7.5 13v2.5h-2v-5h2v2.5l2.5-2.5 2.5 2.5V11h-2v2.5L10 15.5zM17 14.5h-2v-3h2v3zm0-5h-2V9.5h2v3z"/>
    </svg>
  ),
  macOS: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8zm-1-6.5v-3l2.5 1.5L13 13.5z"/>
    </svg>
  ),
  Linux: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.682-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.2 2.606.202.76.021 1.082.287 1.287.468.264.23.486.602.668 1.075.09.246.18.485.304.668.268.398.596.728 1.022.94.731.354 1.57.334 2.453.334.468 0 .864-.06 1.232-.172.386-.132.663-.267.963-.535.172-.148.399-.332.54-.535.076-.123.135-.269.22-.399.206-.315.28-.73.28-1.148 0-.535-.12-.863-.377-1.058-.219-.164-.48-.201-.82-.201-.267 0-.502.035-.72.106-.48.148-.93.53-1.232.962-.063.089-.12.186-.18.276-.173.267-.26.602-.26.935 0 .063.014.122.023.182.138.915.48 1.86 1.074 2.684.35.463.77.87 1.282 1.163.13.069.267.123.4.18.35.135.732.235 1.13.3.302.045.6.062.902.062.215 0 .43-.02.64-.063.428-.08.84-.21 1.234-.398.42-.185.812-.43 1.157-.726.38-.31.66-.668.91-1.058.105-.16.19-.326.285-.485.27-.45.486-.935.648-1.442.038-.115.072-.23.106-.345.08-.332.135-.668.18-1.003.095-.682.13-1.365.105-2.047-.02-.399-.06-.8-.13-1.19-.14-.736-.378-1.428-.71-2.105-.61-1.227-1.46-2.25-2.58-3.015-.826-.571-1.797-.963-2.83-1.08-.426-.053-.86-.062-1.293-.03-.336.024-.665.082-1 .138-.66.136-1.31.305-1.95.53-.33.116-.66.252-1.036.4.03-.334.03-.6.02-.668z"/>
    </svg>
  ),
  Windows: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 5.5L3 18.5 11.5 18.5 11.5 12 21.5 12 21.5 5.5 11.5 5.5 11.5 3 3 3z M3 21L3 15.5 11.5 15.5 11.5 21z"/>
    </svg>
  ),
  Web: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 01-.73-17.98c.48-.08.98-.13 1.48-.13a9 9 0 100 18c-.5 0-.99-.05-1.47-.13A9 9 0 0112 21zM3.6 9h16.8M3.6 15h16.8M12 3a15.3 15.3 0 014 9 15.3 15.3 0 01-4 9 15.3 15.3 0 01-4-9 15.3 15.3 0 014-9z"/>
    </svg>
  ),
};

// Generic fallback icon
const defaultPlatformIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
  </svg>
);

// Helper to get icon for a platform
function getPlatformIcon(platform: string): React.ReactElement {
  const lowerPlatform = platform.toLowerCase();
  
  // Try exact match first
  if (platformIcons[platform]) {
    return platformIcons[platform];
  }
  
  // Try partial matches for PlayStation
  if (lowerPlatform.includes("playstation") || lowerPlatform === "ps5" || lowerPlatform === "ps4" || lowerPlatform === "ps3" || lowerPlatform === "ps2" || lowerPlatform === "ps") {
    return platformIcons["PlayStation 5"] || defaultPlatformIcon;
  }
  
  // Try partial matches for Xbox
  if (lowerPlatform.includes("xbox")) {
    return platformIcons["Xbox"] || defaultPlatformIcon;
  }
  
  // Try partial matches for Nintendo
  if (lowerPlatform.includes("nintendo") || lowerPlatform.includes("switch")) {
    return platformIcons["Nintendo Switch"] || defaultPlatformIcon;
  }
  
  // Try partial matches for PC
  if (lowerPlatform.includes("pc") || lowerPlatform.includes("windows") || lowerPlatform.includes("mac") || lowerPlatform.includes("linux")) {
    return platformIcons["PC"] || defaultPlatformIcon;
  }
  
  // Try partial matches for mobile
  if (lowerPlatform.includes("ios") || lowerPlatform.includes("iphone") || lowerPlatform.includes("ipad")) {
    return platformIcons["iOS"] || defaultPlatformIcon;
  }
  if (lowerPlatform.includes("android")) {
    return platformIcons["Android"] || defaultPlatformIcon;
  }
  
  // Try partial matches for web
  if (lowerPlatform.includes("web") || lowerPlatform.includes("browser")) {
    return platformIcons["Web"] || defaultPlatformIcon;
  }
  
  return defaultPlatformIcon;
}

const statusConfig = {
  favorite: {
    label: "Favorito",
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
      </svg>
    ),
    bg: "bg-rose-500/20",
    border: "border-rose-500/30",
    text: "text-rose-400",
  },
  playing: {
    label: "Jugando",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bg: "bg-emerald-500/20",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
  },
  completed: {
    label: "Completado",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    bg: "bg-cyan-500/20",
    border: "border-cyan-500/30",
    text: "text-cyan-400",
  },
  dropped: {
    label: "Abandonado",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    bg: "bg-orange-500/20",
    border: "border-orange-500/30",
    text: "text-orange-400",
  },
  planned: {
    label: "Pendiente",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bg: "bg-amber-500/20",
    border: "border-amber-500/30",
    text: "text-amber-400",
  },
};

export function GameInfo({ game, gameStatus, onStatusChange, onPlaytimeChange }: GameInfoProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  // Split playtime into hours and minutes for two inputs
  const totalMinutes = gameStatus.playtimeMinutes;
  const currentHours = Math.floor(totalMinutes / 60);
  const currentMins = totalMinutes % 60;
  const [hoursInput, setHoursInput] = useState(currentHours.toString());
  const [minsInput, setMinsInput] = useState(currentMins.toString());

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatPlaytime = (minutes: number) => {
    if (!minutes) return "0h";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  // Handle play status (playing, completed, dropped, planned) - mutually exclusive
  const handlePlayStatusClick = async (status: string | null) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const igdbId = typeof game.igdbId === 'number' ? game.igdbId : parseInt(game.igdbId);
      
      const response = await fetch("/api/user/game-status", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({
          igdbId: igdbId,
          status,
          gameData: {
            title: game.name,
            coverUrl: game.coverUrl,
            releaseYear: game.releaseYear,
          },
        }),
      });

      if (response.status === 401) {
        setShowLoginPrompt(true);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        onStatusChange(status); // This will refresh the page
      }
    } catch (error) {
      console.error("Error updating play status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle favorite - independent of play status
  const handleFavoriteClick = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const igdbId = typeof game.igdbId === 'number' ? game.igdbId : parseInt(game.igdbId);
      
      const newFavorite = !gameStatus.isFavorite;
      const response = await fetch("/api/user/game-status", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({
          igdbId: igdbId,
          isFavorite: newFavorite,
          gameData: {
            title: game.name,
            coverUrl: game.coverUrl,
            releaseYear: game.releaseYear,
          },
        }),
      });

      if (response.ok) {
        // Use "remove-favorite" to distinguish from play status removal
        onStatusChange(newFavorite ? "favorite" : "remove-favorite");
      }
    } catch (error) {
      console.error("Error updating favorite:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusClick = async (status: string | null) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    console.log("[GameInfo] handleStatusClick called with status:", status, "igdbId:", game.igdbId);

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Ensure igdbId is a number
      const igdbId = typeof game.igdbId === 'number' ? game.igdbId : parseInt(game.igdbId);
      console.log("[GameInfo] Sending request with igdbId:", igdbId);
      
      const response = await fetch("/api/user/game-status", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({
          igdbId: igdbId,
          status,
          gameData: {
            title: game.name,
            coverUrl: game.coverUrl,
            releaseYear: game.releaseYear,
          },
        }),
      });

      console.log("[GameInfo] Response status:", response.status);

      if (response.status === 401) {
        setShowLoginPrompt(true);
        return;
      }

      if (!response.ok) {
        const error = await response.json();
        console.error("[GameInfo] Error:", error);
      }

      if (response.ok) {
        onStatusChange(status);
      }
    } catch (error) {
      console.error("Error updating game status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaytimeSubmit = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    // Calculate total minutes from both inputs
    const hours = parseInt(hoursInput) || 0;
    const mins = parseInt(minsInput) || 0;
    const totalMinutes = (hours * 60) + mins;
    
    if (totalMinutes <= 0) return;

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch("/api/user/game-status", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({
          igdbId: game.igdbId,
          status: gameStatus.playStatus || "playing",
          playtimeMinutes: totalMinutes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onPlaytimeChange(data.playtimeMinutes);
      }
    } catch (error) {
      console.error("Error updating playtime:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentPlayStatus = gameStatus.playStatus;
  const currentFavorite = gameStatus.isFavorite;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
      {/* Cover */}
      <div className="relative">
        <div className="sticky top-24">
          {game.coverUrl ? (
            <img
              src={game.coverUrl}
              alt={game.name}
              className="w-full rounded-2xl shadow-2xl shadow-black/50"
            />
          ) : (
            <div className="aspect-[2/3] rounded-2xl bg-zinc-800 flex items-center justify-center">
              <svg className="w-16 h-16 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{game.name}</h1>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
          {game.releaseYear && (
            <span>{game.releaseYear}</span>
          )}
          {game.rating && (
            <>
              <span className="text-zinc-600">•</span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                <span className="font-semibold text-white">{game.rating.toFixed(1)}</span>
              </span>
            </>
          )}
        </div>

        {/* Genres and Game Modes */}
        {(game.genres.length > 0 || game.gameModes.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {/* Genres */}
            {game.genres.map((genre, i) => (
              <span
                key={`genre-${i}`}
                className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300"
              >
                {genre}
              </span>
            ))}
            {/* Game Modes */}
            {game.gameModes.map((mode, i) => (
              <span
                key={`mode-${i}`}
                className="px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300"
              >
                {mode}
              </span>
            ))}
          </div>
        )}

        {/* Platforms with icons */}
        {game.platforms.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {game.platforms.map((platform, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-xs text-zinc-400"
              >
                <span className="text-zinc-500">{getPlatformIcon(platform)}</span>
                {platform}
              </span>
            ))}
          </div>
        )}

        {/* Summary */}
        {game.summary && (
          <p className="text-zinc-300 leading-relaxed">{game.summary}</p>
        )}

        {/* Release date + Status date */}
        {(game.releaseDate || gameStatus.playStatus) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {/* Release date */}
            {game.releaseDate && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-zinc-400">
                  Lanzamiento: <span className="text-white">{formatDate(game.releaseDate)}</span>
                </span>
              </div>
            )}
            
            {/* Status-specific dates */}
            {gameStatus.playStatus === "playing" && gameStatus.startedAt && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                </svg>
                <span className="text-zinc-400">
                  Empezado: <span className="text-emerald-400">{formatDate(gameStatus.startedAt)}</span>
                </span>
              </div>
            )}
            
            {gameStatus.playStatus === "completed" && gameStatus.completedAt && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-zinc-400">
                  Completado: <span className="text-cyan-400">{formatDate(gameStatus.completedAt)}</span>
                </span>
              </div>
            )}
            
            {gameStatus.playStatus === "dropped" && gameStatus.startedAt && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-zinc-400">
                  Abandonado: <span className="text-orange-400">{formatDate(gameStatus.startedAt)}</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Status selector */}
        <div className="border-t border-white/5 pt-6">
          {/* All status buttons in one row - Favorite FIRST */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-zinc-500 w-full mb-1">Estado</span>
            
            {/* Favorite button - independent, first position */}
            <button
              onClick={() => handleFavoriteClick()}
              disabled={isLoading}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                currentFavorite
                  ? `${statusConfig.favorite.bg} ${statusConfig.favorite.text} border ${statusConfig.favorite.border}`
                  : "bg-zinc-800/80 text-zinc-300 border border-zinc-700/50 hover:bg-zinc-700/80"
              }`}
            >
              {statusConfig.favorite.icon}
              {statusConfig.favorite.label}
            </button>

            {/* Play Status buttons - mutually exclusive */}
            {["playing", "completed", "dropped", "planned"].map((key) => {
              const config = statusConfig[key as keyof typeof statusConfig];
              const isActive = currentPlayStatus === key;
              return (
                <button
                  key={key}
                  onClick={() => handlePlayStatusClick(isActive ? null : key)}
                  disabled={isLoading}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? `${config.bg} ${config.text} border ${config.border}`
                      : "bg-zinc-800/80 text-zinc-300 border border-zinc-700/50 hover:bg-zinc-700/80"
                  }`}
                >
                  {config.icon}
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Playtime tracker - Two separate inputs for hours and minutes */}
        {/* Only show when NOT in "planned" status */}
        {user && currentPlayStatus !== "planned" && (
          <div className="mt-4 p-3 rounded-xl bg-zinc-900/50 border border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-400">Tiempo de juego:</span>
              <span className="text-white font-medium">{formatPlaytime(gameStatus.playtimeMinutes)}</span>
              <div className="flex-1" />
              
              {/* Hours input */}
              <input
                type="number"
                value={hoursInput}
                onChange={(e) => setHoursInput(e.target.value)}
                placeholder="0"
                className="w-14 px-2 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm text-center [-moz-appearance:textfield]"
                min="0"
                style={{ WebkitAppearance: 'none', appearance: 'textfield' }}
              />
              <span className="text-xs text-zinc-500">Horas</span>
              
              {/* Minutes input */}
              <input
                type="number"
                value={minsInput}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  // Cap at 59
                  setMinsInput(val > 59 ? "59" : val.toString());
                }}
                placeholder="0"
                className="w-14 px-2 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm text-center [-moz-appearance:textfield]"
                min="0"
                max="59"
                style={{ WebkitAppearance: 'none', appearance: 'textfield' }}
              />
              <span className="text-xs text-zinc-500">Min</span>
              
              <button
                onClick={handlePlaytimeSubmit}
                disabled={isLoading}
                className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-sm hover:bg-emerald-500/30"
              >
                Guardar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Login Modal */}
      <Modal isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)}>
        <div className="p-6">
          <button
            onClick={() => setShowLoginPrompt(false)}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>

          <h3 className="text-xl font-semibold text-white text-center mb-2">
            Inicia sesión para continuar
          </h3>

          <p className="text-zinc-400 text-sm text-center mb-6">
            Guarda tu progreso y marca tus juegos favoritos.
          </p>

          <div className="space-y-3">
            <a
              href="/login"
              className="block w-full py-3 rounded-xl bg-white text-zinc-900 text-sm font-semibold text-center hover:bg-zinc-200"
            >
              Iniciar sesión
            </a>
            <a
              href="/login?tab=register"
              className="block w-full py-3 rounded-xl bg-zinc-800 text-white text-sm font-medium text-center hover:bg-zinc-700 border border-zinc-700"
            >
              Crear una cuenta
            </a>
          </div>
        </div>
      </Modal>
    </div>
  );
}
