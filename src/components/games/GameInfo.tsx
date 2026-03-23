"use client";

import React, { useState } from "react";
import Image from "next/image";
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
  hasPlatinum: boolean;
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
  onPlatinumChange: (hasPlatinum: boolean) => void;
}

// Platform icons - using uploaded SVG files
const platformIcons: Record<string, string> = {
  PC: "/icons/platforms/windows.svg",
  Windows: "/icons/platforms/windows.svg",
  macOS: "/icons/platforms/macos.svg",
  Linux: "/icons/platforms/linux.svg",
  "PlayStation 5": "/icons/platforms/playstation.svg",
  "PlayStation 4": "/icons/platforms/playstation.svg",
  "Xbox Series X": "/icons/platforms/xbox.svg",
  "Xbox One": "/icons/platforms/xbox.svg",
  Xbox: "/icons/platforms/xbox.svg",
  "Nintendo Switch": "/icons/platforms/nintendo-switch.svg",
  "Nintendo Switch 2": "/icons/platforms/nintendo-switch.svg",
  iOS: "/icons/platforms/ios.svg",
  Android: "/icons/platforms/android.svg",
  Web: "/icons/platforms/web.svg",
};

// Generic fallback icon (inline SVG)
const defaultPlatformIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
  </svg>
);

// Helper to get icon path for a platform
function getPlatformIconPath(platform: string): string | null {
  const lowerPlatform = platform.toLowerCase();
  
  // Try exact match first
  if (platformIcons[platform]) {
    return platformIcons[platform];
  }
  
  // Try partial matches for PlayStation
  if (lowerPlatform.includes("playstation") || lowerPlatform === "ps5" || lowerPlatform === "ps4" || lowerPlatform === "ps3" || lowerPlatform === "ps2" || lowerPlatform === "ps") {
    return platformIcons["PlayStation 5"];
  }
  
  // Try partial matches for Xbox
  if (lowerPlatform.includes("xbox")) {
    return platformIcons["Xbox"];
  }
  
  // Try partial matches for Nintendo
  if (lowerPlatform.includes("nintendo") || lowerPlatform.includes("switch")) {
    return platformIcons["Nintendo Switch"];
  }
  
  // Try partial matches for PC
  if (lowerPlatform.includes("pc") || lowerPlatform.includes("windows")) {
    return platformIcons["PC"];
  }
  
  // macOS
  if (lowerPlatform.includes("mac") || lowerPlatform.includes("os x")) {
    return platformIcons["macOS"];
  }
  
  // Try partial matches for mobile
  if (lowerPlatform.includes("ios") || lowerPlatform.includes("iphone") || lowerPlatform.includes("ipad")) {
    return platformIcons["iOS"];
  }
  if (lowerPlatform.includes("android")) {
    return platformIcons["Android"];
  }
  
  // Try partial matches for web
  if (lowerPlatform.includes("web") || lowerPlatform.includes("browser")) {
    return platformIcons["Web"];
  }
  
  return null;
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

export function GameInfo({ game, gameStatus, onStatusChange, onPlaytimeChange, onPlatinumChange }: GameInfoProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [hasPlatinum, setHasPlatinum] = useState(gameStatus.hasPlatinum);
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

  // Handle platinum trophy toggle
  const handlePlatinumClick = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const newPlatinum = !hasPlatinum;
      
      // Ensure igdbId is a number
      const igdbId = typeof game.igdbId === 'number' ? game.igdbId : parseInt(game.igdbId);
      
      const response = await fetch("/api/user/game-status", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({
          igdbId: igdbId,
          hasPlatinum: newPlatinum,
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
        setHasPlatinum(newPlatinum); // Optimistic update
        onPlatinumChange(newPlatinum);
      } else {
        console.error("[GameInfo] Failed to update platinum status");
      }
    } catch (error) {
      console.error("[GameInfo] Error updating platinum:", error);
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
            {game.platforms.map((platform, i) => {
              const iconPath = getPlatformIconPath(platform);
              return (
                <span
                  key={i}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-xs text-zinc-400"
                >
                  {iconPath ? (
                    <Image src={iconPath} alt={platform} width={16} height={16} className="text-zinc-500" />
                  ) : defaultPlatformIcon}
                  {platform}
                </span>
              );
            })}
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

            {/* Platinum trophy button */}
            <button
              onClick={() => handlePlatinumClick()}
              disabled={isLoading}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                hasPlatinum
                  ? "bg-gradient-to-r from-violet-500/30 to-amber-500/30 text-amber-300 border border-amber-500/40"
                  : "bg-zinc-800/80 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700/80 hover:text-zinc-300"
              }`}
              title={hasPlatinum ? "Trofeo de platino conseguido" : "Marcar como completado con platino"}
            >
              <img 
                src="/icons/platforms/platino.png" 
                alt="Platino" 
                width={18} 
                height={18} 
                className={hasPlatinum ? "" : "grayscale opacity-50"}
              />
              <span className="hidden sm:inline">Platino</span>
            </button>
          </div>
        </div>

        {/* Playtime tracker - Two separate inputs for hours and minutes */}
        {/* Only show when playing, completed, or dropped */}
        {user && (currentPlayStatus === "playing" || currentPlayStatus === "completed" || currentPlayStatus === "dropped") && (
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
          {/* Close button */}
          <button
            onClick={() => setShowLoginPrompt(false)}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-white text-center mb-2">
            Inicia sesión para continuar
          </h3>

          {/* Description */}
          <p className="text-zinc-400 text-sm text-center mb-6">
            Guarda tu progreso y marca tus juegos favoritos.
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <a
              href="/login"
              className="block w-full py-3 rounded-xl bg-white text-zinc-900 text-sm font-semibold text-center hover:bg-zinc-200 transition-colors"
            >
              Iniciar sesión
            </a>
            <a
              href="/login?tab=register"
              className="block w-full py-3 rounded-xl bg-zinc-800 text-white text-sm font-medium text-center hover:bg-zinc-700 transition-colors border border-zinc-700"
            >
              Crear una cuenta
            </a>
          </div>
        </div>
      </Modal>
    </div>
  );
}
