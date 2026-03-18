"use client";

import { useRef } from "react";
import type { UserProfileWithContent } from "@/modules/social/domain/user-profile";
import type { Media } from "@/modules/shared/domain/media";
import { MediaCard } from "./MediaCard";

// SVG Icons (no emojis)
const MovieIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
  </svg>
);

const TvIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const GameIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
  </svg>
);

interface CarouselSectionProps {
  title: string;
  icon: React.ReactNode;
  mediaList: Media[];
}

function CarouselSection({ title, icon, mediaList }: CarouselSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 180; // Card width + gap
      scrollRef.current.scrollBy({
        left: direction === "right" ? scrollAmount : -scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="mb-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-zinc-400">{icon}</div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <span className="text-sm text-zinc-500">({mediaList.length})</span>
        </div>
        
        <div className="flex gap-1">
          <button
            onClick={() => scroll("left")}
            className="p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-white transition-colors"
            aria-label="Scroll left"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-white transition-colors"
            aria-label="Scroll right"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Carousel */}
      {mediaList.length > 0 ? (
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {mediaList.map((media) => (
            <MediaCard key={media.id} media={media} />
          ))}
        </div>
      ) : (
        <p className="text-zinc-500 text-sm py-8 text-center">No hay contenido</p>
      )}

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

interface MediaTabsProps {
  content: UserProfileWithContent;
}

export function MediaTabs({ content }: MediaTabsProps) {
  return (
    <div>
      {/* Series Carousel */}
      <CarouselSection
        title="Series"
        icon={<TvIcon />}
        mediaList={content.watchedTvShows}
      />

      {/* Movies Carousel */}
      <CarouselSection
        title="Películas"
        icon={<MovieIcon />}
        mediaList={content.watchedMovies}
      />

      {/* Games Carousel */}
      <CarouselSection
        title="Videojuegos"
        icon={<GameIcon />}
        mediaList={content.watchedGames}
      />
    </div>
  );
}
