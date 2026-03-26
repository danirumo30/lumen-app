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
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
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
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
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
        {game.platforms.length > 0 ? (
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
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-zinc-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <span className="text-xs font-medium">No disponible</span>
          </div>
        )}

        {/* Summary */}
        {game.summary && (
          <p className="text-zinc-300 leading-relaxed">{game.summary}</p>
        )}

        {/* Release date - always show */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-zinc-400">
              Lanzamiento: <span className="text-white">{game.releaseDate ? formatDate(game.releaseDate) : game.releaseYear ? game.releaseYear.toString() : "Desconocida"}</span>
            </span>
          </div>

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

        {/* Status selector */}
        <div className="border-t border-white/5 pt-6">
          <span className="text-xs text-zinc-500 w-full mb-1 block">Estado</span>

          {/* Mobile: 2-column grid | Desktop: horizontal flex */}
          <div className="grid grid-cols-2 lg:flex lg:flex-wrap gap-2">
            {/* Mobile row 1: Favorite + Platinum */}
            <button
              onClick={() => handleFavoriteClick()}
              disabled={isLoading}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${currentFavorite
                ? `${statusConfig.favorite.bg} ${statusConfig.favorite.text} border ${statusConfig.favorite.border}`
                : "bg-zinc-800/80 text-zinc-300 border border-zinc-700/50 hover:bg-zinc-700/80"
                }`}
            >
              {statusConfig.favorite.icon}
              {statusConfig.favorite.label}
            </button>

            <button
              onClick={() => handlePlatinumClick()}
              disabled={isLoading || (currentPlayStatus !== "completed" && currentPlayStatus !== "playing")}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${hasPlatinum
                ? "bg-gradient-to-r from-violet-500/30 to-amber-500/30 text-amber-300 border border-amber-500/40"
                : "bg-zinc-800/80 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700/80 hover:text-zinc-300"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={hasPlatinum ? "Trofeo de platino conseguido" : "Disponible solo cuando el juego está completado o en progreso"}
            >
              <img
                src="/icons/platforms/platino.png"
                alt="Platino"
                width={18}
                height={18}
                className={hasPlatinum ? "" : "grayscale opacity-50"}
              />
              <span className="">Platino</span>
            </button>

            {/* Mobile row 2: Playing + Completed */}
            {["playing", "completed"].map((key) => {
              const config = statusConfig[key as keyof typeof statusConfig];
              const isActive = currentPlayStatus === key;
              return (
                <button
                  key={key}
                  onClick={() => handlePlayStatusClick(isActive ? null : key)}
                  disabled={isLoading}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${isActive
                    ? `${config.bg} ${config.text} border ${config.border}`
                    : "bg-zinc-800/80 text-zinc-300 border border-zinc-700/50 hover:bg-zinc-700/80"
                    }`}
                >
                  {config.icon}
                  {config.label}
                </button>
              );
            })}

            {/* Mobile row 3: Dropped + Planned */}
            {["dropped", "planned"].map((key) => {
              const config = statusConfig[key as keyof typeof statusConfig];
              const isActive = currentPlayStatus === key;
              return (
                <button
                  key={key}
                  onClick={() => handlePlayStatusClick(isActive ? null : key)}
                  disabled={isLoading}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${isActive
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

        {/* Playtime tracker */}
        {user && (currentPlayStatus === "playing" || currentPlayStatus === "completed" || currentPlayStatus === "dropped") && (
          <div className="w-full md:max-w-[320px] lg:w-fit flex flex-col sm:flex-row items-center gap-2 sm:gap-3 p-3 rounded-xl bg-gradient-to-br from-zinc-900/90 via-zinc-800/50 to-zinc-900/90 border border-emerald-500/30 shadow-lg shadow-emerald-500/10 backdrop-blur-xl relative overflow-hidden group animate-fade-in-up">
            
            {/* Decorative background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Decorative corner accents */}
            <div className="absolute top-0 left-0 w-6 h-6 border-l border-t border-emerald-500/40 rounded-tl-lg" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-r border-b border-emerald-500/40 rounded-br-lg" />

            {/* Sección Izquierda: Tiempo Total */}
            <div className="flex flex-row sm:flex-col items-center sm:items-start justify-between w-full sm:w-auto gap-2 border-b sm:border-b-0 sm:border-r border-emerald-500/20 pb-2 sm:pb-0 sm:pr-4 relative z-10">
              <span className="text-[9px] text-emerald-400/70 uppercase tracking-[0.2em] font-bold animate-pulse">Jugado</span>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-mono tabular-nums bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent animate-gradient-text">
                  {formatPlaytime(gameStatus.playtimeMinutes)}
                </span>
                <span className="text-[10px] text-emerald-500/60 font-medium">TOTAL</span>
              </div>
            </div>

            {/* Sección Derecha: Inputs y Botón */}
            <div className="flex items-center justify-between w-full sm:w-auto gap-2 relative z-10">
              <div className="flex items-center gap-2">
                {/* Input Horas */}
                <div className="relative group/input">
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-lg opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-300 blur" />
                  <input
                    type="number"
                    value={hoursInput}
                    onChange={(e) => setHoursInput(e.target.value)}
                    className="relative w-12 h-8 text-center text-xs font-mono bg-zinc-900/90 border border-emerald-500/30 rounded-lg text-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/50 focus:outline-none transition-all duration-300 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                    placeholder="0"
                  />
                  <span className="absolute -top-1.5 left-1 px-1 bg-zinc-900/95 text-[8px] text-emerald-500/60 uppercase font-bold border border-emerald-500/20 rounded-xs">H</span>
                  
                  {/* Focus glow effect */}
                  <div className="absolute inset-0 rounded-lg pointer-events-none opacity-0 focus-within:opacity-100 transition-opacity duration-300" style={{ boxShadow: '0 0 12px rgba(16, 185, 129, 0.3)' }} />
                </div>

                {/* Input Minutos */}
                <div className="relative group/input">
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-lg opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-300 blur" />
                  <input
                    type="number"
                    value={minsInput}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setMinsInput(val > 59 ? "59" : val.toString());
                    }}
                    className="relative w-12 h-8 text-center text-xs font-mono bg-zinc-900/90 border border-emerald-500/30 rounded-lg text-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/50 focus:outline-none transition-all duration-300 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                    placeholder="0"
                  />
                  <span className="absolute -top-1.5 left-1 px-1 bg-zinc-900/95 text-[8px] text-emerald-500/60 uppercase font-bold border border-emerald-500/20 rounded-xs">M</span>
                  
                  {/* Focus glow effect */}
                  <div className="absolute inset-0 rounded-lg pointer-events-none opacity-0 focus-within:opacity-100 transition-opacity duration-300" style={{ boxShadow: '0 0 12px rgba(16, 185, 129, 0.3)' }} />
                </div>
              </div>

              {/* Botón Guardar - con animaciones mejoradas */}
              <button
                onClick={handlePlaytimeSubmit}
                disabled={isLoading}
                className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 via-emerald-500 to-teal-600 text-black flex items-center justify-center hover:from-emerald-400 hover:via-emerald-400 hover:to-teal-500 active:scale-95 transition-all duration-300 shadow-md shadow-emerald-500/30 hover:shadow-emerald-400/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group/button"
              >
                {/* Shine effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/button:translate-x-full transition-transform duration-700" />
                
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
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
