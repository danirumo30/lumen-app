"use client";

import { useDragScroll } from "./useDragScroll";

interface CarouselProps {
  title: string;
  subtitle?: string;
  items: CarouselItem[];
  variant?: "movies" | "tv" | "games";
  isLoading?: boolean;
}

interface CarouselItem {
  id: string;
  title: string;
  posterUrl: string | null;
  rating?: number | null;
  date?: string;
  overview?: string;
}

// Skeleton shimmer para loading state
function CarouselSkeleton() {
  return (
    <div className="flex gap-4">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="flex-shrink-0 w-44 animate-pulse"
        >
          <div className="aspect-[2/3] rounded-2xl bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-800 relative overflow-hidden">
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Carousel({ title, subtitle, items, variant = "movies", isLoading = false }: CarouselProps) {
  const { containerRef, handlers } = useDragScroll({ snap: true });

  const variantConfig = {
    movies: {
      icon: (
        <svg className="w-4 h-4 text-amber-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
      ),
      accent: "amber",
    },
    tv: {
      icon: (
        <svg className="w-4 h-4 text-cyan-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      accent: "cyan",
    },
    games: {
      icon: (
        <svg className="w-4 h-4 text-emerald-400/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
      accent: "emerald",
    },
  };

  const config = variantConfig[variant];

  if (isLoading) {
    return (
      <section className="mb-12">
        {/* Header skeleton */}
        <div className="flex items-end justify-between mb-6">
          <div className="flex items-center gap-3">
            {config.icon}
            <div className="space-y-2">
              <div className="h-6 w-32 bg-zinc-800 rounded-lg animate-pulse" />
              {subtitle && <div className="h-4 w-24 bg-zinc-800/50 rounded animate-pulse" />}
            </div>
          </div>
        </div>
        <CarouselSkeleton />
      </section>
    );
  }

  return (
    <section className="mb-12 group/carousel relative">
      {/* Header */}
      <div className="flex items-end justify-between mb-6 px-1">
        <div className="flex items-center gap-3">
          {config.icon}
          <div>
            <h2 className="text-xl font-semibold text-white/90 tracking-tighter">
              {title}
            </h2>
            {subtitle && (
              <p className="text-zinc-500 text-xs mt-0.5 tracking-tight">{subtitle}</p>
            )}
          </div>
        </div>
        
        {/* Glassmorphism Navigation Buttons */}
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
      </div>

      {/* Scrollable Container */}
      <div
        ref={containerRef}
        className="flex gap-3 snap-x snap-mandatory carousel-scroll"
        {...handlers}
        style={{
          overflowX: "auto",
          overflowY: "hidden",
          cursor: "grab",
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
          scrollPaddingLeft: "4px",
          scrollPaddingRight: "4px",
        }}
      >
        {/* Left padding for fade effect */}
        <div className="flex-shrink-0 w-1" />

        {items.map((item, index) => (
          <article
            key={item.id}
            className="flex-shrink-0 w-40 snap-start group/item"
          >
            {/* Poster Card - Ultra Premium */}
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900/50 border border-white/[0.03] transition-all duration-500 ease-out group-hover/item:scale-[1.02] group-hover/item:border-white/[0.08]">
              
              {/* Subtle perimeter glow on hover */}
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover/item:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/[0.03] via-transparent to-white/[0.02]" />
                <div className="absolute inset-[-1px] rounded-xl bg-gradient-to-br from-white/[0.05] via-transparent to-transparent" />
              </div>
              
              {item.posterUrl ? (
                <img
                  src={item.posterUrl}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/item:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800/50 to-zinc-900/50">
                  {config.icon}
                </div>
              )}
              
              {/* Glassmorphism Rating Badge */}
              {item.rating && (
                <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/40 backdrop-blur-xl border border-white/10">
                  <div className="flex items-center gap-1">
                    <svg className={`w-3 h-3 text-${config.accent}-400`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                    <span className="text-[10px] font-semibold text-white/90 tabular-nums">
                      {item.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              )}

              {/* Elegant Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover/item:opacity-100 transition-all duration-400 flex flex-col justify-end p-3">
                <h3 className="text-xs font-medium text-white/95 tracking-tight line-clamp-2 leading-tight mb-2">
                  {item.title}
                </h3>
                {item.date && (
                  <span className="text-[10px] text-white/50 tracking-tight mb-2">
                    {item.date}
                  </span>
                )}
                <button className="w-full py-1.5 rounded-lg bg-white/[0.08] backdrop-blur-xl text-[10px] font-medium text-white/90 border border-white/10 hover:bg-white/[0.15] transition-all duration-200">
                  Ver más
                </button>
              </div>
            </div>
          </article>
        ))}

        {/* Right padding for fade effect */}
        <div className="flex-shrink-0 w-1" />
      </div>
    </section>
  );
}
