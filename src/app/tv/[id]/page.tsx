"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { TvInfo } from "@/components/tv/TvInfo";
import { EpisodesAccordion } from "@/components/tv/EpisodesAccordion";
import { SimilarMediaCarousel } from "@/components/tv/SimilarTvCarousel";
import { CastCarousel } from "@/components/movie/CastCarousel";
import { ErrorToast, useToasts } from "@/components/ui/Toast";
import { supabase } from "@/lib/supabase";
import {
  useWatchedEpisodeSet,
  useEpisodeToggle,
  episodeKeys,
} from "@/modules/media/infrastructure/hooks";


interface EpisodeData {
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
  seasons: Array<{
    seasonNumber: number;
    name: string;
    episodeCount: number;
    airDate: string | null;
    overview: string | null;
    posterPath: string | null;
  }>;
  cast: Array<{
    id: number;
    name: string;
    character: string;
    profileUrl: string | null;
    order: number;
  }>;
  inProduction: boolean;
  networks: { id: number; name: string; logoPath: string | null }[];
  createdBy: { id: number; name: string; profilePath: string | null }[];
  watchProviders?: {
    link: string;
    providers: Array<{
      id: number;
      name: string;
      logoUrl: string | null;
      type: "subscription" | "free" | "ads" | "rent" | "buy";
    }>;
  } | null;
}

interface FavoriteStatus {
  favorite: boolean;
  favoritedAt: string | null;
}

interface SimilarTvShow {
  id: string;
  tmdbId: number;
  title: string;
  posterUrl: string | null;
  releaseYear: number | null;
  firstAirDate: string;
  rating: number | null;
}

interface UserSession {
  access_token: string;
  user: {
    id: string;
    email?: string;
  };
}

interface SeasonEpisodes {
  [seasonNumber: number]: EpisodeData[];
}

