"use client";

import { useState } from "react";
import { useAuth } from "@/modules/auth/infrastructure/contexts/AuthContext";
import { Modal } from "@/components/ui/Modal";
import { supabase } from "@/lib/supabase";
import { WatchProvidersSection, type WatchProvider } from "@/components/shared/WatchProvidersSection";

interface Movie {
  id: string;
  tmdbId: number;
  title: string;
  originalTitle: string;
  overview: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  releaseDate: string;
  releaseYear: number | null;
  runtime: number | null;
  genres: { id: number; name: string }[];
  rating: number | null;
  voteCount: number;
  certification: string | null;
  status: string;
  tagline: string | null;
  watchProviders?: {
    link: string;
    providers: WatchProvider[];
  } | null;
}

interface WatchedStatus {
  watched: boolean;
  watchedAt: string | null;
}

interface FavoriteStatus {
  favorite: boolean;
  favoritedAt: string | null;
}

interface MovieInfoProps {
  movie: Movie;
  watchedStatus: WatchedStatus;
  favoriteStatus: FavoriteStatus;
  onWatchedChange: (watched: boolean) => void;
  onFavoriteChange: (favorite: boolean) => void;
}

export function MovieInfo({ movie, watchedStatus, favoriteStatus, onWatchedChange, onFavoriteChange }: MovieInfoProps) {
  const { user } = useAuth();
  const [isWatched, setIsWatched] = useState(watchedStatus.watched);
  const [isFavorite, setIsFavorite] = useState(favoriteStatus.favorite);
  const [isLoadingWatched, setIsLoadingWatched] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const formatRuntime = (minutes: number | null) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleWatchedClick = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    setIsLoadingWatched(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const newStatus = !isWatched;
      const response = await fetch("/api/user/movie-status", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token || ""}`,
        },
        credentials: "include",
        body: JSON.stringify({
          tmdbId: movie.tmdbId,
          watched: newStatus,
          movieData: {
            title: movie.title,
            originalTitle: movie.originalTitle,
            releaseYear: movie.releaseYear,
            runtime: movie.runtime,
            posterPath: movie.posterUrl,
          },
        }),
      });

      if (response.status === 401) {
        setShowLoginPrompt(true);
        return;
      }

      if (response.ok) {
        setIsWatched(newStatus);
        onWatchedChange(newStatus);
      }
    } catch (error) {
      console.error("Error updating watched status:", error);
    } finally {
      setIsLoadingWatched(false);
    }
  };

  const handleFavoriteClick = async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    setIsLoadingFavorite(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const newStatus = !isFavorite;
      const response = await fetch("/api/user/movie-favorite", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token || ""}`,
        },
        credentials: "include",
        body: JSON.stringify({
          tmdbId: movie.tmdbId,
          favorite: newStatus,
        }),
      });

      if (response.status === 401) {
        setShowLoginPrompt(true);
        return;
      }

      if (response.ok) {
        setIsFavorite(newStatus);
        onFavoriteChange(newStatus);
      }
    } catch (error) {
      console.error("Error updating favorite status:", error);
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
      {/* Poster */}
      <div className="relative">
        <div className="sticky top-24">
          {movie.posterUrl ? (
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-full rounded-2xl shadow-2xl shadow-black/50"
            />
          ) : (
            <div className="aspect-[2/3] rounded-2xl bg-zinc-800 flex items-center justify-center">
              <svg className="w-16 h-16 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{movie.title}</h1>
          {movie.originalTitle !== movie.title && (
            <p className="text-zinc-400 mt-1">{movie.originalTitle}</p>
          )}
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
          {movie.certification && (
            <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-medium">
              {movie.certification}
            </span>
          )}
          {movie.releaseYear && (
            <span>{movie.releaseYear}</span>
          )}
          {movie.runtime && (
            <>
              <span className="text-zinc-600">•</span>
              <span>{formatRuntime(movie.runtime)}</span>
            </>
          )}
          {movie.rating && (
            <>
              <span className="text-zinc-600">•</span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                <span className="font-semibold text-white">{movie.rating.toFixed(1)}</span>
                <span className="text-zinc-500">({movie.voteCount.toLocaleString()})</span>
              </span>
            </>
          )}
        </div>

        {/* Genres */}
        {movie.genres.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {movie.genres.map((genre) => (
              <span
                key={genre.id}
                className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300"
              >
                {genre.name}
              </span>
            ))}
          </div>
        )}

        {/* Tagline */}
        {movie.tagline && (
          <p className="text-zinc-400 italic text-lg">"{movie.tagline}"</p>
        )}

        {/* Overview */}
        {movie.overview && (
          <p className="text-zinc-300 leading-relaxed">{movie.overview}</p>
        )}

        {/* Release date details */}
        <div className="flex items-center gap-2 text-sm">
          <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-zinc-400">
            Estreno: <span className="text-white">{formatDate(movie.releaseDate)}</span>
          </span>
          {isWatched && watchedStatus.watchedAt && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Vista el {formatDate(watchedStatus.watchedAt.split("T")[0])}
            </span>
          )}
        </div>

        {/* Watch Providers - Beautiful integration */}
        {movie.watchProviders?.providers && movie.watchProviders.providers.length > 0 && (
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 backdrop-blur-sm border border-white/5">
            <WatchProvidersSection 
              providers={movie.watchProviders.providers}
              link={movie.watchProviders.link}
            />
          </div>
        )}

        {/* Watched & Favorite section */}
        <div className="border-t border-white/5 pt-6">
          <div className="flex gap-3">
            {/* Watched Button */}
            <button
              onClick={handleWatchedClick}
              disabled={isLoadingWatched}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
                isWatched
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                  : "bg-white text-zinc-900 hover:bg-zinc-200"
              }`}
            >
              {isLoadingWatched ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : isWatched ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {isWatched ? "Vista" : "Marcar como vista"}
            </button>

            {/* Favorite Button */}
            <button
              onClick={handleFavoriteClick}
              disabled={isLoadingFavorite}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
                isFavorite
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30"
                  : "bg-zinc-800/80 text-zinc-300 border border-zinc-700/50 hover:bg-zinc-700/80 hover:text-white"
              }`}
            >
              {isLoadingFavorite ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : isFavorite ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              )}
              {isFavorite ? "Favorita" : "Favorito"}
            </button>
          </div>
        </div>
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
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-white text-center mb-2">
            Inicia sesión para continuar
          </h3>

          {/* Description */}
          <p className="text-zinc-400 text-sm text-center mb-6">
            Guarda tu progreso, marca películas como vistas y crea tu lista de favoritos.
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

          {/* Later option */}
          <button
            onClick={() => setShowLoginPrompt(false)}
            className="w-full mt-4 text-zinc-500 text-sm hover:text-zinc-300 transition-colors"
          >
            Quizás más tarde
          </button>
        </div>
      </Modal>
    </div>
  );
}
