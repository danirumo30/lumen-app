"use client";

import Image from "next/image";
import { BaseCarousel } from "./BaseCarousel";

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

interface SimilarGamesCarouselProps {
  games: SimilarGame[];
}

export function SimilarGamesCarousel({ games }: SimilarGamesCarouselProps) {
  if (!games || games.length === 0) {
    return null;
  }

  return (
    <BaseCarousel title="Juegos similares">
      {games.map((game) => {
        const cleanId = game.id.replace(/^(igdb_|game_)/, "");
        return (
          <a
            key={game.id}
            href={`/game/${cleanId}`}
            className="flex-shrink-0 w-36 snap-start group/game"
          >
             {}
             <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-800 border border-white/[0.03] transition-all duration-500 group-hover/game:scale-[1.02] group-hover/game:border-white/[0.08]">
               {game.posterUrl ? (
                 <Image
                   src={game.posterUrl}
                   alt={game.name}
                   fill
                   className="object-cover transition-transform duration-700 group-hover/game:scale-105"
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
                      d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                    />
                  </svg>
                </div>
              )}

              {}
              {game.rating && (
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm">
                  <span className="text-[10px] font-semibold text-white/90 tabular-nums">
                    {game.rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {}
            <h3 className="text-xs font-medium text-white/90 mt-2 line-clamp-2 leading-tight">
              {game.name}
            </h3>
            {game.releaseYear && (
              <p className="text-[10px] text-zinc-500 mt-0.5">{game.releaseYear}</p>
            )}
          </a>
        );
      })}
    </BaseCarousel>
  );
}




