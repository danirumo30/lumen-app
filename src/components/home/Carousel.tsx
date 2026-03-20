"use client";

import { useRef, useState, useCallback } from "react";

interface CarouselProps {
  title: string;
  subtitle?: string;
  items: CarouselItem[];
  variant?: "movies" | "tv" | "games";
}

interface CarouselItem {
  id: string;
  title: string;
  posterUrl: string | null;
  rating?: number | null;
  date?: string;
  overview?: string;
}

export function Carousel({ title, subtitle, items, variant = "movies" }: CarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Scroll indicator state
  const [scrollProgress, setScrollProgress] = useState(0);
  const [thumbWidth, setThumbWidth] = useState(20);
  
  // Drag state
  const dragRef = useRef({
    isDragging: false,
    startX: 0,
    startScrollLeft: 0,
  });

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const maxScroll = scrollWidth - clientWidth;
    
    if (maxScroll > 0) {
      setScrollProgress((scrollLeft / maxScroll) * 100);
      setThumbWidth((clientWidth / scrollWidth) * 100);
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    
    const target = e.target as HTMLElement;
    const clickedOnItem = target.closest('article');
    if (!clickedOnItem) return;
    
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startScrollLeft: scrollRef.current.scrollLeft,
    };
    
    setIsDragging(true);
    scrollRef.current.style.cursor = 'grabbing';
    scrollRef.current.style.userSelect = 'none';
    scrollRef.current.style.scrollBehavior = 'auto';
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current.isDragging || !scrollRef.current) return;
    
    const deltaX = dragRef.current.startX - e.clientX;
    scrollRef.current.scrollLeft = dragRef.current.startScrollLeft + deltaX;
    handleScroll();
  }, [handleScroll]);

  const handleMouseUp = useCallback(() => {
    if (dragRef.current.isDragging && scrollRef.current) {
      dragRef.current.isDragging = false;
      setIsDragging(false);
      scrollRef.current.style.cursor = '';
      scrollRef.current.style.userSelect = '';
      scrollRef.current.style.scrollBehavior = 'smooth';
    }
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === "right" ? 280 : -280,
        behavior: "smooth",
      });
      setTimeout(handleScroll, 100);
    }
  };

  const variantConfig = {
    movies: {
      icon: (
        <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
        </svg>
      ),
      accent: "#f59e0b",
      accentLight: "rgba(245, 158, 11, 0.4)",
    },
    tv: {
      icon: (
        <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/>
        </svg>
      ),
      accent: "#06b6d4",
      accentLight: "rgba(6, 182, 212, 0.4)",
    },
    games: {
      icon: (
        <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21.58 16.09l-1.09-7.66C20.21 6.46 18.52 5 16.53 5H7.47C5.48 5 3.79 6.46 3.51 8.43l-1.09 7.66C2.2 17.63 3.39 19 4.94 19h0c.68 0 1.32-.27 1.8-.75L9 16h6l2.25 2.25c.48.48 1.13.75 1.8.75h0c1.56 0 2.74-1.37 2.53-2.91zM11 11H9v2H8v-2H6v-2h2V7h1v2h2v2zm4-1.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm2 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        </svg>
      ),
      accent: "#10b981",
      accentLight: "rgba(16, 185, 129, 0.4)",
    },
  };

  const config = variantConfig[variant];

  return (
    <section 
      className="mb-12 group/carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div className="flex items-center gap-3">
          {config.icon}
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
            {subtitle && (
              <p className="text-zinc-500 text-sm mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        
        {/* Navigation Buttons */}
        <div className={`flex gap-2 transition-all duration-300 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
          <button
            onClick={() => scroll("left")}
            className="p-2.5 rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700/80 transition-all backdrop-blur-sm border border-zinc-700/50 hover:border-zinc-600/50"
            aria-label="Scroll left"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-2.5 rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700/80 transition-all backdrop-blur-sm border border-zinc-700/50 hover:border-zinc-600/50"
            aria-label="Scroll right"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable Container - drag to scroll */}
      <div
        ref={scrollRef}
        className={`flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory hide-scrollbar ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onScroll={handleScroll}
      >
        {items.map((item, index) => (
          <article
            key={item.id}
            className="flex-shrink-0 w-44 snap-start group/item"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Poster Card */}
            <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-800 transition-all duration-500 group-hover/item:scale-[1.03] group-hover/item:shadow-2xl group-hover/item:z-10">
              {/* Subtle border glow on hover */}
              <div className={`absolute inset-0 rounded-2xl border-2 border-transparent group-hover/item:border-white/10 transition-all duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
              
              {item.posterUrl ? (
                <img
                  src={item.posterUrl}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-110"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-800">
                  {config.icon}
                </div>
              )}
              
              {/* Rating Badge */}
              {item.rating && (
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg backdrop-blur-md bg-black/60 border border-white/10 flex items-center gap-1.5 shadow-lg">
                  <svg className="w-3.5 h-3.5 text-amber-400 drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  <span className="text-xs font-bold text-white drop-shadow-lg">{item.rating}</span>
                </div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent opacity-0 group-hover/item:opacity-100 transition-all duration-500 flex flex-col justify-end p-4">
                <h3 className="text-sm font-semibold text-white line-clamp-2 mb-1 drop-shadow-lg">
                  {item.title}
                </h3>
                {item.date && (
                  <span className="text-xs text-zinc-300 mb-3">{item.date}</span>
                )}
                <button className="w-full py-2 rounded-xl bg-white/15 backdrop-blur-md text-xs font-semibold text-white hover:bg-white/25 transition-all border border-white/20">
                  Ver detalles
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Premium Minimalist Scroll Indicator */}
      <div 
        className={`relative mt-5 transition-all duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        style={{ height: '6px' }}
      >
        {/* Track */}
        <div 
          className="absolute inset-0 rounded-full bg-zinc-800/60 backdrop-blur-sm"
        />
        
        {/* Progress fill */}
        <div 
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-100"
          style={{ 
            width: `${thumbWidth}%`,
            left: `${scrollProgress}%`,
            background: `linear-gradient(90deg, ${config.accent}, ${config.accent})`,
            boxShadow: `0 0 12px ${config.accentLight}`,
            transform: 'translateX(-50%)',
          }}
        />
        
        {/* Thumb dot */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full transition-all duration-100"
          style={{ 
            left: `calc(${scrollProgress}% + ${thumbWidth / 2}%)`,
            background: 'white',
            boxShadow: `0 0 8px ${config.accentLight}, 0 2px 4px rgba(0,0,0,0.3)`,
          }}
        />
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          height: 0;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}
