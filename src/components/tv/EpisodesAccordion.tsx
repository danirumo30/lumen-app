"use client";

import { useState } from "react";
import Image from "next/image";
import { Modal } from "@/components/ui/Modal";
import { supabase } from "@/lib/supabase";

interface Episode {
  id: number;
  episodeNumber: number;
  seasonNumber: number;
  name: string;
  airDate: string | null;
  overview: string | null;
  runtime: number | null;
  stillPath: string | null;
  voteAverage: number | null;
  voteCount: number;
  crew: Array<{
    id: number;
    name: string;
    job: string;
    profilePath: string | null;
  }>;
  guestStars: Array<{
    id: number;
    name: string;
    character: string;
    profilePath: string | null;
  }>;
}

interface Season {
  seasonNumber: number;
  name: string;
  episodeCount: number;
  airDate: string | null;
  overview: string | null;
  posterPath: string | null;
}

interface Episode {
  id: number;
  episodeNumber: number;
  seasonNumber: number;
  name: string;
  airDate: string | null;
  overview: string | null;
  runtime: number | null;
  stillPath: string | null;
  voteAverage: number | null;
  voteCount: number;
  crew: Array<{
    id: number;
    name: string;
    job: string;
    profilePath: string | null;
  }>;
  guestStars: Array<{
    id: number;
    name: string;
    character: string;
    profilePath: string | null;
  }>;
}

interface Season {
  seasonNumber: number;
  name: string;
  episodeCount: number;
  airDate: string | null;
  overview: string | null;
  posterPath: string | null;
}

interface EpisodesAccordionProps {
  tvTmdId: number;
  seasons: Season[];
  watchedEpisodes: Set<string>;
  
  getEpisodesForSeason: (seasonNumber: number) => Episode[];
  isSeasonComplete: (seasonNumber: number, episodes: Episode[]) => boolean;
  onEpisodeToggle: (seasonNumber: number, episodeNumber: number, watched: boolean) => void;
  onSeasonToggle: (seasonNumber: number, mark: boolean) => void;
  onMarkAllEpisodes?: () => void;
  isMarkingAll?: boolean;
}

