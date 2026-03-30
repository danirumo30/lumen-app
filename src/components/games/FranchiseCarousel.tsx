"use client";

import Image from "next/image";
import Link from "next/link";
import { useDragScroll } from "../home/useDragScroll";

interface FranchiseGame {
  id: string;
  igdbId: number;
  name: string;
  posterUrl: string | null;
  releaseDate: string | null;
  releaseYear: number | null;
  rating: number | null;
  genres: string[];
}

interface FranchiseInfo {
  id: number;
  name: string;
}

interface FranchiseCarouselProps {
  franchise: FranchiseInfo | null;
  games: FranchiseGame[];
  currentGameId: string;
}

export function FranchiseCarousel({ franchise, games, currentGameId }: FranchiseCarouselProps) {
  const { containerRef, handlers } = useDragScroll({ snap: true });

  if (!franchise || !games || games.length === 0) {
    return null;
  }

  const cleanCurrentId = currentGameId.replace(/^(igdb_|game_)/, "");

  return (
    <section className="mb-10">
      {}
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-lg font-semibold text-white/90 tracking-tight">
          {franchise.name}
        </h2>
        <Link
          href={`/franchise/${cleanCurrentId}/${franchise.id}`}
          className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
        >
          Ver todos
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {}
      <div
        ref={containerRef}
        className="flex gap-3 snap-x snap-mandatory carousel-scroll touch-native-scroll"
        {...handlers}
        onClickCapture={handlers.onClick}
        style={{
          overflowX: "auto",
          overflowY: "hidden",
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
          paddingBottom: "16px",
          paddingLeft: "4px",
          paddingRight: "4px",
        }}
      >
        {games.slice(0, 20).map((game) => {
          const cleanId = game.id.replace(/^(igdb_|game_)/, "");
          const isCurrent =
            game.id === currentGameId || game.igdbId.toString() === currentGameId;

          return (
            <Link
              key={game.id}
              href={`/game/${cleanId}`}
              className={`flex-shrink-0 w-36 snap-start group/game relative ${
                isCurrent ? "ring-2 ring-emerald-500 rounded-xl" : ""
              }`}
            >
               {}
               <div
                 className={`relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-800 border-white/[0.03] transition-all duration-500 group-hover/game:scale-[1.02] ${
                   isCurrent ? "border-emerald-500" : ""
                 }`}
               >
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
                {isCurrent && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-600/90 backdrop-blur-sm">
                    <span className="text-[10px] font-semibold text-white">Actual</span>
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
            </Link>
          );
        })}
      </div>
    </section>
  );
}




