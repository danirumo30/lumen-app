"use client";

import { useState, useEffect, use, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

interface FranchiseGame {
  id: string;
  igdbId: number;
  name: string;
  posterUrl: string | null;
  releaseDate: string | null;
  releaseYear: number | null;
  rating: number | null;
  genres: string[];
}

interface FranchiseInfo {
  id: number;
  name: string;
}

interface GameDetails {
  id: string;
  name: string;
  type: "main" | "dlc" | "expansion" | "edition";
  platforms: string[];
}

type SortOption = "release_desc" | "release_asc" | "rating_desc" | "name_asc";
type FilterType = "all" | "main" | "dlc" | "expansion" | "edition";
type FilterPlatform = "all" | "PC" | "PlayStation" | "Xbox" | "Nintendo" | "Mobile";

interface FilterOption {
  value: string;
  label: string;
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="relative w-8 h-8">
        <div className="absolute top-0 left-0 w-full h-full border-2 border-zinc-700 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-2 border-transparent border-t-violet-500 rounded-full animate-spin"></div>
      </div>
    </div>
  );
}

// Dropdown component with chip-style selection
function FilterDropdown({
  label,
  options,
  value,
  onChange,
  icon
}: {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);
  const displayLabel = selectedOption?.value === "all" ? label : selectedOption?.label || label;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          value !== "all"
            ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25"
            : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-700 hover:text-white border border-zinc-700/50"
        }`}
      >
        {icon && <span className="w-4 h-4">{icon}</span>}
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

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-48 py-2 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-xl shadow-2xl z-50 animate-dropdownIn">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left text-sm transition-all duration-150 ${
                value === option.value
                  ? "text-violet-400 bg-violet-600/10"
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

function SearchInput({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative flex-1 max-w-xs">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
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
      <input
        type="text"
        placeholder="Buscar juego..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-800/60 border border-zinc-700/50 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 transition-all"
      />
    </div>
  );
}

export default function FranchisePage({ params }: { params: Promise<{ id: string; franchiseId: string }> }) {
  const { id: pageId, franchiseId } = use(params);
  
  const [franchise, setFranchise] = useState<FranchiseInfo | null>(null);
  const [games, setGames] = useState<FranchiseGame[]>([]);
  const [filteredGames, setFilteredGames] = useState<FranchiseGame[]>([]);
  const [gameDetails, setGameDetails] = useState<Map<string, GameDetails>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("release_desc");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterPlatform, setFilterPlatform] = useState<FilterPlatform>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const typeOptions: FilterOption[] = [
    { value: "all", label: "Todos" },
    { value: "main", label: "Juego base" },
    { value: "dlc", label: "DLC" },
    { value: "expansion", label: "Expansión" },
    { value: "edition", label: "Edición" },
  ];

  const platformOptions: FilterOption[] = [
    { value: "all", label: "Todas" },
    { value: "PC", label: "PC" },
    { value: "PlayStation", label: "PlayStation" },
    { value: "Xbox", label: "Xbox" },
    { value: "Nintendo", label: "Nintendo" },
    { value: "Mobile", label: "Móvil" },
  ];

  const sortOptions: FilterOption[] = [
    { value: "release_desc", label: "Más reciente" },
    { value: "release_asc", label: "Más antiguo" },
    { value: "rating_desc", label: "Mejor rating" },
    { value: "name_asc", label: "A-Z" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/games/${franchiseId}/franchise`);
        const data = await response.json();
        
        setFranchise(data.franchise);
        setGames(data.games || []);
        setFilteredGames(data.games || []);
      } catch (error) {
        console.error("Error fetching franchise:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [franchiseId]);

  const fetchGameDetails = useCallback(async () => {
    if (filterType !== "all" || filterPlatform !== "all") {
      setIsLoadingDetails(true);
      try {
        const response = await fetch(`/api/games/${franchiseId}/franchise-details`);
        const data = await response.json();
        
        if (data.details) {
          const detailsMap = new Map<string, GameDetails>();
          data.details.forEach((detail: GameDetails) => {
            detailsMap.set(detail.id, detail);
          });
          setGameDetails(detailsMap);
        }
      } catch (error) {
        console.error("Error fetching game details:", error);
      } finally {
        setIsLoadingDetails(false);
      }
    } else {
      setGameDetails(new Map());
    }
  }, [franchiseId, filterType, filterPlatform]);

  useEffect(() => {
    fetchGameDetails();
  }, [fetchGameDetails]);

  useEffect(() => {
    let result = [...games];

    if (searchQuery) {
      result = result.filter(game => 
        game.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterType !== "all" && gameDetails.size > 0) {
      result = result.filter(game => {
        const detail = gameDetails.get(game.id);
        return detail?.type === filterType;
      });
    }

    if (filterPlatform !== "all" && gameDetails.size > 0) {
      result = result.filter(game => {
        const detail = gameDetails.get(game.id);
        if (!detail) return true;
        return detail.platforms.some(p => p.includes(filterPlatform));
      });
    }

    switch (sortBy) {
      case "release_desc":
        result.sort((a, b) => (b.releaseYear || 0) - (a.releaseYear || 0));
        break;
      case "release_asc":
        result.sort((a, b) => (a.releaseYear || 0) - (b.releaseYear || 0));
        break;
      case "rating_desc":
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "name_asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    setFilteredGames(result);
  }, [games, sortBy, searchQuery, filterType, filterPlatform, gameDetails]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse space-y-4">
          <div className="w-64 h-8 bg-zinc-800 rounded" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="w-40 h-60 bg-zinc-800 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/20 via-zinc-950 to-zinc-950" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back button */}
        <Link
          href={`/game/${pageId}`}
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Volver al juego</span>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {franchise?.name || "Franchise"}
          </h1>
          <p className="text-zinc-400">
            {filteredGames.length} {filteredGames.length === 1 ? "juego" : "juegos"}
          </p>
        </div>

        {/* Filters Bar */}
        <div className="mb-8 pb-6 border-b border-white/5">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <SearchInput value={searchQuery} onChange={setSearchQuery} />

            {/* Type Filter */}
            <FilterDropdown
              label="Tipo"
              options={typeOptions}
              value={filterType}
              onChange={(v) => setFilterType(v as FilterType)}
            />

            {/* Platform Filter */}
            <FilterDropdown
              label="Plataforma"
              options={platformOptions}
              value={filterPlatform}
              onChange={(v) => setFilterPlatform(v as FilterPlatform)}
            />

            {/* Sort */}
            <div className="ml-auto">
              <FilterDropdown
                label="Ordenar"
                options={sortOptions}
                value={sortBy}
                onChange={(v) => setSortBy(v as SortOption)}
              />
            </div>
          </div>
        </div>

        {/* Games Grid - with spinner when loading details */}
        {isLoadingDetails ? (
          <Spinner />
        ) : filteredGames.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredGames.map((game) => {
              const detail = gameDetails.get(game.id);
              return (
                <Link
                  key={game.id}
                  href={`/game/${game.id}`}
                  className="group relative"
                >
                   <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-800 border border-white/[0.03] transition-all duration-300 group-hover:scale-105 group-hover:border-white/10 group-hover:shadow-xl group-hover:shadow-black/50">
                     {game.posterUrl ? (
                       <Image
                         src={game.posterUrl}
                         alt={game.name}
                         fill
                         className="object-cover transition-transform duration-500 group-hover:scale-110"
                         loading="lazy"
                         sizes="(max-width: 768px) 25vw, (max-width: 1024px) 16vw, 12vw"
                       />
                     ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-800">
                        <svg
                          className="w-8 h-8 text-zinc-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                          />
                        </svg>
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {/* Rating badge */}
                      {game.rating && (
                        <div className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm">
                          <span className="text-xs font-semibold text-white/90">
                            {game.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                      {/* Type badge */}
                      {detail && detail.type !== "main" && (
                        <div className="px-2 py-0.5 rounded-md bg-violet-600/90 backdrop-blur-sm">
                          <span className="text-xs font-semibold text-white uppercase">
                            {detail.type === "dlc" ? "DLC" : detail.type}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-medium text-white/90 mt-2 line-clamp-2 leading-tight">
                    {game.name}
                  </h3>
                  {game.releaseYear && (
                    <p className="text-xs text-zinc-500 mt-0.5">{game.releaseYear}</p>
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <svg
              className="w-16 h-16 text-zinc-700 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-zinc-400 mb-1">
              No se encontraron juegos
            </h3>
            <p className="text-zinc-500">
              Ajusta los filtros para ver más resultados
            </p>
          </div>
        )}
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes dropdownIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-dropdownIn {
          animation: dropdownIn 0.15s ease-out;
        }
      `}</style>
    </div>
  );
}

