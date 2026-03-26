"use client";

import Image from "next/image";
import Link from "next/link";
import { useDragScroll } from "../home/useDragScroll";

interface DLCGame {
  id: string;
  igdbId: number;
  name: string;
  posterUrl: string | null;
  releaseDate: string | null;
  releaseYear: number | null;
  rating: number | null;
  genres: string[];
  category?: number;
  isStandaloneExpansion?: boolean;
}

interface DLCsCarouselProps {
  dlcs: DLCGame[];
}

function getContentBadge(category?: number, isStandalone?: boolean): { label: string; color: string } {
  if (isStandalone) {
    return { label: "Expansión", color: "bg-violet-600/80" };
  }
  switch (category) {
    case 1:
      return { label: "DLC", color: "bg-amber-600/80" };
    case 2:
      return { label: "Expansión", color: "bg-violet-600/80" };
    case 3:
      return { label: "Bundle", color: "bg-cyan-600/80" };
    case 8:
      return { label: "Edición", color: "bg-rose-600/80" };
    default:
      return { label: "Extra", color: "bg-zinc-600/80" };
  }
}

export function DLCsCarousel({ dlcs }: DLCsCarouselProps) {
  const { containerRef, handlers } = useDragScroll({ snap: true });

  if (!dlcs || dlcs.length === 0) {
    return null;
  }

  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-white/90 tracking-tight mb-4 px-1">
        Contenido adicional
      </h2>
      
      <div
        ref={containerRef}
        className="flex gap-3 snap-x snap-mandatory carousel-scroll touch-native-scroll"
        {...handlers}
        style={{
          overflowX: "auto",
          overflowY: "hidden",
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
          paddingBottom: "16px",
          paddingLeft: "4px",
          paddingRight: "4px",
        }}
        onClickCapture={handlers.onClick}
      >
        {dlcs.map((dlc) => {
          const cleanId = dlc.id.replace(/^(igdb_|game_)/, "");
          const badge = getContentBadge(dlc.category, dlc.isStandaloneExpansion);
          
          return (
            <Link
              key={dlc.id}
              href={`/game/${cleanId}`}
              className="flex-shrink-0 w-36 snap-start group/dlc"
            >
               {}
               <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-800 border border-white/[0.03] transition-all duration-500 group-hover/dlc:scale-[1.02] group-hover/dlc:border-white/[0.08]">
                 {dlc.posterUrl ? (
                   <Image
                     src={dlc.posterUrl}
                     alt={dlc.name}
                     fill
                     className="object-cover transition-transform duration-700 group-hover/dlc:scale-105"
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
                <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-md ${badge.color} backdrop-blur-sm`}>
                  <span className="text-[10px] font-semibold text-white">{badge.label}</span>
                </div>

                {}
                {dlc.rating && (
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm">
                    <span className="text-[10px] font-semibold text-white/90 tabular-nums">
                      {dlc.rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              {}
              <h3 className="text-xs font-medium text-white/90 mt-2 line-clamp-2 leading-tight">
                {dlc.name}
              </h3>
              {dlc.releaseYear && (
                <p className="text-[10px] text-zinc-500 mt-0.5">{dlc.releaseYear}</p>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
