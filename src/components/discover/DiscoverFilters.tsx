"use client";

import { useState, useRef, useEffect } from "react";
import { MediaType } from "./DiscoverTypeChips";

export interface DiscoverFilters {
  genre?: string;
  yearFrom?: number;
  yearTo?: number;
  platform?: string;
  sortBy?: "relevance" | "rating" | "year" | "popularity";
  sortDirection?: "asc" | "desc"; // Added for bidirectional sorting
  minRating?: number;
}

interface DiscoverFiltersProps {
  type: MediaType;
  filters: DiscoverFilters;
  onChange: (filters: DiscoverFilters) => void;
}

const genres = {
  movie: ["Acción", "Animación", "Aventura", "Bélica", "Ciencia ficción", "Comedia", "Crimen", "Documental", "Drama", "Familia", "Fantasía", "Historia", "Misterio", "Música", "Película de TV", "Romance", "Suspense", "Terror", "Western"],
  tv: ["Acción", "Animación", "Comedia", "Crimen", "Documental", "Drama", "Familia", "Kids", "Misterio & Terror", "News", "Reality", "Sci-Fi & Fantasía", "Soap", "Talk", "Guerra y política", "Western"],
  game: ["Acción", "Aventura", "RPG", "Estrategia", "Deportes", "Carreras", "Puzzle", "Horror", "Supervivencia", "Lucha"],
};

const platforms = {
  game: ["PlayStation", "Xbox", "Nintendo", "PC", "Mobile", "Linux", "Web"],
  tv: ["Netflix", "Amazon Prime", "Disney+", "HBO", "Hulu", "Apple TV+", "Paramount+"],
};

const sortOptions = [
  { value: "relevance", label: "Relevancia" },
  { value: "rating", label: "Puntuación" },
  { value: "year", label: "Año" },
  { value: "popularity", label: "Popularidad" },
];

const currentYear = new Date().getFullYear();

// Different year ranges for different media types (descending order: newest first)
const movieYears = Array.from({ length: currentYear - 1900 + 6 }, (_, i) => currentYear + 5 - i); // 2031 down to 1900
const tvYears = Array.from({ length: currentYear - 1900 + 6 }, (_, i) => currentYear + 5 - i);   // 2031 down to 1900
const gameYears = Array.from({ length: currentYear - 1950 + 4 }, (_, i) => currentYear + 3 - i); // 2029 down to 1950

// Get years based on media type
function getYearsForType(type: MediaType): number[] {
  switch (type) {
    case "movie": return movieYears;
    case "tv": return tvYears;
    case "game": return gameYears;
    default: return movieYears;
  }
}

