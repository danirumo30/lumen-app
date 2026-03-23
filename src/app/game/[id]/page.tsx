"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { GameInfo } from "@/components/games/GameInfo";
import { GameMediaCarousel } from "@/components/games/GameMediaCarousel";
import { SimilarGamesCarousel } from "@/components/games/SimilarGamesCarousel";
import { FranchiseCarousel } from "@/components/games/FranchiseCarousel";
import { DLCsCarousel } from "@/components/games/DLCsCarousel";
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

interface GameMedia {
  id?: number;
  url: string;
  type: "screenshot" | "artwork";
  width: number;
  height: number;
}

interface GameVideo {
  id: string;
  name: string;
  thumbnailUrl: string;
  watchUrl: string;
}

interface SimilarGame {
  id: string;
  igdbId: number;
  name: string;
  posterUrl: string | null;
  releaseDate: string | null;
  releaseYear: number | null;
  rating: number | null;
  genres: string[];
}

interface FranchiseGame {
  id: string;
  igdbId: number;
  name: string;
  posterUrl: string | null;
  releaseDate: string | null;
  releaseYear: number | null;
  rating: number | null;
  genres: string[];
}

interface FranchiseInfo {
  id: number;
  name: string;
}

interface DLCGame {
  id: string;
  igdbId: number;
  name: string;
  posterUrl: string | null;
  releaseDate: string | null;
  releaseYear: number | null;
  rating: number | null;
  genres: string[];
}

export default function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [game, setGame] = useState<Game | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>({
    isFavorite: false,
    playStatus: null,
    playtimeMinutes: 0,
    startedAt: null,
    completedAt: null,
  });
  const [media, setMedia] = useState<{ images: GameMedia[]; videos: GameVideo[] }>({ images: [], videos: [] });
  const [similarGames, setSimilarGames] = useState<SimilarGame[]>([]);
  const [franchise, setFranchise] = useState<{ franchise: FranchiseInfo | null; games: FranchiseGame[] }>({ franchise: null, games: [] });
  const [dlcs, setDlcs] = useState<DLCGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to extract IGDB ID from media ID (e.g., "igdb_1234" -> "1234")
  const extractIgdbId = (mediaId: string): string | null => {
    const match = mediaId.match(/^(igdb_|game_)(\d+)$/);
    return match ? match[2] : null;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get session for auth headers
        const { data: { session } } = await supabase.auth.getSession();
        const authHeaders = {
          "Authorization": `Bearer ${session?.access_token || ""}`,
        };

        // Extract IGDB ID for API calls
        const igdbId = extractIgdbId(id) || id;
        
        // Fetch all data in parallel
        const [gameRes, statusRes, mediaRes, videosRes, similarRes, franchiseRes, dlcsRes] = await Promise.all([
          fetch(`/api/games/${igdbId}`),
          session?.access_token 
            ? fetch(`/api/user/game-status?igdbId=${igdbId}`, { headers: authHeaders })
            : Promise.resolve({ ok: true, json: () => Promise.resolve({ isFavorite: false, playStatus: null, playtimeMinutes: 0 }) }),
          fetch(`/api/games/${igdbId}/media`),
          fetch(`/api/games/${igdbId}/videos`),
          fetch(`/api/games/${igdbId}/similar`),
          fetch(`/api/games/${igdbId}/franchise`),
          fetch(`/api/games/${igdbId}/dlcs`),
        ]);

        if (!gameRes.ok) {
          throw new Error("Failed to fetch game");
        }

        const gameData = await gameRes.json();
        const statusData = await statusRes.json();
        const mediaData = await mediaRes.json();
        const videosData = await videosRes.json();
        const similarData = await similarRes.json();
        const franchiseData = await franchiseRes.json();
        const dlcsData = await dlcsRes.json();

        setGame(gameData);
        setGameStatus(statusData);
        setMedia({ images: mediaData.images || [], videos: videosData.videos || [] });
        setSimilarGames(similarData.games || []);
        setFranchise({ franchise: franchiseData.franchise, games: franchiseData.games || [] });
        setDlcs(dlcsData.dlcs || []);
      } catch (err) {
        console.error("Error fetching game data:", err);
        setError("Failed to load game details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse space-y-4">
          <div className="w-64 h-96 bg-zinc-800 rounded-2xl" />
          <div className="w-48 h-4 bg-zinc-800 rounded" />
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">{error || "Game not found"}</p>
          <a href="/" className="text-white hover:underline">
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Background backdrop */}
      {game.coverUrl && (
        <div className="fixed inset-0 -z-10">
          <img
            src={game.coverUrl}
            alt=""
            className="w-full h-full object-cover opacity-20 blur-2xl"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/50 via-zinc-950/80 to-zinc-950" />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back button */}
        <a
          href="/"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Volver</span>
        </a>

        {/* Main info */}
        <GameInfo
          game={game}
          gameStatus={gameStatus}
          onStatusChange={(status) => {
            if (status === "favorite") {
              setGameStatus(prev => ({
                ...prev,
                isFavorite: true,
              }));
            } else if (status === "remove-favorite") {
              setGameStatus(prev => ({
                ...prev,
                isFavorite: false,
              }));
            } else if (status === null) {
              setGameStatus(prev => ({
                ...prev,
                playStatus: null,
              }));
            } else {
              setGameStatus(prev => ({
                ...prev,
                playStatus: status as GameStatus["playStatus"],
              }));
            }
          }}
          onPlaytimeChange={(minutes) => {
            setGameStatus(prev => ({
              ...prev,
              playtimeMinutes: minutes,
            }));
          }}
        />

        {/* Carousels */}
        <GameMediaCarousel images={media.images} videos={media.videos} />
        <FranchiseCarousel franchise={franchise.franchise} games={franchise.games} currentGameId={game.igdbId.toString()} />
        <DLCsCarousel dlcs={dlcs} />
        <SimilarGamesCarousel games={similarGames} />
      </div>
    </div>
  );
}