export default function TvDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  
  const queryClient = useQueryClient();
  
  const [tv, setTv] = useState<TvShow | null>(null);
  const [similar, setSimilar] = useState<SimilarTvShow[]>([]);
  const [session, setSession] = useState<UserSession | null>(null);
  const [favoriteStatus, setFavoriteStatus] = useState<FavoriteStatus>({ favorite: false, favoritedAt: null });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [seasonEpisodes, setSeasonEpisodes] = useState<SeasonEpisodes>({});
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  
  
  const [seriesWatchedFromAPI, setSeriesWatchedFromAPI] = useState<boolean>(false);
  
  
  const [showMarkAllModal, setShowMarkAllModal] = useState<boolean>(false);
  
  const { toasts, showToast, dismissToast } = useToasts();
  const isLoadingEpisodesRef = useRef(false);
   
   
  
  
  
  
  const { data: watchedSet } = useWatchedEpisodeSet(tv?.tmdbId ?? null);
  
  
  const toggleMutation = useEpisodeToggle(tv?.tmdbId ?? null);
  
  const getEpisodeKey = useCallback((season: number, episode: number) => {
    return `tv_${tv?.tmdbId}_s${season}_e${episode}`;
  }, [tv?.tmdbId]);
  
  const isSeasonComplete = useCallback((seasonNumber: number, episodes: EpisodeData[]) => {
    
    if (!watchedSet || episodes.length === 0) return false;
    
    return episodes.every(ep => {
      const key = getEpisodeKey(ep.seasonNumber, ep.episodeNumber);
      return watchedSet.has(key);
    });
   }, [watchedSet, getEpisodeKey]);
   
   const isSeriesWatched = seriesWatchedFromAPI;
  
  const watchedCount = watchedSet?.size ?? 0;
  
  const totalEpisodes = tv?.seasons.reduce((sum, s) => sum + s.episodeCount, 0) ?? 0;
  
  
  
  
   const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
     const headers = {
       ...options.headers,
       "Content-Type": "application/json",
       ...(session?.access_token ? { "Authorization": `Bearer ${session.access_token}` } : {}),
     };
     return fetch(url, { ...options, headers });
   }, [session]);
  
  
  
  
  
   const loadSeasonEpisodes = useCallback(async (seasonNumber: number): Promise<EpisodeData[]> => {
     if (!tv) return [];
     
     try {
       const res = await fetch(`/api/tv/${tv.id}/season/${seasonNumber}`);
       if (res.ok) {
         const data = await res.json();
         return data.episodes || [];
       }
     } catch (e) {
       console.error("Error fetching season:", e);
     }
     return [];
   }, [tv]);
  
    const loadAllSeasonsEpisodes = useCallback(async () => {
      if (!tv || isLoadingEpisodesRef.current) return;
      
      isLoadingEpisodesRef.current = true;
      setIsLoadingEpisodes(true);
      try {
        const seasonPromises = tv.seasons.map(async (season) => {
          const episodes = await loadSeasonEpisodes(season.seasonNumber);
          return { seasonNumber: season.seasonNumber, episodes };
        });
        
        const results = await Promise.all(seasonPromises);
        
        const bySeason: SeasonEpisodes = {};
        for (const result of results) {
          bySeason[result.seasonNumber] = result.episodes;
        }
        setSeasonEpisodes(bySeason);
      } finally {
        setIsLoadingEpisodes(false);
        isLoadingEpisodesRef.current = false;
      }
    }, [tv, loadSeasonEpisodes]);
  
  const getEpisodesForSeason = (seasonNumber: number): EpisodeData[] => {
    return seasonEpisodes[seasonNumber] || [];
  };
  
  
  
  
  
  const handleSeriesToggle = async (mark: boolean) => {
    if (!tv) return;
    
    try {
      const response = await fetchWithAuth("/api/user/tv-status", {
        method: "POST",
        body: JSON.stringify({
          tmdbId: tv.tmdbId,
          watched: mark,
          tvData: {
            title: tv.title,
            originalTitle: tv.originalTitle,
            releaseYear: tv.releaseYear,
            firstAirDate: tv.firstAirDate,
            posterPath: tv.posterUrl,
          },
        }),
      });
      
      if (response.ok) {
        setSeriesWatchedFromAPI(mark);
        
        window.dispatchEvent(new CustomEvent('episode-sync-success', { detail: { type: 'series' } }));
      }
    } catch (err) {
      console.error("Error toggling series:", err);
    }
  };
  
  const handleEpisodeToggle = async (seasonNumber: number, episodeNumber: number, watched: boolean) => {
    const episodes = seasonEpisodes[seasonNumber];
    const episode = episodes?.find(ep => ep.episodeNumber === episodeNumber);
    const runtime = episode?.runtime ?? undefined;
    
    toggleMutation.mutate({
      season: seasonNumber,
      episode: episodeNumber,
      watched,
      runtime,
    }, {
      onError: () => {
        showToast("Error al actualizar episodio", "error");
      },
      onSuccess: () => {
        
        if (watched && !seriesWatchedFromAPI) {
          activateSeries();
        }
      },
    });
  };
  
  
  const activateSeries = async () => {
    if (!tv) {
      return;
    }
    
    if (!session?.access_token) {
      showToast("Iniciá sesión para marcar series vistas", "error");
      return;
    }
    
    try {
      const response = await fetchWithAuth("/api/user/tv-status", {
        method: "POST",
        body: JSON.stringify({
          tmdbId: tv.tmdbId,
          watched: true,
          tvData: {
            title: tv.title,
            originalTitle: tv.originalTitle,
            releaseYear: tv.releaseYear,
            firstAirDate: tv.firstAirDate,
            posterPath: tv.posterUrl,
          },
        }),
      });
      
      if (response.ok) {
        setSeriesWatchedFromAPI(true);
      } else {
        const errorText = await response.text();
        console.error("[activateSeries] API error:", response.status, errorText);
        showToast("Error al marcar serie como vista", "error");
      }
    } catch (err) {
      console.error("[activateSeries] Error:", err);
      showToast("Error al marcar serie como vista", "error");
    }
  };
  
  const handleSeasonToggle = async (seasonNumber: number, mark: boolean) => {
    const episodes = seasonEpisodes[seasonNumber];
    if (!episodes || episodes.length === 0) return;
    
    const isComplete = isSeasonComplete(seasonNumber, episodes);
    if (mark === isComplete) return; 
    
    const batchEpisodes = episodes.map(ep => ({
      season: seasonNumber,
      episode: ep.episodeNumber,
      watched: mark,
      runtime: ep.runtime ?? undefined,
    }));
    
    await toggleSeasonEpisodes(seasonNumber, batchEpisodes, mark);
  };
  
  
  const toggleSeasonEpisodes = async (
    seasonNumber: number, 
    episodes: Array<{ season: number; episode: number; watched: boolean; runtime?: number }>,
    mark: boolean
  ) => {
    if (!tv || !session?.access_token) return;
    
    try {
      const response = await fetchWithAuth("/api/user/episode-status", {
        method: "POST",
        body: JSON.stringify({
          tvTmdId: tv.tmdbId,
          episodes: episodes.map(ep => ({
            seasonNumber: ep.season,
            episodeNumber: ep.episode,
            watched: ep.watched,
            runtime: ep.runtime ?? 0,
          })),
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update episodes");
      }
      
      
      if (mark && !seriesWatchedFromAPI) {
        await activateSeries();
      }
      
      
      queryClient.invalidateQueries({ queryKey: episodeKeys.watched(tv.tmdbId) });
      
      
      window.dispatchEvent(new CustomEvent('episode-sync-success', { detail: { type: 'season-toggle' } }));
      
      
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      }, 100);
      
    } catch (err) {
      console.error("Error toggling season:", err);
      showToast("Error al actualizar temporada", "error");
    }
  };
  
  
  const handleMarkAllEpisodes = async (forceAction?: 'mark' | 'unmark') => {
    if (!tv) {
      return;
    }
    
    
    const totalSeasons = tv.seasons.length;
    const loadedSeasons = Object.keys(seasonEpisodes).length;
    
    if (loadedSeasons < totalSeasons) {
      showToast("Cargando episodios...", "success");
      await loadAllSeasonsEpisodes();
    }
    
    
    let actualWatchedCount = 0;
    let actualTotalCount = 0;
    
    for (const season of tv.seasons) {
      const episodes = seasonEpisodes[season.seasonNumber];
      if (episodes && episodes.length > 0) {
        actualTotalCount += episodes.length;
        for (const ep of episodes) {
          const key = getEpisodeKey(season.seasonNumber, ep.episodeNumber);
          if (watchedSet?.has(key)) {
            actualWatchedCount++;
          }
        }
      } else {
        actualTotalCount += season.episodeCount;
      }
    }
    
    const noneMarked = actualWatchedCount === 0;
    const allMarked = actualWatchedCount >= actualTotalCount && actualTotalCount > 0;
    
    let action: 'mark' | 'unmark';
    if (forceAction) {
      action = forceAction;
    } else if (noneMarked) {
      action = 'mark';
    } else if (allMarked) {
      action = 'unmark';
    } else {
      setShowMarkAllModal(true);
      return;
    }
    
    setShowMarkAllModal(false);
    
     if (action === 'mark') {
       await markAllEpisodes();
     } else {
       await unmarkAllEpisodes();
     }
  };
  
   const markAllEpisodes = async () => {
     if (!tv || !session?.access_token) {
       return;
     }

     showToast("Marcando todos los episodios...", "success");
    
    
    const episodesToMark: Array<{ seasonNumber: number; episodeNumber: number; watched: boolean; runtime: number }> = [];
    
    for (const season of tv.seasons) {
      const episodes = seasonEpisodes[season.seasonNumber];
      
      if (episodes && episodes.length > 0) {
        for (const ep of episodes) {
          episodesToMark.push({
            seasonNumber: season.seasonNumber,
            episodeNumber: ep.episodeNumber,
            watched: true,
            runtime: ep.runtime ?? 0,
          });
        }
      } else {
        
        
        const fetchedEpisodes = await loadSeasonEpisodes(season.seasonNumber);
        
        if (fetchedEpisodes.length > 0) {
          for (const ep of fetchedEpisodes) {
            episodesToMark.push({
              seasonNumber: season.seasonNumber,
              episodeNumber: ep.episodeNumber,
              watched: true,
              runtime: ep.runtime ?? 0,
            });
          }
        } else {
          for (let epNum = 1; epNum <= season.episodeCount; epNum++) {
            episodesToMark.push({
              seasonNumber: season.seasonNumber,
              episodeNumber: epNum,
              watched: true,
              runtime: 0,
            });
          }
        }
      }
    }
    
    if (episodesToMark.length === 0) {
      showToast("No hay episodios para marcar", "error");
      return;
    }
    
    try {
      const response = await fetchWithAuth("/api/user/episode-status", {
        method: "POST",
        body: JSON.stringify({
          tvTmdId: tv.tmdbId,
          episodes: episodesToMark,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to mark episodes");
      }
      
      await activateSeries();
      
      
      
      queryClient.invalidateQueries({ queryKey: episodeKeys.watched(tv.tmdbId) });
      queryClient.invalidateQueries({ queryKey: ["episodes"] });
      
      queryClient.invalidateQueries({ queryKey: ["tv-status"] });
      
      
      window.dispatchEvent(new CustomEvent('episode-sync-success', { detail: { type: 'series' } }));
      
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["profile"] });
        window.dispatchEvent(new CustomEvent('episode-sync-success', { detail: { type: 'stats' } }));
      }, 100);
      
      showToast(`✓ ${episodesToMark.length} episodios marcados`, "success");
      
    } catch (err) {
      console.error("Error marking all episodes:", err);
      showToast("Error al marcar episodios", "error");
    }
  };
  
  const unmarkAllEpisodes = async () => {
    if (!tv || !session?.access_token) return;
    
    
    const allEpisodeKeys: Array<{ seasonNumber: number; episodeNumber: number; watched: boolean; runtime: number }> = [];
    
    for (const season of tv.seasons) {
      const episodes = seasonEpisodes[season.seasonNumber];
      
      if (episodes && episodes.length > 0) {
        for (const ep of episodes) {
          allEpisodeKeys.push({
            seasonNumber: season.seasonNumber,
            episodeNumber: ep.episodeNumber,
            watched: false,
            runtime: 0,
          });
        }
      } else {
        for (let epNum = 1; epNum <= season.episodeCount; epNum++) {
          allEpisodeKeys.push({
            seasonNumber: season.seasonNumber,
            episodeNumber: epNum,
            watched: false,
            runtime: 0,
          });
        }
      }
    }
    
    try {
      const response = await fetchWithAuth("/api/user/episode-status", {
        method: "POST",
        body: JSON.stringify({
          tvTmdId: tv.tmdbId,
          episodes: allEpisodeKeys,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to unmark episodes");
      }
      
      
      
      
      queryClient.invalidateQueries({ queryKey: episodeKeys.watched(tv.tmdbId) });
      queryClient.invalidateQueries({ queryKey: ["episodes"] });
      
      
      window.dispatchEvent(new CustomEvent('episode-sync-success', { detail: { type: 'unmark-all' } }));
      
      
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      }, 100);
      
      showToast("Episodios desmarcados", "success");
      
    } catch (err) {
      console.error("Error unmarking all episodes:", err);
      showToast("Error al desmarcar episodios", "error");
    }
  };
  
   const handleFavoriteToggle = async (favorite: boolean) => {
     if (!tv) return;
     
     try {
       const response = await fetchWithAuth("/api/user/tv-favorite", {
         method: "POST",
         body: JSON.stringify({
           tmdbId: tv.tmdbId,
           favorite,
         }),
       });
       
       if (!response.ok) {
         const errorText = await response.text();
         console.error("[handleFavoriteToggle] API error:", response.status, errorText);
         showToast("Error al actualizar favorito", "error");
         return;
       }
       
       setFavoriteStatus({ favorite, favoritedAt: favorite ? new Date().toISOString() : null });
     } catch (err) {
       console.error("Error toggling favorite:", err);
       showToast("Error al actualizar favorito", "error");
     }
   };
  
  
  
  
   useEffect(() => {
     const fetchData = async () => {
       try {
         const { data: sessionData } = await supabase.auth.getSession();
         const authHeaders = {
           "Authorization": `Bearer ${sessionData?.session?.access_token || ""}`,
         };
         setSession(sessionData?.session || null);

         const tmdbId = id.replace(/^(tv_|tmdb_)/, '');

         const [tvRes, similarRes, favoriteRes] = await Promise.all([
           fetch(`/api/tv/${id}`),
           fetch(`/api/tv/${id}/similar`),
           fetch(`/api/user/tv-favorite?tmdbId=${tmdbId}`, { headers: authHeaders }),
         ]);

         if (!tvRes.ok) {
           throw new Error("Failed to fetch TV show");
         }

         const tvData = await tvRes.json();
         const similarData = await similarRes.json();
         const favoriteData = await favoriteRes.json();

         setTv(tvData);
         setSimilar(similarData.results || []);
         setFavoriteStatus(favoriteData);
       } catch (err) {
         console.error("Error fetching TV show data:", err);
         setError("Failed to load TV show details");
       } finally {
         setIsLoading(false);
       }
     };

     fetchData();
   }, [id]);

  
  useEffect(() => {
    if (!tv) return;

    const loadInitialData = async () => {
      await loadAllSeasonsEpisodes();
      
      
      if (session?.access_token) {
        try {
          const seriesRes = await fetchWithAuth(`/api/user/tv-status?tmdbId=${tv.tmdbId}`);
          if (seriesRes.ok) {
            const seriesData = await seriesRes.json();
            setSeriesWatchedFromAPI(seriesData.watched);
          }
        } catch (err) {
          console.error("Error loading series status:", err);
        }
      }
    };

    loadInitialData();
   }, [tv, session, fetchWithAuth, loadAllSeasonsEpisodes]);

  
  
  
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

   if (error || !tv) {
     return (
       <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
         <div className="text-center">
           <p className="text-zinc-400 mb-4">{error || "TV show not found"}</p>
           <Link href="/" className="text-white hover:underline">
             Volver al inicio
           </Link>
         </div>
       </div>
     );
   }

  return (
     <div className="min-h-screen bg-zinc-950">
       {tv.backdropUrl && (
         <div className="fixed inset-0 -z-10">
           <Image
             src={tv.backdropUrl}
             alt=""
             fill
             className="object-cover opacity-20 blur-2xl"
           />
           <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/50 via-zinc-950/80 to-zinc-950" />
         </div>
       )}

       <div className="max-w-7xl mx-auto px-4 py-8">
         <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
           </svg>
           <span>Volver</span>
         </Link>

        <TvInfo
          tv={tv}
          isSeriesWatched={isSeriesWatched}
          favoriteStatus={favoriteStatus}
          onSeriesToggle={handleSeriesToggle}
          onFavoriteToggle={handleFavoriteToggle}
          watchProviders={tv.watchProviders}
        />

        {tv.seasons && tv.seasons.length > 0 && (
          <div className="mb-12">
            <EpisodesAccordion
              tvTmdId={tv.tmdbId}
              seasons={tv.seasons}
              watchedEpisodes={watchedSet ?? new Set()}
              isSeasonComplete={isSeasonComplete}
              getEpisodesForSeason={getEpisodesForSeason}
              onEpisodeToggle={handleEpisodeToggle}
              onSeasonToggle={handleSeasonToggle}
              onMarkAllEpisodes={handleMarkAllEpisodes}
              isMarkingAll={isLoadingEpisodes || toggleMutation.isPending}
            />
          </div>
        )}

        {tv.cast && tv.cast.length > 0 && (
          <CastCarousel cast={tv.cast} />
        )}

        <SimilarMediaCarousel items={similar} type="tv" />
        
        {}
        {showMarkAllModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="text-lg font-semibold text-white mb-2">Episodios marcados</h3>
              <p className="text-zinc-400 text-sm mb-6">
                Hay {watchedCount} de {totalEpisodes} episodios marcados. ¿Qué querés hacer?
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleMarkAllEpisodes('mark')}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-medium transition-all"
                >
                  Marcar todos ({totalEpisodes - watchedCount} restantes)
                </button>
                <button
                  onClick={() => handleMarkAllEpisodes('unmark')}
                  className="w-full py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-all"
                >
                  Desmarcar todos ({watchedCount} marcados)
                </button>
                <button
                  onClick={() => setShowMarkAllModal(false)}
                  className="w-full py-3 px-4 rounded-xl border border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-medium transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {}
      {toasts.map((toast) => (
        <ErrorToast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onRetry={toast.onRetry}
          onDismiss={() => dismissToast(toast.id)}
        />
      ))}
    </div>
  );
}