export function EpisodesAccordion({ 
  tvTmdId, 
  seasons, 
  watchedEpisodes,
  getEpisodesForSeason,
  isSeasonComplete,
  onEpisodeToggle,
  onSeasonToggle,
  onMarkAllEpisodes,
  isMarkingAll = false,
}: EpisodesAccordionProps) {
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const getEpisodeKey = (season: number, episode: number) => `tv_${tvTmdId}_s${season}_e${episode}`;
  const isEpisodeWatched = (season: number, episode: number) => watchedEpisodes.has(getEpisodeKey(season, episode));

  const displaySeasons = seasons.filter(s => {
    if (s.seasonNumber === 0 && seasons.length > 1) return false;
    return true;
  });

  const toggleSeason = (seasonNumber: number) => {
    if (expandedSeason === seasonNumber) {
      setExpandedSeason(null);
    } else {
      setExpandedSeason(seasonNumber);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Fecha desconocida";
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatRuntime = (minutes: number | null) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getWatchedCount = (seasonNumber: number) => {
    const episodes = getEpisodesForSeason(seasonNumber);
    if (episodes.length > 0) {
      return episodes.filter(ep => isEpisodeWatched(ep.seasonNumber, ep.episodeNumber)).length;
    } else {
      
      const season = seasons.find(s => s.seasonNumber === seasonNumber);
      if (!season) return 0;
      let count = 0;
      for (let ep = 1; ep <= season.episodeCount; ep++) {
        if (watchedEpisodes.has(getEpisodeKey(seasonNumber, ep))) count++;
      }
      return count;
    }
  };

  
  const handleMarkAllEpisodes = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setShowLoginPrompt(true);
      return;
    }
    
    if (onMarkAllEpisodes) {
      onMarkAllEpisodes();
    } else {
      
      for (const season of displaySeasons) {
        await onSeasonToggle(season.seasonNumber, true);
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white/90">Episodios</h3>
        <button
          onClick={handleMarkAllEpisodes}
          disabled={isMarkingAll}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            isMarkingAll
              ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
              : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/25 transform hover:scale-105"
          }`}
        >
          {isMarkingAll ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Guardando...
            </span>
          ) : (
            "Todos los episodios"
          )}
        </button>
      </div>
      
      {displaySeasons.map((season) => {
        const isExpanded = expandedSeason === season.seasonNumber;
        const seasonEpisodes = getEpisodesForSeason(season.seasonNumber);
        const hasEpisodes = seasonEpisodes.length > 0;
        const totalInSeason = seasonEpisodes.length || season.episodeCount;
        const watchedInSeason = getWatchedCount(season.seasonNumber);
        
        const seasonComplete = isSeasonComplete(season.seasonNumber, seasonEpisodes);

        return (
          <div 
            key={season.seasonNumber}
            className="bg-zinc-900/50 rounded-xl border border-white/[0.05] overflow-hidden"
          >
            {}
            <div className="px-4 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
              {}
              <div className="flex items-center gap-3 sm:gap-4 flex-1">
                {}
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => toggleSeason(season.seasonNumber)}
                    className="block"
                  >
                     {season.posterPath ? (
                       <Image
                         src={season.posterPath}
                         alt={season.name}
                         width={48}
                         height={64}
                         className="object-cover rounded-lg"
                       />
                     ) : (
                      <div className="w-10 h-14 sm:w-12 sm:h-16 bg-zinc-800 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </button>
                  
                  {}
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const { data: { session } } = await supabase.auth.getSession();
                      if (!session) {
                        setShowLoginPrompt(true);
                        return;
                      }
                      onSeasonToggle(season.seasonNumber, !seasonComplete);
                    }}
                    className={`absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 hover:shadow-lg hover:shadow-cyan-500/40 ${
                      seasonComplete
                        ? "bg-rose-500 text-white hover:bg-rose-400 hover:shadow-rose-500/40"
                        : "bg-cyan-500 text-white hover:bg-cyan-400"
                    }`}
                    title={seasonComplete ? "Desmarcar temporada" : "Marcar temporada"}
                  >
                    {seasonComplete ? (
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                </div>
                
                {}
                <button
                  onClick={() => toggleSeason(season.seasonNumber)}
                  className="flex-1 text-left min-w-0"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-medium truncate">{season.name}</h4>
                      {seasonComplete && (
                        <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-400">
                      {totalInSeason} episodios
                      {season.airDate && ` • ${new Date(season.airDate).getFullYear()}`}
                      {watchedInSeason > 0 && (
                        <span className={`ml-2 ${watchedInSeason === totalInSeason ? "text-emerald-400" : "text-cyan-400"}`}>
                          • {watchedInSeason}/{totalInSeason} vistos
                        </span>
                      )}
                    </p>
                  </div>
                </button>
              </div>
              
              {}
              <button
                onClick={() => toggleSeason(season.seasonNumber)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors flex-shrink-0`}
                aria-label={isExpanded ? "Colapsar temporada" : "Expandir temporada"}
              >
                <svg
                  className={`w-5 h-5 text-zinc-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {}
            {isExpanded && (
              <div className="border-t border-white/[0.05]">
                {!hasEpisodes ? (
                  <div className="p-8 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.03]">
                    {seasonEpisodes.map((episode) => {
                      const watched = isEpisodeWatched(episode.seasonNumber, episode.episodeNumber);
                      
                      return (
                        <div key={episode.id} className="p-3 sm:p-4 hover:bg-white/[0.02] transition-colors">
                          <div className="flex gap-2 sm:gap-4">
                             {}
                             {episode.stillPath ? (
                               <Image
                                 src={episode.stillPath}
                                 alt={episode.name}
                                 width={112}  
                                 height={72}   
                                 className={`object-cover rounded-lg flex-shrink-0 transition-all ${watched ? "opacity-60" : ""}`}
                                 sizes="(max-width: 640px) 80px, 112px"
                               />
                             ) : (
                              <div className={`w-20 h-14 sm:w-28 sm:h-[72px] rounded-lg flex-shrink-0 flex items-center justify-center transition-all ${watched ? "bg-emerald-900/30 opacity-60" : "bg-zinc-800"}`}>
                                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                              {}
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                                  <span className="text-zinc-500 text-xs sm:text-sm font-mono flex-shrink-0">
                                    {episode.seasonNumber}x{episode.episodeNumber.toString().padStart(2, "0")}
                                  </span>
                                  <h5 className={`font-medium text-sm sm:text-base truncate ${watched ? "text-emerald-400" : "text-white"}`}>
                                    {episode.name}
                                  </h5>
                                  {watched && (
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                  {}
                                  <button
                                    onClick={async () => {
                                      const { data: { session } } = await supabase.auth.getSession();
                                      if (!session) {
                                        setShowLoginPrompt(true);
                                        return;
                                      }
                                      onEpisodeToggle(episode.seasonNumber, episode.episodeNumber, !watched);
                                    }}
                                    className={`p-1.5 rounded-lg transition-all ${
                                      watched
                                        ? "bg-emerald-500/20 text-emerald-400 hover:bg-rose-500/30 hover:text-rose-400"
                                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                                    }`}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </button>
                                  
                                  {episode.voteAverage && episode.voteAverage > 0 && (
                                    <div className="flex items-center gap-1 text-amber-400 text-sm">
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                      </svg>
                                      <span className="font-medium">{episode.voteAverage.toFixed(1)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {}
                              <div className="flex items-center gap-3 text-sm text-zinc-400 mb-2">
                                {episode.airDate && <span>{formatDate(episode.airDate)}</span>}
                                {episode.runtime && <span>{formatRuntime(episode.runtime)}</span>}
                              </div>
                              
                              {}
                              {episode.overview && (
                                <p className={`text-sm leading-relaxed ${watched ? "text-zinc-500" : "text-zinc-300"} line-clamp-2`}>
                                  {episode.overview}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {}
      <Modal isOpen={showLoginPrompt} onClose={() => setShowLoginPrompt(false)}>
        <div className="p-6">
          {}
          <button
            onClick={() => setShowLoginPrompt(false)}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {}
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          {}
          <h3 className="text-xl font-semibold text-white text-center mb-2">
            Inicia sesión para continuar
          </h3>

          {}
          <p className="text-zinc-400 text-sm text-center mb-6">
            Marca episodios como vistos y guarda tu progreso de series.
          </p>

          {}
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

