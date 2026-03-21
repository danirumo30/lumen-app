"use client";

import { useState, useEffect, use } from "react";
import { MovieInfo } from "@/components/movie/MovieInfo";
import { CastCarousel } from "@/components/movie/CastCarousel";
import { SimilarMoviesCarousel } from "@/components/movie/SimilarMoviesCarousel";

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

export default function MovieDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [movie, setMovie] = useState<Movie | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [similar, setSimilar] = useState<SimilarMovie[]>([]);
  const [watchedStatus, setWatchedStatus] = useState<WatchedStatus>({ watched: false, watchedAt: null });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch movie details, credits, and similar in parallel
        const [movieRes, creditsRes, similarRes, watchedRes] = await Promise.all([
          fetch(`/api/movie/${id}`),
          fetch(`/api/movie/${id}/credits`),
          fetch(`/api/movie/${id}/similar`),
          fetch(`/api/user/movie-status?tmdbId=${id.replace('tmdb_', '')}`),
        ]);

        if (!movieRes.ok) {
          throw new Error("Failed to fetch movie");
        }

        const movieData = await movieRes.json();
        const creditsData = await creditsRes.json();
        const similarData = await similarRes.json();
        const watchedData = await watchedRes.json();

        setMovie(movieData);
        setCast(creditsData.cast || []);
        setSimilar(similarData.results || []);
        setWatchedStatus(watchedData);
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
          onWatchedChange={(watched) => {
            setWatchedStatus({
              watched,
              watchedAt: watched ? new Date().toISOString() : null,
            });
          }}
        />

        {/* Cast */}
        <CastCarousel cast={cast} />

        {/* Similar movies */}
        <SimilarMoviesCarousel movies={similar} />
      </div>
    </div>
  );
}
