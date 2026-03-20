"use client";

import { useRef, useState, useEffect, useCallback } from "react";

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
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [thumbPosition, setThumbPosition] = useState(0);
  const [thumbWidth, setThumbWidth] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
      
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll > 0) {
        const scrollPercent = (scrollLeft / maxScroll) * 100;
        const thumbPercent = (clientWidth / scrollWidth) * 100;
        setThumbPosition(scrollPercent);
        setThumbWidth(Math.max(thumbPercent, 10));
      } else {
        setThumbPosition(0);
        setThumbWidth(100);
      }
    }
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    el?.addEventListener("scroll", checkScroll);
    return () => el?.removeEventListener("scroll", checkScroll);
  }, [items, checkScroll]);

  // Drag to scroll functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current || !trackRef.current) return;
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartScroll.current = scrollRef.current.scrollLeft;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current || !trackRef.current) return;
    
    const deltaX = e.clientX - dragStartX.current;
    const trackWidth = trackRef.current.offsetWidth;
    const scrollWidth = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
    
    if (scrollWidth <= 0) return;
    
    // Calculate scroll position based on thumb drag
    const scrollDelta = (deltaX / trackWidth) * scrollWidth;
    const newScroll = Math.max(0, Math.min(scrollWidth, dragStartScroll.current + scrollDelta));
    
    scrollRef.current.scrollLeft = newScroll;
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mousemove', handleMouseMove as any);
      return () => {
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mousemove', handleMouseMove as any);
      };
    }
  }, [isDragging, handleMouseUp, handleMouseMove]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 280;
      scrollRef.current.scrollBy({
        left: direction === "right" ? scrollAmount : -scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const variantConfig = {
    movies: {
      icon: (
        <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
        </svg>
      ),
      gradient: "from-amber-500/20 to-orange-500/20",
      accent: "bg-gradient-to-r from-amber-500 to-orange-500",
      glow: "shadow-amber-500/20",
    },
    tv: {
      icon: (
        <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/>
        </svg>
      ),
      gradient: "from-cyan-500/20 to-blue-500/20",
      accent: "bg-gradient-to-r from-cyan-500 to-blue-500",
      glow: "shadow-cyan-500/20",
    },
    games: {
      icon: (
        <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21.58 16.09l-1.09-7.66C20.21 6.46 18.52 5 16.53 5H7.47C5.48 5 3.79 6.46 3.51 8.43l-1.09 7.66C2.2 17.63 3.39 19 4.94 19h0c.68 0 1.32-.27 1.8-.75L9 16h6l2.25 2.25c.48.48 1.13.75 1.8.75h0c1.56 0 2.74-1.37 2.53-2.91zM11 11H9v2H8v-2H6v-2h2V7h1v2h2v2zm4-1.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm2 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        </svg>
      ),
      gradient: "from-emerald-500/20 to-teal-500/20",
      accent: "bg-gradient-to-r from-emerald-500 to-teal-500",
      glow: "shadow-emerald-500/20",
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
        
        {/* Navigation Buttons - appear on hover with smooth animation */}
        <div className={`flex gap-2 transition-all duration-300 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="p-2.5 rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all backdrop-blur-sm border border-zinc-700/50 hover:border-zinc-600/50"
            aria-label="Scroll left"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="p-2.5 rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all backdrop-blur-sm border border-zinc-700/50 hover:border-zinc-600/50"
            aria-label="Scroll right"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'transparent transparent',
        }}
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
              
              {/* Rating Badge - glass morphism effect */}
              {item.rating && (
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg backdrop-blur-md bg-black/60 border border-white/10 flex items-center gap-1.5 shadow-lg">
                  <svg className="w-3.5 h-3.5 text-amber-400 drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  <span className="text-xs font-bold text-white drop-shadow-lg">{item.rating}</span>
                </div>
              )}

              {/* Hover Overlay - elegant gradient reveal */}
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

      {/* Premium Custom Scrollbar */}
      <div 
        className={`relative h-1.5 mt-3 transition-all duration-500 ${isHovered ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-50'}`}
        ref={trackRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'default' }}
      >
        {/* Track background */}
        <div className="absolute inset-0 rounded-full bg-zinc-800/80 backdrop-blur-sm" />
        
        {/* Clickable zone - starts from thumb position and extends to end */}
        <div 
          className="absolute top-0 bottom-0"
          style={{ left: `${thumbPosition}%`, right: 0 }}
        />
        
        {/* Glow effect */}
        <div 
          className={`absolute top-0 h-full rounded-full ${config.accent} transition-all duration-300 ease-out`}
          style={{ 
            left: `${thumbPosition}%`, 
            width: `${thumbWidth}%`,
            filter: 'blur(8px)',
            opacity: 0.6,
            maxWidth: 'calc(100% - 2px)',
          }}
        />
        
        {/* Thumb */}
        <div 
          className={`absolute top-0 h-full rounded-full ${config.accent} shadow-lg transition-all duration-150 ease-out`}
          style={{ 
            left: `${thumbPosition}%`, 
            width: `${thumbWidth}%`,
            maxWidth: 'calc(100% - 2px)',
          }}
        />
        
        {/* Inner shine */}
        <div 
          className="absolute top-0 h-full rounded-full bg-gradient-to-b from-white/30 to-transparent pointer-events-none"
          style={{ 
            left: `${thumbPosition}%`, 
            width: `${thumbWidth}%`,
            maxWidth: 'calc(100% - 2px)',
          }}
        />
      </div>

    </section>
  );
}
