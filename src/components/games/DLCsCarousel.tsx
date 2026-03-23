"use client";

import { BaseCarousel } from "./BaseCarousel";

interface DLCGame {
  id: string;
  igdbId: number;
  name: string;
  posterUrl: string | null;
  releaseDate: string | null;
  releaseYear: number | null;
  rating: number | null;
  genres: string[];
}

interface DLCsCarouselProps {
  dlcs: DLCGame[];
}

export function DLCsCarousel({ dlcs }: DLCsCarouselProps) {
  if (!dlcs || dlcs.length === 0) {
    return null;
  }

  return (
    <BaseCarousel title="DLCs y Expansiones">
      {dlcs.map((dlc) => {
        const cleanId = dlc.id.replace(/^(igdb_|game_)/, "");
        return (
          <a
            key={dlc.id}
            href={`/game/${cleanId}`}
            className="flex-shrink-0 w-36 snap-start group/dlc"
          >
            {/* Poster */}
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-800 border border-white/[0.03] transition-all duration-500 group-hover/dlc:scale-[1.02] group-hover/dlc:border-white/[0.08]">
              {dlc.posterUrl ? (
                <img
                  src={dlc.posterUrl}
                  alt={dlc.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover/dlc:scale-105"
                  loading="lazy"
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

              {/* DLC badge */}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-600/80 backdrop-blur-sm">
                <span className="text-[10px] font-semibold text-white">DLC</span>
              </div>

              {/* Rating badge */}
              {dlc.rating && (
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm">
                  <span className="text-[10px] font-semibold text-white/90 tabular-nums">
                    {dlc.rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {/* Title and year */}
            <h3 className="text-xs font-medium text-white/90 mt-2 line-clamp-2 leading-tight">
              {dlc.name}
            </h3>
            {dlc.releaseYear && (
              <p className="text-[10px] text-zinc-500 mt-0.5">{dlc.releaseYear}</p>
            )}
          </a>
        );
      })}
    </BaseCarousel>
  );
}
