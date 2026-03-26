"use client";

import { useState, useEffect } from "react";

interface SearchBarProps {
  initialQuery?: string;
  onSearch?: (query: string, resetType?: boolean) => void;
}

export function DiscoverSearchBar({ initialQuery = "", onSearch }: SearchBarProps) {
  // Initialize with empty string to avoid hydration mismatch, then update
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setQuery(initialQuery || "");
  }, [initialQuery]);

  // Handle input change (immediate, debounce moved to parent)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    if (onSearch) {
      onSearch(newQuery);
    }
  };

  // Remove the debounced useEffect - now handled by parent

  const handleClear = () => {
    setQuery("");
    if (onSearch) {
      onSearch("");
    }
  };

  const handleSuggestionClick = (term: string) => {
    setQuery(term);
    setIsFocused(false);
    if (onSearch) {
      onSearch(term, true); // resetType = true
    }
  };

  return (
    <div className="relative w-full max-w-3xl">
      <div
        className={`
          relative flex items-center bg-zinc-900/80 backdrop-blur-sm
          border rounded-2xl overflow-hidden
          transition-all duration-300
          ${isFocused
            ? "border-emerald-500/50 ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-500/10"
            : "border-zinc-800 hover:border-zinc-700"}
        `}
      >
        {/* Search Icon */}
        <div className="pl-4">
          <svg
            className={`w-5 h-5 transition-colors ${isFocused ? "text-emerald-400" : "text-zinc-500"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder="Buscar películas, series, juegos..."
          title="Buscar en Descubrir"
          className="flex-1 bg-transparent py-3 px-4 text-white placeholder-zinc-500 focus:outline-none text-base"
        />

        {/* Clear Button */}
        {query && (
          <button
            onClick={handleClear}
            className="pr-4 pl-2 py-2 group"
          >
            <svg
              className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Quick suggestions */}
      {isFocused && !query && (
        <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-lg z-50">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">
            Búsquedas populares
          </p>
          <div className="flex flex-wrap gap-2">
            {["Dune", "Breaking Bad", "The Last of Us", "Stranger Things"].map((term) => (
              <button
                key={term}
                onClick={() => handleSuggestionClick(term)}
                className="px-3 py-1.5 text-sm text-zinc-400 bg-zinc-800/80 rounded-lg
                  hover:bg-zinc-700 hover:text-white transition-all"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