// Dropdown component with chip-style selection (from franchise page)
function FilterDropdown({
  label,
  options,
  value,
  onChange,
  icon,
  scrollToValue,
  sortDirection, // New prop
  onSortDirectionChange, // New prop
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string | undefined; // Can be undefined for "Ordenar Por"
  onChange: (value: string | undefined) => void; // Can accept undefined
  icon?: React.ReactNode;
  scrollToValue?: string;
  sortDirection?: "asc" | "desc"; // New prop
  onSortDirectionChange?: (direction: "asc" | "desc") => void; // New prop
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll to specific value when dropdown opens (e.g., current year)
  useEffect(() => {
    if (isOpen && scrollToValue && listRef.current) {
      const element = listRef.current.querySelector(`[data-value="${scrollToValue}"]`);
      if (element) {
        element.scrollIntoView({ block: 'center', behavior: 'instant' });
      }
    }
  }, [isOpen, scrollToValue]);

  // Get display label
  const selectedOption = options.find(o => o.value === value);
  const displayLabel = selectedOption ? selectedOption.label : (label === "Ordenar" ? "Ordenar Por" : label); // "Ordenar Por" by default

  // Get accent color based on type
  const accentClass = label.includes("Género") 
    ? "bg-amber-600 text-white shadow-lg shadow-amber-600/25" 
    : label.includes("Plataforma")
    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25"
    : "bg-zinc-700 text-white shadow-lg shadow-zinc-700/25";

  // Determine SVG rotation for sorting icon
  const sortIconRotationClass = (icon && label === "Ordenar" && sortDirection === "desc") ? "rotate-180" : "";

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          value && value !== ""
            ? accentClass
            : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-700 hover:text-white border border-zinc-700/50"
        }`}
      >
        {icon && <span className={`w-4 h-4 ${sortIconRotationClass}`}>{icon}</span>}
        <span>{displayLabel}</span>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div ref={listRef} className="absolute top-full left-0 mt-2 w-48 py-2 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-xl shadow-2xl z-50 animate-dropdownIn overflow-y-auto" style={{ maxHeight: '220px' }}>
          <style jsx>{`
            div::-webkit-scrollbar {
              width: 6px;
            }
            div::-webkit-scrollbar-track {
              background: transparent;
            }
            div::-webkit-scrollbar-thumb {
              background: rgba(255,255,255,0.2);
              border-radius: 3px;
            }
            div::-webkit-scrollbar-thumb:hover {
              background: rgba(255,255,255,0.3);
            }
          `}</style>
          {options.map((option) => (
            <button
              key={option.value}
              data-value={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left text-sm transition-all duration-150 ${
                value === option.value
                  ? "text-amber-400 bg-amber-600/10"
                  : scrollToValue && option.value === scrollToValue
                  ? "text-white bg-zinc-700/50 ring-1 ring-zinc-600 hover:bg-zinc-600 hover:ring-zinc-500"
                  : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function DiscoverFiltersComponent({ type, filters, onChange }: DiscoverFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Only show filters when a specific type is selected
  if (type === "all" || type === "user") {
    return null;
  }

  const typeGenres = genres[type as keyof typeof genres] || [];
  const typePlatforms = platforms[type as keyof typeof platforms] || [];
  const typeYears = getYearsForType(type);

  const updateFilter = <K extends keyof DiscoverFilters>(key: K, value: DiscoverFilters[K]) => {
    if (value === undefined || value === null) {
      // Remove the filter property
      const { [key]: removed, ...rest } = filters;
      onChange(rest);
    } else {
      onChange({ ...filters, [key]: value });
    }
  };

  const genreOptions = [
    { value: "all", label: "Todos" },
    ...typeGenres.map(g => ({ value: g, label: g }))
  ];

  const platformOptions = [
    { value: "all", label: "Todas" },
    ...typePlatforms.map(p => ({ value: p, label: p }))
  ];

  const yearFromOptions = [
    { value: "all", label: "Desde" },
    ...typeYears.map(y => ({ value: String(y), label: String(y) }))
  ];

  const yearToOptions = [
    { value: "all", label: "Hasta" },
    ...typeYears.map(y => ({ value: String(y), label: String(y) }))
  ];

  const hasActiveFilters = filters.genre || filters.yearFrom || filters.yearTo || filters.platform || filters.sortBy;

  return (
    <div className="w-full">
      {/* Filter Bar - Always visible like franchise page */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {/* Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            isOpen || hasActiveFilters
              ? "bg-amber-600 text-white shadow-lg shadow-amber-600/25"
              : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-700 hover:text-white border border-zinc-700/50"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span>Filtros</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 bg-white rounded-full" />
          )}
        </button>

        {/* Genre Dropdown */}
        {typeGenres.length > 0 && (
          <FilterDropdown
            label="Género"
            options={genreOptions}
            value={filters.genre}
            onChange={(value) => updateFilter("genre", !value || value === "all" ? undefined : value)}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            }
          />
        )}

        {/* Platform Dropdown (for games) */}
        {type === "game" && typePlatforms.length > 0 && (
          <FilterDropdown
            label="Plataforma"
            options={platformOptions}
            value={filters.platform}
            onChange={(value) => updateFilter("platform", !value || value === "all" ? undefined : value)}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            }
          />
        )}

        {/* Year From */}
        <FilterDropdown
          label="Desde"
          options={yearFromOptions}
          value={filters.yearFrom ? String(filters.yearFrom) : undefined}
          onChange={(value) => updateFilter("yearFrom", !value || value === "all" ? undefined : parseInt(value))}
          scrollToValue={String(currentYear)}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />

        {/* Year To */}
        <FilterDropdown
          label="Hasta"
          options={yearToOptions}
          value={filters.yearTo ? String(filters.yearTo) : undefined}
          onChange={(value) => updateFilter("yearTo", !value || value === "all" ? undefined : parseInt(value))}
          scrollToValue={String(currentYear)}
        />

        {/* Sort By */}
        <FilterDropdown
          label="Ordenar"
          options={sortOptions}
          value={filters.sortBy}
          onChange={(value) => {
            // If selecting a new sort option (or toggling the same one)
            if (value) {
              if (filters.sortBy === value) {
                // Same option selected -> toggle direction
                updateFilter("sortDirection", filters.sortDirection === "asc" ? "desc" : "asc");
              } else {
                // New option selected -> set asc as default
                updateFilter("sortBy", value as DiscoverFilters["sortBy"]);
                updateFilter("sortDirection", "asc");
              }
            } else {
              // Deselecting (setting to undefined) -> clear sort
              updateFilter("sortBy", undefined);
              updateFilter("sortDirection", undefined);
            }
          }}
          sortDirection={filters.sortDirection}
          onSortDirectionChange={(direction) => updateFilter("sortDirection", direction)}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
          }
        />

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={() => onChange({})}
            className="text-sm text-zinc-500 hover:text-white transition-colors px-2"
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
