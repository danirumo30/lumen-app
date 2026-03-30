"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/infrastructure/contexts/AuthContext";
import { Carousel } from "@/components/home/Carousel";
import { HomepageSkeleton } from "@/components/home/CarouselSkeleton";

interface TrendingItem {
  id: string;
  title: string;
  name?: string;
  posterUrl: string | null;
  coverUrl?: string | null;
  voteAverage?: number | null;
  rating?: number | null;
  releaseDate?: string;
  firstAirDate?: string;
  date?: string;
  overview?: string;
  summary?: string;
  providers?: { id: number; name: string; logoUrl: string }[];
  platformLogos?: { id: number; name: string; platformName?: string; logoUrl: string | null; key?: string }[];
}

export default function HomePage() {
  const [movies, setMovies] = useState<TrendingItem[]>([]);
  const [tvShows, setTvShows] = useState<TrendingItem[]>([]);
  const [games, setGames] = useState<TrendingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
   const { user } = useAuth();

  useEffect(() => {
    async function fetchData() {
      try {
        const [moviesRes, tvRes, gamesRes] = await Promise.all([
          fetch("/api/trending/movies"),
          fetch("/api/trending/tv"),
          fetch("/api/trending/games"),
        ]);

        if (!moviesRes.ok || !tvRes.ok || !gamesRes.ok) {
          throw new Error("Failed to fetch trending data");
        }

        const [moviesData, tvData, gamesData] = await Promise.all([
          moviesRes.json(),
          tvRes.json(),
          gamesRes.json(),
        ]);

        setMovies(moviesData.results || []);
        setTvShows(tvData.results || []);
        setGames(gamesData.results || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
          <p className="text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <HomepageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {}
      <section className="relative pt-16 overflow-hidden">
        {}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 via-zinc-950 to-zinc-950" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="max-w-2xl">
            {user ? (
              <>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                  Bienvenido de nuevo,
                  <br />
                  <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    {user.username || user.email?.split('@')[0]}
                  </span>
                </h1>
                <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
                  Descubre qué está trending esta semana. Tu próxima obsesión te espera.
                </p>
                <div className="flex gap-4">
                  <Link
                    href="/search"
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
                  >
                    Explorar
                  </Link>
                  <Link
                    href={`/profile/${user.username}`}
                    className="px-6 py-3 bg-zinc-800/50 hover:bg-zinc-700/50 text-white font-medium rounded-xl transition-all border border-zinc-700/50 hover:border-zinc-600/50"
                  >
                    Mi perfil
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                  Tu universo,
                  <br />
                  <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    tu historia.
                  </span>
                </h1>
                <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
                  Rastrea películas, series y videojuegos. Encuentra lo que tus amigos están viendo. 
                  Descubre tu próxima obsesión.
                </p>
                <div className="flex gap-4">
                  <Link
                    href="/search"
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
                  >
                    Explorar
                  </Link>
                  <Link
                    href="/rankings"
                    className="px-6 py-3 bg-zinc-800/50 hover:bg-zinc-700/50 text-white font-medium rounded-xl transition-all border border-zinc-700/50 hover:border-zinc-600/50"
                  >
                    Rankings
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {}
      <main className="max-w-7xl mx-auto px-6">
        <Carousel
          title="Películas en tendencia"
          subtitle="Las películas más populares de esta semana"
          items={movies.map(m => ({ 
            ...m, 
            rating: m.voteAverage,
            date: m.releaseDate || "Desconocida",
            providers: m.providers
          }))}
          variant="movies"
        />

        <Carousel
          title="Series en tendencia"
          subtitle="Las series que todos están viendo"
          items={tvShows.map(t => ({ 
            ...t, 
            rating: t.voteAverage,
            date: t.firstAirDate || "Desconocida",
            providers: t.providers
          }))}
          variant="tv"
        />

        <Carousel
          title="Videojuegos en tendencia"
          subtitle="Los videojuegos más jugados"
          items={games.map((g, idx) => ({ 
            id: g.id,
            title: g.name || g.title || "Desconocido",
            posterUrl: g.coverUrl || g.posterUrl,
            rating: g.rating,
            date: g.releaseDate || "Desconocida",
            platformLogos: g.platformLogos?.map((p, i) => ({ ...p, key: `${p.id}-${idx}-${i}` }))
          }))}
          variant="games"
        />
      </main>

      {}
      <section className="max-w-7xl mx-auto px-6 mt-16 pb-12">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 p-8 md:p-12">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjMiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L2c+PC9zdmc+')] opacity-50" />
          
          <div className="relative text-center">
            {user ? (
              <>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  Encuentra tu próxima obsesión
                </h2>
                <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                  Rastrea todo lo que ves, juegas y más. Entérate de qué recomiendan tus amigos.
                </p>
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Explorar ahora
                </Link>
              </>
            ) : (
              <>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  Empieza tu tracking hoy
                </h2>
                <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                  Únete a miles de usuarios que ya están siguiendo su universo de media en Lumen.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-zinc-900 font-semibold rounded-xl hover:bg-zinc-100 transition-all shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Comenzar gratis
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}





