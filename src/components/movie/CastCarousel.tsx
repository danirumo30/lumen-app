"use client";

import { useState } from "react";
import { useDragScroll } from "../home/useDragScroll";

interface CastMember {
  id: number;
  name: string;
  character: string;
  profileUrl: string | null;
  order: number;
}

interface CastCarouselProps {
  cast: CastMember[];
}

export function CastCarousel({ cast }: CastCarouselProps) {
  const { containerRef, handlers } = useDragScroll({ snap: true });
  const [isHovered, setIsHovered] = useState(false);

  if (!cast || cast.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-white/90 tracking-tight mb-4">Reparto</h2>
      
      <div
        ref={containerRef}
        className={`flex gap-3 carousel-scroll ${isHovered ? 'is-scrolling' : ''}`}
        {...handlers}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          overflowX: "auto",
          overflowY: "hidden",
          cursor: "grab",
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
          paddingBottom: "16px",
        }}
      >
        {cast.map((person) => (
          <div
            key={person.id}
            className="flex-shrink-0 w-28 group/cast"
          >
            {/* Profile image */}
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-800 border border-white/[0.03] mb-2">
              {person.profileUrl ? (
                <img
                  src={person.profileUrl}
                  alt={person.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/cast:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-800">
                  <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            
            {/* Name and character */}
            <h3 className="text-xs font-medium text-white/90 truncate">{person.name}</h3>
            <p className="text-[10px] text-zinc-500 truncate">{person.character}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
