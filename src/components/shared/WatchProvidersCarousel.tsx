"use client";

import { useState } from "react";
import { useDragScroll } from "@/components/home/useDragScroll";

export interface WatchProvider {
  id: number;
  name: string;
  logoUrl: string | null;
  type: "subscription" | "free" | "ads" | "rent" | "buy";
}

interface WatchProvidersCarouselProps {
  providers: WatchProvider[];
  title?: string;
}

const typeLabels: Record<WatchProvider["type"], string> = {
  subscription: "Suscripción",
  free: "Gratis",
  ads: "Con Ads",
  rent: "Alquilar",
  buy: "Comprar",
};

const typeColors: Record<WatchProvider["type"], string> = {
  subscription: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  free: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  ads: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  rent: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  buy: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

export function WatchProvidersCarousel({ providers, title = "Dónde ver" }: WatchProvidersCarouselProps) {
  const { containerRef, handlers } = useDragScroll({ snap: true });
  const [isHovered, setIsHovered] = useState(false);

  if (!providers || providers.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        {title}
      </h3>

      <div
        ref={containerRef}
        className={`flex gap-3 overflow-x-auto snap-x snap-mandatory carousel-scroll touch-native-scroll ${isHovered ? 'is-scrolling' : ''}`}
        {...handlers}
        style={{
          overflowX: "auto",
          overflowY: "hidden",
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
          paddingBottom: "16px",
          touchAction: "pan-x",
        }}
      >
        {providers.map((provider) => (
          <div
            key={`${provider.id}-${provider.type}`}
            className="flex-shrink-0"
          >
            {/* Badge de tipo arriba a la derecha */}
            <div className="relative">
              <span className={`absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-medium rounded border ${typeColors[provider.type]} z-10`}>
                {typeLabels[provider.type]}
              </span>
              
              {/* Logo de la plataforma */}
              {provider.logoUrl ? (
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-zinc-800 overflow-hidden border border-white/5">
                  <img
                    src={provider.logoUrl}
                    alt={provider.name}
                    className="w-full h-full object-contain p-1.5"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-zinc-800 flex items-center justify-center border border-white/5">
                  <span className="text-xs text-zinc-400 text-center px-1">
                    {provider.name.length > 10 
                      ? provider.name.substring(0, 10) + "..." 
                      : provider.name}
                  </span>
                </div>
              )}
            </div>
            
            {/* Nombre de la plataforma */}
            <p className="text-[10px] text-zinc-500 text-center mt-1 max-w-[56px] sm:max-w-[64px] truncate">
              {provider.name}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
