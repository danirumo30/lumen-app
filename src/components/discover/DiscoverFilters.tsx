"use client";

import { useState } from "react";
import { MediaType } from "./DiscoverTypeChips";

export interface DiscoverFilters {
  genre?: string;
  yearFrom?: number;
  yearTo?: number;
  platform?: string;
  sortBy?: "relevance" | "rating" | "year" | "popularity";
}

interface DiscoverFiltersProps {
  type: MediaType;
  filters: DiscoverFilters;
  onChange: (filters: DiscoverFilters) => void;
}

const genres = {
  movie: ["Acción", "Comedia", "Drama", "Terror", "Ciencia Ficción", "Romance", "Thriller", "Animación", "Documental", "Aventura"],
  tv: ["Drama", "Comedia", "Ciencia Ficción", "Terror", "Acción", "Romance", "Thriller", "Documental", "Animación"],
  game: ["Acción", "Aventura", "RPG", "Estrategia", "Deportes", "Carreras", "Puzzle", "Horror", "Supervivencia", "Lucha"],
};

const platforms = {
  game: ["PlayStation", "Xbox", "Nintendo", "PC", "Mobile", "Linux", "Web"],
  tv: ["Netflix", "Amazon Prime", "Disney+", "HBO", "Hulu", "Apple TV+", "Paramount+"],
};

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

export function DiscoverFiltersComponent({ type, filters, onChange }: DiscoverFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Only show filters when a specific type is selected
  if (type === "all" || type === "user") {
    return null;
  }

  const typeGenres = genres[type as keyof typeof genres] || [];
  const typePlatforms = platforms[type as keyof typeof platforms] || [];

  const updateFilter = <K extends keyof DiscoverFilters>(key: K, value: DiscoverFilters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="w-full">
      {/* Toggle Filters Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-400 bg-zinc-800/50 rounded-lg 
          hover:bg-zinc-800 hover:text-white transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        <span>Filtros</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} 
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Filters Panel */}
      {isOpen && (
        <div className="mt-3 p-4 bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-xl animate-in slide-in-from-top-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Genre Filter */}
            {typeGenres.length > 0 && (
              <div>
                <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-2">
                  Género
                </label>
                <select
                  value={filters.genre || ""}
                  onChange={(e) => updateFilter("genre", e.target.value || undefined)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm
                    focus:outline-none focus:border-amber-500/50"
                >
                  <option value="">Todos</option>
                  {typeGenres.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Year From */}
            <div>
              <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-2">
                Desde
              </label>
              <select
                value={filters.yearFrom || ""}
                onChange={(e) => updateFilter("yearFrom", e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm
                  focus:outline-none focus:border-amber-500/50"
              >
                <option value="">Cualquiera</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Year To */}
            <div>
              <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-2">
                Hasta
              </label>
              <select
                value={filters.yearTo || ""}
                onChange={(e) => updateFilter("yearTo", e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm
                  focus:outline-none focus:border-amber-500/50"
              >
                <option value="">Cualquiera</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Platform (for games) or Sort */}
            {type === "game" && typePlatforms.length > 0 && (
              <div>
                <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-2">
                  Plataforma
                </label>
                <select
                  value={filters.platform || ""}
                  onChange={(e) => updateFilter("platform", e.target.value || undefined)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm
                    focus:outline-none focus:border-amber-500/50"
                >
                  <option value="">Todas</option>
                  {typePlatforms.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort By */}
            <div className={type === "game" ? "" : "col-span-2"}>
              <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-2">
                Ordenar por
              </label>
              <select
                value={filters.sortBy || "relevance"}
                onChange={(e) => updateFilter("sortBy", e.target.value as DiscoverFilters["sortBy"])}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm
                  focus:outline-none focus:border-amber-500/50"
              >
                <option value="relevance">Relevancia</option>
                <option value="rating">Puntuación</option>
                <option value="year">Año</option>
                <option value="popularity">Popularidad</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-end">
            <button
              onClick={() => onChange({})}
              className="text-sm text-zinc-500 hover:text-white transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
