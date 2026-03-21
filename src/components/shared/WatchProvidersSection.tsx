"use client";

import { useState, type ReactNode } from "react";

export interface WatchProvider {
  id: number;
  name: string;
  logoUrl: string | null;
  type: "subscription" | "free" | "ads" | "rent" | "buy";
}

interface WatchProvidersSectionProps {
  providers: WatchProvider[];
  link?: string;
  className?: string;
}

const typeConfig: Record<WatchProvider["type"], { 
  label: string; 
  gradient: string; 
  icon: ReactNode;
  ring: string;
}> = {
  subscription: {
    label: "Suscripción",
    gradient: "from-emerald-500/20 to-teal-500/20",
    ring: "ring-emerald-500/30",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  free: {
    label: "Gratis",
    gradient: "from-cyan-500/20 to-blue-500/20",
    ring: "ring-cyan-500/30",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  ads: {
    label: "Con Ads",
    gradient: "from-amber-500/20 to-orange-500/20",
    ring: "ring-amber-500/30",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12h4l3-9 4 18 3-9h4" />
      </svg>
    ),
  },
  rent: {
    label: "Alquilar",
    gradient: "from-violet-500/20 to-purple-500/20",
    ring: "ring-violet-500/30",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  buy: {
    label: "Comprar",
    gradient: "from-rose-500/20 to-pink-500/20",
    ring: "ring-rose-500/30",
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
};

export function WatchProvidersSection({ providers, link, className = "" }: WatchProvidersSectionProps) {
  const [hoveredProvider, setHoveredProvider] = useState<number | null>(null);

  if (!providers || providers.length === 0) {
    return null;
  }

  // Group providers by type
  const grouped = providers.reduce((acc, provider) => {
    if (!acc[provider.type]) {
      acc[provider.type] = [];
    }
    acc[provider.type].push(provider);
    return acc;
  }, {} as Record<string, WatchProvider[]>);

  return (
    <div className={`group ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500/30 blur-lg opacity-50" />
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/30 to-teal-500/30 backdrop-blur-sm border border-emerald-500/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-white/90">Dónde ver</h3>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Disponible en {providers.length} plataformas</p>
        </div>
      </div>

      {/* Provider groups */}
      <div className="space-y-3">
        {Object.entries(grouped).map(([type, typeProviders]) => {
          const config = typeConfig[type as WatchProvider["type"]];
          if (!config) return null;

          return (
            <div key={type} className="space-y-2">
              {/* Type label */}
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r ${config.gradient} text-white/90 border border-white/10`}>
                  {config.icon}
                  {config.label}
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
              </div>

              {/* Provider logos */}
              <div className="flex flex-wrap gap-2">
                {typeProviders.map((provider) => {
                  const isHovered = hoveredProvider === provider.id;
                  
                  return (
                    <a
                      key={`${provider.id}-${provider.type}`}
                      href={link || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/link relative"
                      onMouseEnter={() => setHoveredProvider(provider.id)}
                      onMouseLeave={() => setHoveredProvider(null)}
                    >
                      {/* Glow effect on hover */}
                      <div className={`absolute -inset-1 bg-gradient-to-r ${config.gradient} rounded-xl blur-sm opacity-0 transition-opacity duration-300 ${isHovered ? 'opacity-60' : ''}`} />
                      
                      {/* Provider card */}
                      <div className={`relative rounded-xl overflow-hidden transition-all duration-300 ${isHovered ? 'scale-105 ring-2 ' + config.ring : ''}`}>
                        {provider.logoUrl ? (
                          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-zinc-800/80 backdrop-blur-sm border border-white/10 overflow-hidden">
                            <img
                              src={provider.logoUrl}
                              alt={provider.name}
                              className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover/link:scale-110"
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-zinc-800/80 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                            <span className="text-xs text-zinc-400 text-center px-1 font-medium">
                              {provider.name}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Tooltip */}
                      <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-900/95 border border-white/10 rounded text-[10px] text-white whitespace-nowrap opacity-0 transition-all duration-200 pointer-events-none ${isHovered ? 'opacity-100 -translate-y-1' : ''}`}>
                        {provider.name}
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* See all link */}
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-4 text-xs text-zinc-400 hover:text-white transition-colors group/link"
        >
          <span>Ver todas las opciones</span>
          <svg className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </a>
      )}
    </div>
  );
}
