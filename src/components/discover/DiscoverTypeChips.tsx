"use client";

import React from "react";

export type MediaType = "all" | "movie" | "tv" | "game" | "user";

interface TypeChipsProps {
  selected: MediaType;
  onChange: (type: MediaType) => void;
}

const typeConfig: Record<MediaType, { label: string; icon: React.ReactNode; gradient: string }> = {
  all: {
    label: "Todo",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
    gradient: "from-emerald-500 to-teal-600",
  },
  movie: {
    label: "Películas",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
      </svg>
    ),
    gradient: "from-amber-500 to-orange-600",
  },
  tv: {
    label: "Series",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    gradient: "from-cyan-500 to-blue-600",
  },
  game: {
    label: "Juegos",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    ),
    gradient: "from-violet-500 to-fuchsia-600",
  },
  user: {
    label: "Usuarios",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    gradient: "from-emerald-500 to-teal-600",
  },
};

export function DiscoverTypeChips({ selected, onChange }: TypeChipsProps) {
  const types: MediaType[] = ["all", "movie", "tv", "game", "user"];

  return (
    <div className="flex gap-2 flex-nowrap">
      {types.map((type) => {
        const config = typeConfig[type];
        const isSelected = selected === type;

        return (
          <button
            key={type}
            onClick={() => onChange(type)}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              border transition-all duration-300 flex-shrink-0
              ${isSelected
                ? `bg-gradient-to-r ${config.gradient} text-white shadow-lg border-transparent`
                : "bg-zinc-900/60 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-zinc-300"
              }
            `}
          >
            {config.icon}
            <span>{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}
