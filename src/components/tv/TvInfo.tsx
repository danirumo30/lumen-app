"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { supabase } from "@/lib/supabase";

interface TvShow {
  id: string;
  tmdbId: number;
  title: string;
  originalTitle: string;
  overview: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  firstAirDate: string;
  lastAirDate: string | null;
  releaseYear: number | null;
  genres: { id: number; name: string }[];
  rating: number | null;
  voteCount: number;
  certification: string | null;
  status: string;
  tagline: string | null;
  numberOfSeasons: number;
  numberOfEpisodes: number;
  inProduction: boolean;
  networks: { id: number; name: string; logoPath: string | null }[];
  createdBy: { id: number; name: string; profilePath: string | null }[];
}

interface FavoriteStatus {
  favorite: boolean;
  favoritedAt: string | null;
}

interface TvInfoProps {
  tv: TvShow;
  isSeriesWatched: boolean;
  favoriteStatus: FavoriteStatus;
  onSeriesToggle: (mark: boolean) => void;
  onFavoriteToggle: (favorite: boolean) => void;
  initialIsLoggedIn?: boolean;
}

export function TvInfo({ 
  tv, 
  isSeriesWatched, 
  favoriteStatus, 
  onSeriesToggle, 
  onFavoriteToggle,
  initialIsLoggedIn = false,
}: TvInfoProps) {
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Returning Series":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "Ended":
        return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
      case "Cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
    }
  };

  const handleSeriesClick = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      setShowLoginPrompt(true);
      return;
    }
    
    onSeriesToggle(!isSeriesWatched);
  };

  const handleFavoriteClick = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      setShowLoginPrompt(true);
      return;
    }
    
    onFavoriteToggle(!favoriteStatus.favorite);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6 md:gap-8 mb-8 md:mb-12">
        {/* Poster - igual de grande que películas en todas las vistas */}
        <div className="relative">
          <div className="sticky top-24">
            {tv.posterUrl ? (
              <img
                src={tv.posterUrl}
                alt={tv.title}
                className="w-full rounded-2xl shadow-2xl shadow-black/50"
              />
            ) : (
              <div className="aspect-[2/3] rounded-2xl bg-zinc-800 flex items-center justify-center">
                <svg className="w-16 h-16 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-5">
          {/* Title - prominente */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight">{tv.title}</h1>
            {tv.originalTitle !== tv.title && (
              <p className="text-zinc-400 mt-1">{tv.originalTitle}</p>
            )}
          </div>

          {/* Meta info - Minimalista y limpio */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {tv.certification && (
              <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-medium">
                {tv.certification}
              </span>
            )}
            {tv.releaseYear && (
              <span className="text-white font-medium">{tv.releaseYear}</span>
            )}
            <span className="text-zinc-600">•</span>
            <span className="text-white">{tv.numberOfSeasons} {tv.numberOfSeasons === 1 ? "temporada" : "temporadas"}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-white">{tv.numberOfEpisodes} episodios</span>
          </div>

          {/* Status y Rating - Fila separada para claridad */}
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(tv.status)}`}>
              {tv.status}
            </span>
            {tv.rating && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                <span className="font-bold text-white text-lg">{tv.rating.toFixed(1)}</span>
                <span className="text-zinc-500 text-xs">({tv.voteCount.toLocaleString()})</span>
              </div>
            )}
          </div>

          {/* Genres - Pills minimalistas */}
          {tv.genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tv.genres.map((genre) => (
                <span
                  key={genre.id}
                  className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300"
                >
                  {genre.name}
                </span>
              ))}
            </div>
          )}

          {/* Networks y Created by - Compactos */}
          {(tv.networks.length > 0 || tv.createdBy.length > 0) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-400">
              {tv.networks.length > 0 && (
                <div className="flex items-center gap-2">
                  {tv.networks.map((network) => (
                    network.logoPath ? (
                      <img key={network.id} src={network.logoPath} alt={network.name} className="h-5 object-contain brightness-75" />
                    ) : (
                      <span key={network.id} className="text-zinc-300">{network.name}</span>
                    )
                  ))}
                </div>
              )}
              {tv.createdBy.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-zinc-500">Creada por</span>
                  <span className="text-zinc-300">{tv.createdBy.map(c => c.name).join(", ")}</span>
                </div>
              )}
            </div>
          )}

          {/* Tagline */}
          {tv.tagline && (
            <p className="text-zinc-400 italic text-base">"{tv.tagline}"</p>
          )}

          {/* Overview */}
          {tv.overview && (
            <p className="text-zinc-300 leading-relaxed">{tv.overview}</p>
          )}

          {/* Air date details */}
          <div className="flex items-center gap-3 text-sm">
            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-zinc-400">
              Estreno: <span className="text-white">{formatDate(tv.firstAirDate)}</span>
            </span>
            {tv.lastAirDate && tv.lastAirDate !== tv.firstAirDate && (
              <>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400">
                  Final: <span className="text-white">{formatDate(tv.lastAirDate)}</span>
                </span>
              </>
            )}
            {isSeriesWatched && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Serie vista
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="border-t border-white/5 pt-5">
            <div className="flex gap-3">
              {/* Mark series button */}
              <button
                onClick={handleSeriesClick}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isSeriesWatched
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-rose-500/30 hover:border-rose-500/30 hover:text-rose-400"
                    : "bg-white text-zinc-900 hover:bg-zinc-200"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {isSeriesWatched ? "Serie vista" : "Marcar serie"}
              </button>

              {/* Favorite button */}
              <button
                onClick={handleFavoriteClick}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                  favoriteStatus.favorite
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30"
                    : "bg-zinc-800/80 text-zinc-300 border border-zinc-700/50 hover:bg-zinc-700/80 hover:text-white"
                }`}
              >
                {favoriteStatus.favorite ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                )}
                {favoriteStatus.favorite ? "Favorita" : "Favorito"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <Modal isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-2">Bienvenido a Lumen</h2>
          <p className="text-zinc-400 mb-4">
            Iniciá sesión para marcar series como vistas y agregar favoritos.
          </p>
          <div className="flex gap-3">
            <a
              href="/login"
              className="flex-1 bg-white text-zinc-900 py-2 px-4 rounded-lg font-semibold text-center hover:bg-zinc-200 transition-colors"
            >
              Iniciar sesión
            </a>
            <button
              onClick={() => setShowLoginPrompt(false)}
              className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
