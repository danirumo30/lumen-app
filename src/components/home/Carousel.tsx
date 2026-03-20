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
  const [isDragging, setIsDragging] = useState(false);
  
  // Thumb state
  const [thumbLeft, setThumbLeft] = useState(0);
  const [thumbWidth, setThumbWidth] = useState(20);
  
  // Drag state
  const dragRef = useRef({
    isDragging: false,
    startX: 0,
    startThumbLeft: 0,
  });

  const updateThumb = useCallback(() => {
    if (!scrollRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const maxScroll = scrollWidth - clientWidth;
    
    // Update scroll buttons
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft < maxScroll - 2);
    
    // Calculate thumb position
    if (maxScroll > 0) {
      const thumbWidthPercent = (clientWidth / scrollWidth) * 100;
      const thumbLeftPercent = (scrollLeft / maxScroll) * (100 - thumbWidthPercent);
      
      setThumbWidth(Math.max(thumbWidthPercent, 10));
      setThumbLeft(thumbLeftPercent);
    } else {
      setThumbWidth(100);
      setThumbLeft(0);
    }
  }, []);

  useEffect(() => {
    updateThumb();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", updateThumb, { passive: true });
      return () => el.removeEventListener("scroll", updateThumb);
    }
  }, [items, updateThumb]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === "right" ? 280 : -280,
        behavior: "smooth",
      });
    }
  };

  // Handle thumb drag
  const handleThumbMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startThumbLeft: thumbLeft,
    };
    
    setIsDragging(true);
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }, [thumbLeft]);

  // Handle track click
  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current || !trackRef.current || isDragging) return;
    
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const trackWidth = rect.width;
    
    const { scrollWidth, clientWidth } = scrollRef.current;
    const maxScroll = scrollWidth - clientWidth;
    
    if (maxScroll <= 0) return;
    
    // Calculate target scroll position
    const thumbWidthPercent = (clientWidth / scrollWidth) * 100;
    const maxThumbLeft = 100 - thumbWidthPercent;
    const clickPercent = (clickX / trackWidth) * 100;
    
    // Clamp to valid range
    const targetThumbLeft = Math.max(0, Math.min(maxThumbLeft, clickPercent));
    
    // Convert to scroll position
    const targetScroll = (targetThumbLeft / maxThumbLeft) * maxScroll;
    
    scrollRef.current.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
  }, [isDragging]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current.isDragging || !scrollRef.current) return;
      
      const deltaX = e.clientX - dragRef.current.startX;
      const trackWidth = trackRef.current?.offsetWidth || 0;
      
      if (trackWidth <= 0) return;
      
      const { scrollWidth, clientWidth } = scrollRef.current;
      const maxScroll = scrollWidth - clientWidth;
      const thumbWidthPercent = (clientWidth / scrollWidth) * 100;
      const maxThumbLeft = 100 - thumbWidthPercent;
      
      // Calculate new thumb position
      const deltaPercent = (deltaX / trackWidth) * 100;
      const newThumbLeft = Math.max(0, Math.min(maxThumbLeft, dragRef.current.startThumbLeft + deltaPercent));
      
      setThumbLeft(newThumbLeft);
      
      // Update scroll position
      const newScroll = (newThumbLeft / maxThumbLeft) * maxScroll;
      scrollRef.current.scrollLeft = newScroll;
    };

    const handleMouseUp = () => {
      if (dragRef.current.isDragging) {
        dragRef.current.isDragging = false;
        setIsDragging(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const variantConfig = {
    movies: {
      icon: (
        <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>
        </svg>
      ),
      accentClass: "bg-gradient-to-r from-amber-500 to-orange-500",
      glowClass: "shadow-amber-500/50",
    },
    tv: {
      icon: (
        <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/>
        </svg>
      ),
      accentClass: "bg-gradient-to-r from-cyan-500 to-blue-500",
      glowClass: "shadow-cyan-500/50",
    },
    games: {
      icon: (
        <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21.58 16.09l-1.09-7.66C20.21 6.46 18.52 5 16.53 5H7.47C5.48 5 3.79 6.46 3.51 8.43l-1.09 7.66C2.2 17.63 3.39 19 4.94 19h0c.68 0 1.32-.27 1.8-.75L9 16h6l2.25 2.25c.48.48 1.13.75 1.8.75h0c1.56 0 2.74-1.37 2.53-2.91zM11 11H9v2H8v-2H6v-2h2V7h1v2h2v2zm4-1.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm2 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        </svg>
      ),
      accentClass: "bg-gradient-to-r from-emerald-500 to-teal-500",
      glowClass: "shadow-emerald-500/50",
    },
  };

  const config = variantConfig[variant];

  return (
    <section 
      className="mb-12 group/carousel select-none"
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

      {/* Custom Scrollbar - draggable thumb */}
      <div 
        ref={trackRef}
        className={`relative mt-3 h-1.5 rounded-full bg-zinc-800/80 cursor-pointer overflow-visible transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleTrackClick}
      >
        {/* Thumb */}
        <div 
          className={`absolute top-1/2 -translate-y-1/2 h-5 rounded-full ${config.accentClass} ${config.glowClass} cursor-grab active:cursor-grabbing transition-shadow`}
          style={{
            left: `${thumbLeft}%`,
            width: `${thumbWidth}%`,
            transform: 'translateY(-50%)',
            boxShadow: isDragging ? `0 0 16px currentColor` : `0 0 8px rgba(249, 115, 22, 0.4)`,
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={handleThumbMouseDown}
        />
      </div>
    </section>
  );
}
