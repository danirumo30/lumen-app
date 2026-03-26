"use client";

import { useState } from "react";
import type { UserProfileWithContent } from "@/modules/social/domain/user-profile";
import type { Media } from "@/modules/shared/domain/media";
import { MediaCard } from "./MediaCard";
import { useDragScroll } from "../home/useDragScroll";

// SVG Icons
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
  const { containerRef, handlers } = useDragScroll({ snap: true });
  const [isHovered, setIsHovered] = useState(false);
  const hasContent = mediaList.length > 0;

  return (
    <section 
      className="mb-8 group/carousel relative"
      onMouseEnter={() => hasContent && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-end justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          <div className="text-zinc-400">{icon}</div>
          <h2 className="text-lg font-semibold text-white/90 tracking-tight">{title}</h2>
          <span className="text-sm text-zinc-500">({mediaList.length})</span>
        </div>
        
        {/* Glassmorphism Navigation Buttons - solo si hay contenido */}
        {hasContent && (
          <div className="flex gap-1.5 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300">
            <button
              onClick={() => containerRef.current?.scrollBy({ left: -300, behavior: "smooth" })}
              className="p-2 rounded-xl bg-white/5 backdrop-blur-xl border border-white/5 text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all duration-200"
              aria-label="Anterior"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => containerRef.current?.scrollBy({ left: 300, behavior: "smooth" })}
              className="p-2 rounded-xl bg-white/5 backdrop-blur-xl border border-white/5 text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/10 transition-all duration-200"
              aria-label="Siguiente"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Content or Empty State */}
      {hasContent ? (
        <div
          ref={containerRef}
          className={`flex gap-3 snap-x snap-mandatory carousel-scroll touch-native-scroll ${isHovered ? 'is-scrolling' : ''}`}
          {...handlers}
          style={{
            overflowX: "auto",
            overflowY: "hidden",
            scrollBehavior: "smooth",
            WebkitOverflowScrolling: "touch",
            paddingBottom: "16px",
          }}
        >
          {mediaList.map((media) => (
            <MediaCard key={media.id} media={media} />
          ))}
        </div>
      ) : (
        <p className="text-zinc-500 text-sm py-8 text-center">No hay contenido</p>
      )}
    </section>
  );
}

interface MediaTabsProps {
  content: UserProfileWithContent;
}

export function MediaTabs({ content }: MediaTabsProps) {
  return (
    <div>
      {/* Series Vistas */}
      <CarouselSection
        title="Series vistas"
        icon={<TvIcon />}
        mediaList={content.watchedTvShows}
      />

      {/* Series Favoritas */}
      <CarouselSection
        title="Series favoritas"
        icon={<TvIcon />}
        mediaList={content.favoriteTvShows}
      />

      {/* Películas Vistas */}
      <CarouselSection
        title="Películas vistas"
        icon={<MovieIcon />}
        mediaList={content.watchedMovies}
      />

      {/* Películas Favoritas */}
      <CarouselSection
        title="Películas favoritas"
        icon={<MovieIcon />}
        mediaList={content.favoriteMovies}
      />

      {/* Videojuegos Vistos */}
      <CarouselSection
        title="Videojuegos jugados"
        icon={<GameIcon />}
        mediaList={content.watchedGames}
      />

      {/* Videojuegos Favoritos */}
      <CarouselSection
        title="Videojuegos favoritos"
        icon={<GameIcon />}
        mediaList={content.favoriteGames}
      />
    </div>
  );
}
