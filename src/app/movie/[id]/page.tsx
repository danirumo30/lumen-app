"use client";

import { useState, useEffect, use } from "react";
import { MovieInfo } from "@/components/movie/MovieInfo";
import { CastCarousel } from "@/components/movie/CastCarousel";
import { SimilarMoviesCarousel } from "@/components/movie/SimilarMoviesCarousel";
import { WatchProvidersCarousel } from "@/components/shared/WatchProvidersCarousel";
import { supabase } from "@/lib/supabase";

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
    providers: Array<{
      id: number;
      name: string;
      logoUrl: string | null;
      type: "subscription" | "free" | "ads" | "rent" | "buy";
    }>;
  } | null;
}

interface CastMember {
  id: number;
  name: string;
  character: string;
  profileUrl: string | null;
  order: number;
}

interface SimilarMovie {
  id: string;
  tmdbId: number;
  title: string;
  posterUrl: string | null;
  releaseDate: string | null;
  releaseYear: number | null;
  rating: number | null;
  overview: string;
}

interface WatchedStatus {
  watched: boolean;
  watchedAt: string | null;
}

interface FavoriteStatus {
  favorite: boolean;
  favoritedAt: string | null;
}

export default function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [movie, setMovie] = useState<Movie | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [similar, setSimilar] = useState<SimilarMovie[]>([]);
  const [watchedStatus, setWatchedStatus] = useState<WatchedStatus>({ watched: false, watchedAt: null });
  const [favoriteStatus, setFavoriteStatus] = useState<FavoriteStatus>({ favorite: false, favoritedAt: null });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to extract TMDB ID from media ID (e.g., "movie_1159559" -> "1159559")
  const extractTmdbId = (mediaId: string): string | null => {
    const match = mediaId.match(/^(movie_|tmdb_)(\d+)$/);
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

        // Extract TMDB ID for API calls
        const tmdbId = extractTmdbId(id) || id;
        
        // Fetch movie details, credits, similar, watched status, and favorite status in parallel
        const [movieRes, creditsRes, similarRes, watchedRes, favoriteRes] = await Promise.all([
          fetch(`/api/movie/${id}`),
          fetch(`/api/movie/${id}/credits`),
          fetch(`/api/movie/${id}/similar`),
          fetch(`/api/user/movie-status?tmdbId=${tmdbId}`, { headers: authHeaders }),
          fetch(`/api/user/movie-favorite?tmdbId=${tmdbId}`, { headers: authHeaders }),
        ]);

        if (!movieRes.ok) {
          throw new Error("Failed to fetch movie");
        }

        const movieData = await movieRes.json();
        const creditsData = await creditsRes.json();
        const similarData = await similarRes.json();
        const watchedData = await watchedRes.json();
        const favoriteData = await favoriteRes.json();

        setMovie(movieData);
        setCast(creditsData.cast || []);
        setSimilar(similarData.results || []);
        setWatchedStatus(watchedData);
        setFavoriteStatus(favoriteData);
      } catch (err) {
        console.error("Error fetching movie data:", err);
        setError("Failed to load movie details");
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

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">{error || "Movie not found"}</p>
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
      {movie.backdropUrl && (
        <div className="fixed inset-0 -z-10">
          <img
            src={movie.backdropUrl}
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
        <MovieInfo
          movie={movie}
          watchedStatus={watchedStatus}
          favoriteStatus={favoriteStatus}
          onWatchedChange={(watched) => {
            setWatchedStatus({
              watched,
              watchedAt: watched ? new Date().toISOString() : null,
            });
          }}
          onFavoriteChange={(favorite) => {
            setFavoriteStatus({
              favorite,
              favoritedAt: favorite ? new Date().toISOString() : null,
            });
          }}
        />

        {/* Watch Providers */}
        {movie.watchProviders?.providers && movie.watchProviders.providers.length > 0 && (
          <WatchProvidersCarousel 
            providers={movie.watchProviders.providers} 
            title="Dónde ver"
          />
        )}

        {/* Cast */}
        <CastCarousel cast={cast} />

        {/* Similar movies */}
        <SimilarMoviesCarousel movies={similar} />
      </div>
    </div>
  );
}
