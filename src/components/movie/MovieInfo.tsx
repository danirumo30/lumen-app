"use client";

import { useState } from "react";

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
}

interface WatchedStatus {
  watched: boolean;
  watchedAt: string | null;
}

interface MovieInfoProps {
  movie: Movie;
  watchedStatus: WatchedStatus;
  onWatchedChange: (watched: boolean) => void;
}

export function MovieInfo({ movie, watchedStatus, onWatchedChange }: MovieInfoProps) {
  const [isWatched, setIsWatched] = useState(watchedStatus.watched);
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);
    try {
      const newStatus = !isWatched;
      const response = await fetch("/api/user/movie-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdbId: movie.tmdbId,
          watched: newStatus,
        }),
      });

      if (response.ok) {
        setIsWatched(newStatus);
        onWatchedChange(newStatus);
      }
    } catch (error) {
      console.error("Error updating watched status:", error);
    } finally {
      setIsLoading(false);
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
        </div>

        {/* Watched section */}
        <div className="border-t border-white/5 pt-6">
          {isWatched ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-400">Vista</p>
                  <p className="text-xs text-zinc-400">
                    {watchedStatus.watchedAt && formatDate(watchedStatus.watchedAt.split("T")[0])}
                  </p>
                </div>
              </div>
              <button
                onClick={handleWatchedClick}
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-zinc-800/50 text-zinc-400 text-sm font-medium hover:bg-zinc-700/50 transition-all border border-zinc-700/50 disabled:opacity-50"
              >
                {isLoading ? "Quitando..." : "Quitar de vistas"}
              </button>
            </div>
          ) : (
            <button
              onClick={handleWatchedClick}
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-white text-zinc-900 text-sm font-semibold hover:bg-zinc-200 transition-all disabled:opacity-50"
            >
              {isLoading ? "Guardando..." : "Marcar como vista"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
