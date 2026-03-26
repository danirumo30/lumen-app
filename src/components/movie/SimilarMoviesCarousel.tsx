"use client";

import Image from "next/image";
import { BaseCarousel } from "../games/BaseCarousel";

interface SimilarMovie {
  id: string;
  tmdbId: number;
  title: string;
  posterUrl: string | null;
  releaseDate: string | null;
  releaseYear: number | null;
  rating: number | null;
  overview?: string;
}

interface SimilarMoviesCarouselProps {
  movies: SimilarMovie[];
}

export function SimilarMoviesCarousel({ movies }: SimilarMoviesCarouselProps) {
  if (!movies || movies.length === 0) {
    return null;
  }

  return (
    <BaseCarousel title="Películas similares">
      {movies.map((movie) => {
        
        const cleanId = movie.id.replace(/^(tmdb_|movie_|tv_|igdb_)/, "");
        return (
          <a
            key={movie.id}
            href={`/movie/${cleanId}`}
            className="flex-shrink-0 w-36 snap-start group/movie"
          >
             {}
             <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-800 border border-white/[0.03] transition-all duration-500 group-hover/movie:scale-[1.02] group-hover/movie:border-white/[0.08]">
               {movie.posterUrl ? (
                 <Image
                   src={movie.posterUrl}
                   alt={movie.title}
                   fill
                   className="object-cover transition-transform duration-700 group-hover/movie:scale-105"
                   loading="lazy"
                   sizes="(max-width: 768px) 40vw, (max-width: 1024px) 25vw, 15vw"
                 />
               ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-800">
                  <svg
                    className="w-8 h-8 text-zinc-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                    />
                  </svg>
                </div>
              )}

              {}
              {movie.rating && (
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm">
                  <span className="text-[10px] font-semibold text-white/90 tabular-nums">
                    {movie.rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {}
            <h3 className="text-xs font-medium text-white/90 mt-2 line-clamp-2 leading-tight">
              {movie.title}
            </h3>
            {movie.releaseYear && (
              <p className="text-[10px] text-zinc-500 mt-0.5">{movie.releaseYear}</p>
            )}
          </a>
        );
      })}
    </BaseCarousel>
  );
}
