"use client";

import { useState } from "react";

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
  bgActive: string;
  textActive: string;
  borderActive: string;
  glow: string;
}> = {
  subscription: {
    label: "Suscripción",
    bgActive: "bg-emerald-500",
    textActive: "text-emerald-400",
    borderActive: "border-emerald-500/50",
    glow: "shadow-emerald-500/25",
  },
  free: {
    label: "Gratis",
    bgActive: "bg-cyan-500",
    textActive: "text-cyan-400",
    borderActive: "border-cyan-500/50",
    glow: "shadow-cyan-500/25",
  },
  ads: {
    label: "Con Ads",
    bgActive: "bg-amber-500",
    textActive: "text-amber-400",
    borderActive: "border-amber-500/50",
    glow: "shadow-amber-500/25",
  },
  rent: {
    label: "Alquilar",
    bgActive: "bg-violet-500",
    textActive: "text-violet-400",
    borderActive: "border-violet-500/50",
    glow: "shadow-violet-500/25",
  },
  buy: {
    label: "Comprar",
    bgActive: "bg-rose-500",
    textActive: "text-rose-400",
    borderActive: "border-rose-500/50",
    glow: "shadow-rose-500/25",
  },
};

// Hide scrollbar utility
const hideScrollbar = "[&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar]:display-none [-ms-overflow-style:none] [scrollbar-width:none]";

export function WatchProvidersSection({ providers, link, className = "" }: WatchProvidersSectionProps) {
  const [selectedType, setSelectedType] = useState<WatchProvider["type"]>("subscription");

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

  // Get available types (only those with providers)
  const availableTypes = Object.keys(grouped) as WatchProvider["type"][];
  
  // If current selected type has no providers, switch to first available
  if (!grouped[selectedType] && availableTypes.length > 0) {
    setSelectedType(availableTypes[0]);
    return null; // Will re-render with correct type
  }

  const currentProviders = grouped[selectedType] || [];
  const config = typeConfig[selectedType];

  // Provider logos component
  const ProviderLogos = ({ size = "normal" }: { size?: "normal" | "small" }) => (
    <div className={`flex gap-2 overflow-x-auto ${hideScrollbar}`}>
      {currentProviders.map((provider) => (
        <a
          key={`${provider.id}-${provider.type}`}
          href={link || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="group/link relative flex-shrink-0"
        >
          {/* Glow on hover */}
          <div className={`
            absolute -inset-1 rounded-xl opacity-0 blur-md
            bg-gradient-to-br ${config.bgActive}/30
            transition-opacity duration-300
            group-hover/link:opacity-100
          `} />
          
          {/* Logo container */}
          <div className={`
            relative ${size === "small" ? "w-12 h-12" : "w-10 h-10 sm:w-12 sm:h-12"} rounded-xl
            overflow-hidden transition-all duration-200
            border border-white/10
            group-hover/link:border-white/20
            group-hover/link:scale-110
          `}>
            {provider.logoUrl ? (
              <img
                src={provider.logoUrl}
                alt={provider.name}
                className="w-full h-full object-contain p-1.5 bg-zinc-900/50"
              />
            ) : (
              <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                <span className={`${size === "small" ? "text-[10px]" : "text-[9px]"} text-zinc-400 font-medium text-center leading-tight px-1`}>
                  {provider.name}
                </span>
              </div>
            )}
          </div>

          {/* Tooltip */}
          <div className={`
            absolute -bottom-6 left-1/2 -translate-x-1/2
            px-1.5 py-0.5 rounded bg-zinc-900/95 border border-white/10
            text-[9px] text-white whitespace-nowrap
            opacity-0 translate-y-1
            transition-all duration-150
            pointer-events-none
            group-hover/link:opacity-100 group-hover/link:translate-y-0
            z-10
          `}>
            {provider.name}
          </div>
        </a>
      ))}
    </div>
  );

  return (
    <div className={`group ${className}`}>
      {/* DESKTOP: Everything in one line */}
      <div className="hidden md:flex items-center gap-3">
        {/* Title with icon */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className={`relative w-6 h-6 rounded-md bg-gradient-to-br ${config.bgActive}/20 flex items-center justify-center border ${config.borderActive}`}>
            <svg className={`w-3.5 h-3.5 ${config.textActive}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-xs font-medium text-zinc-400 whitespace-nowrap">Dónde ver</span>
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-zinc-700 flex-shrink-0" />

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {availableTypes.map((type) => {
            const typeConf = typeConfig[type];
            const isActive = selectedType === type;
            
            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`
                  relative px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap
                  transition-all duration-200 ease-out
                  ${isActive 
                    ? `${typeConf.bgActive}/20 ${typeConf.textActive} border ${typeConf.borderActive} shadow-lg ${typeConf.glow}`
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent"
                  }
                `}
              >
                {typeConf.label}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-zinc-700 flex-shrink-0" />

        {/* Provider logos - scrollable */}
        <div className="flex-1 overflow-x-auto scrollbar-hide relative">
          <div className="flex items-center gap-2 min-w-max">
            <ProviderLogos />
          </div>
        </div>
      </div>

      {/* MOBILE: Filters on top, logos below */}
      <div className="flex md:hidden flex-col gap-3">
        {/* Header row */}
        <div className="flex items-center gap-2">
          <div className={`relative w-5 h-5 rounded-md bg-gradient-to-br ${config.bgActive}/20 flex items-center justify-center border ${config.borderActive}`}>
            <svg className={`w-3 h-3 ${config.textActive}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-xs font-medium text-zinc-400">Dónde ver</span>
        </div>

        {/* Filter pills - horizontal scroll */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {availableTypes.map((type) => {
            const typeConf = typeConfig[type];
            const isActive = selectedType === type;
            
            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`
                  relative px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap flex-shrink-0
                  transition-all duration-200 ease-out
                  ${isActive 
                    ? `${typeConf.bgActive}/20 ${typeConf.textActive} border ${typeConf.borderActive} shadow-lg ${typeConf.glow}`
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent"
                  }
                `}
              >
                {typeConf.label}
              </button>
            );
          })}
        </div>

        {/* Provider logos - below filters */}
        <div className="pl-0">
          <ProviderLogos size="small" />
        </div>
      </div>
    </div>
  );
}
