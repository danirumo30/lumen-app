"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { MediaType } from "./DiscoverTypeChips";

export interface DiscoverFilters {
  genre?: string;
  yearFrom?: number;
  yearTo?: number;
  minRating?: number;
  platform?: string;
  providerIds?: number[]; 
  sortBy?: "relevance" | "rating" | "year" | "popularity";
  sortDirection?: "asc" | "desc";
}

interface DiscoverFiltersProps {
  type: MediaType;
  filters: DiscoverFilters;
  onChange: (filters: DiscoverFilters) => void;
  query?: string;
  
  availableProviders?: Array<{ id: number; name: string; logoUrl: string | null }>;
  isLoadingProviders?: boolean;
  providersError?: string | null;
  onProviderChange?: (providerIds: number[]) => void;
}

interface FilterDropdownProps {
   label: string;
   options: { value: string; label: string; isCurrent?: boolean }[];
   value: string | string[] | undefined;
   onChange: (value: string | string[] | undefined) => void;
   icon?: React.ReactNode;
   scrollToValue?: string;
   sortDirection?: "asc" | "desc";
   disabled?: boolean;
   title?: string;
   dropdownId: string;
   isOpen: boolean;
   onOpenChange: (id: string, open: boolean) => void;
   multiSelect?: boolean;
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


const movieYears = Array.from({ length: currentYear - 1900 + 6 }, (_, i) => currentYear + 5 - i); 
const tvYears = Array.from({ length: currentYear - 1900 + 6 }, (_, i) => currentYear + 5 - i);   
const gameYears = Array.from({ length: currentYear - 1950 + 4 }, (_, i) => currentYear + 3 - i); 

function getYearsForType(type: MediaType): number[] {
  switch (type) {
    case "movie": return movieYears;
    case "tv": return tvYears;
    case "game": return gameYears;
    default: return movieYears;
  }
}

function FilterDropdown(props: FilterDropdownProps) {
  const {
    label,
    options,
    value,
    onChange,
    icon,
    scrollToValue,
    sortDirection,
    disabled = false,
    title,
    dropdownId,
    isOpen,
    onOpenChange,
    multiSelect = false,
  } = props;

  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const handleToggle = () => {
    if (!disabled) {
      const newState = !isOpen;
      if (dropdownId && onOpenChange) {
        onOpenChange(dropdownId, newState);
      }
    }
  };

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setMenuStyle({
        position: 'fixed' as const,
        top: rect.bottom + 8,
        left: rect.left,
        width: '192px',
        zIndex: 9999,
      });
    }
  }, [isOpen]);

  
  useEffect(() => {
    if (!isOpen) return;
    const closeOnScroll = () => {
      if (dropdownId && onOpenChange) {
        onOpenChange(dropdownId, false);
      }
    };
    window.addEventListener('scroll', closeOnScroll, { passive: true });
    window.addEventListener('resize', closeOnScroll);
    return () => {
      window.removeEventListener('scroll', closeOnScroll);
      window.removeEventListener('resize', closeOnScroll);
    };
  }, [isOpen, dropdownId, onOpenChange]);

   useEffect(() => {
     function handleClickOutside(event: MouseEvent | TouchEvent) {
       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
         if (dropdownId && onOpenChange) {
           onOpenChange(dropdownId, false);
         }
       }
     }
     document.addEventListener("mousedown", handleClickOutside);
     document.addEventListener("touchstart", handleClickOutside);
     return () => {
       document.removeEventListener("mousedown", handleClickOutside);
       document.removeEventListener("touchstart", handleClickOutside);
     };
   }, [dropdownId, onOpenChange]);

  useEffect(() => {
    if (isOpen && scrollToValue && listRef.current) {
      setTimeout(() => {
        const element = listRef.current?.querySelector(`[data-value="${scrollToValue}"]`);
        if (element) {
          element.scrollIntoView({ block: 'center', behavior: 'instant' });
        }
      }, 0);
    }
  }, [isOpen, scrollToValue]);

  const selectedValues = useMemo(() => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  const handleOptionClick = (optionValue: string) => {
    if (multiSelect) {
      const currentArray = Array.isArray(value) ? value : (value ? [value] : []);
      if (currentArray.includes(optionValue)) {
        const newArray = currentArray.filter(v => v !== optionValue);
        onChange(newArray.length > 0 ? newArray : undefined);
      } else {
        onChange([...currentArray, optionValue]);
      }
    } else {
      onChange(optionValue);
      if (dropdownId && onOpenChange) {
        onOpenChange(dropdownId, false);
      }
    }
  };

  const displayLabel = useMemo(() => {
    if (multiSelect && selectedValues.length > 0) {
      return `${label} (${selectedValues.length})`;
    }
    if (!multiSelect && value) {
      const selected = options.find(o => o.value === value);
      if (selected) return selected.label;
    }
    return label === "Ordenar" ? "Ordenar Por" : label;
  }, [label, value, selectedValues, options, multiSelect]);

   const getAccentGradient = (label: string) => {
     if (label.includes("Género")) return "from-amber-500 to-orange-600";
     if (label.includes("Plataforma")) return "from-violet-500 to-fuchsia-600";
     if (label.includes("Ordenar")) return "from-cyan-500 to-blue-600";
     return "from-emerald-500 to-teal-600";
   };

   const accentGradient = label.includes("Género") || label.includes("Plataforma") || label.includes("Ordenar")
    ? getAccentGradient(label)
    : "from-emerald-500 to-teal-600";

   return (
     <div ref={dropdownRef} className="relative z-20">
         <button
           onClick={handleToggle}
           onTouchStart={(e) => e.stopPropagation()}
           disabled={disabled}
           title={title}
           className={`
             flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
             border transition-all duration-300
             ${value && (!Array.isArray(value) ? value : (value as string[]).length > 0)
               ? `bg-gradient-to-r ${accentGradient} text-white shadow-lg border-transparent`
               : "bg-zinc-900/60 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-white"
             } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
           `}
         >
           {icon && (
             <span className={`w-4 h-4 ${sortDirection ? 'transition-transform duration-200' : ''} ${sortDirection === 'asc' ? 'rotate-180' : ''}`}>
               {icon}
             </span>
           )}
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
        <div
          ref={listRef}
          onTouchStart={(e) => e.stopPropagation()}
          className="fixed z-[9999] py-2 bg-emerald-900/98 backdrop-blur-xl border border-emerald-500/50 rounded-lg shadow-2xl animate-dropdownIn overflow-y-auto dropdown-scrollbar"
          style={{
            ...menuStyle,
            maxHeight: '50vh',
            boxShadow: '0 0 20px rgba(52, 211, 153, 0.3)',
            touchAction: 'pan-y',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {options.map((option) => {
            const isSelected = selectedValues.includes(option.value);
            const isCurrent = (option as { isCurrent?: boolean }).isCurrent;
            return (
              <button
                key={option.value}
                data-value={option.value}
                onClick={() => handleOptionClick(option.value)}
                className={`w-full px-4 py-2 text-left text-sm transition-all duration-150 flex items-center gap-2 ${
                  isSelected
                    ? "text-amber-400 bg-amber-600/10"
                    : isCurrent
                    ? "text-emerald-400 bg-emerald-900/30 font-semibold"
                    : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                {multiSelect && (
                  <span className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-amber-500 border-amber-500' : 'border-zinc-600'}`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                )}
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DiscoverFiltersComponent({
  type,
  filters,
  onChange,
  query,
   availableProviders = [],
   isLoadingProviders = false,
   providersError = null,
   onProviderChange,
 }: DiscoverFiltersProps) {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const handleDropdownToggle = (id: string, isOpen: boolean) => {
    if (isOpen) {
      
      setOpenDropdownId(id);
    } else {
      if (openDropdownId === id) {
        setOpenDropdownId(null);
      }
    }
  };

   
  if (type === "all" || type === "user") {
    return null;
  }

   const isSearching = !!(query && query.trim().length >= 2);
   const isMovieOrTv = type === "movie" || type === "tv";
   const isGenreDisabled = isSearching && isMovieOrTv;
   const isYearDisabled = isSearching && isMovieOrTv;
   const isPlatformDisabled = isSearching && isMovieOrTv;
   const isSortDisabled = isSearching && (isMovieOrTv || type === "game");

  const typeGenres = genres[type as keyof typeof genres] || [];
  const typePlatforms = platforms[type as keyof typeof platforms] || [];
  const typeYears = getYearsForType(type);

  const availableSortOptions = (isSearching && isMovieOrTv)
    ? sortOptions.filter(opt => opt.value === "popularity" || opt.value === "year")
    : sortOptions;

  const updateFilter = <K extends keyof DiscoverFilters>(key: K, value: DiscoverFilters[K]) => {
    if (value === undefined || value === null) {
      const rest = { ...filters };
      delete rest[key];
      onChange(rest);
    } else {
      onChange({ ...filters, [key]: value });
    }
  };

  const genreOptions = [
    { value: "all", label: "Todos" },
    ...typeGenres.map(g => ({ value: g, label: g }))
  ];

  const platformOptions = typePlatforms.map(p => ({ value: p, label: p }));

  const yearFromOptions = [
    { value: "all", label: "Desde" },
    ...typeYears.map(y => ({ value: String(y), label: String(y), isCurrent: y === currentYear }))
  ];

  const yearToOptions = [
    { value: "all", label: "Hasta" },
    ...typeYears.map(y => ({ value: String(y), label: String(y), isCurrent: y === currentYear }))
  ];

  const hasActiveFilters = filters.genre || filters.yearFrom || filters.yearTo || filters.platform || filters.sortBy || (filters.providerIds && filters.providerIds.length > 0);

  return (
    <div
      className="flex-shrink-0"
    >
       {}
       <div
         className="flex items-center justify-start gap-2 overflow-x-auto hide-scrollbar snap-x snap-mandatory relative z-20"
         style={{
           touchAction: openDropdownId ? 'pan-y' : 'auto',
         }}
       >

        {}
        {typeGenres.length > 0 && (
          <div className="flex-shrink-0 snap-start">
            <FilterDropdown
              label="Género"
              options={genreOptions}
              value={filters.genre}
              onChange={(value) => updateFilter("genre", !value || value === "all" ? undefined : (value as string))}
              disabled={isGenreDisabled}
              title={isGenreDisabled ? "No disponible durante búsqueda" : undefined}
              dropdownId="genre"
              isOpen={openDropdownId === "genre"}
              onOpenChange={handleDropdownToggle}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              }
            />
          </div>
        )}

        {}
        {type !== "game" && (
          <>
            {}
            {isLoadingProviders && (
              <div className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                ⏳ Cargando proveedores...
              </div>
            )}

            {}
            {providersError && !isLoadingProviders && (
              <div className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-red-900/30 text-red-400 border border-red-700/50 max-w-xs">
                ⚠️ Error: {providersError}
              </div>
            )}

            {}
            {!isLoadingProviders && !providersError && availableProviders && availableProviders.length === 0 && (
              <div className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-500 italic border border-zinc-700/50">
                No hay proveedores disponibles
              </div>
            )}

            {}
            {!isLoadingProviders && !providersError && availableProviders && availableProviders.length > 0 && (
              <>
                {}
                <div className="flex-shrink-0 snap-start">
                 <FilterDropdown
                   label="Plataforma"
                   options={[
                     ...availableProviders.map(p => ({ value: String(p.id), label: p.name, isCurrent: false }))
                   ]}
                   value={filters.providerIds?.map(String) || undefined}
                   onChange={(value) => {
                     const ids = Array.isArray(value)
                       ? value.map(v => parseInt(v)).filter(n => !isNaN(n))
                       : (value && value !== "all") ? [parseInt(value)] : [];
                     onProviderChange?.(ids);
                   }}
                   multiSelect={true}
                   disabled={isPlatformDisabled}
                   title={isPlatformDisabled ? "No disponible durante búsqueda" : undefined}
                   icon={
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                       </svg>
                     }
                     dropdownId="provider"
                     isOpen={openDropdownId === "provider"}
                     onOpenChange={handleDropdownToggle}
                   />
                 </div>
               </>
             )}
           </>
         )}

        {}
        {type === "game" && typePlatforms.length > 0 && (
          <div className="flex-shrink-0 snap-start">
            <FilterDropdown
              label="Plataforma"
              options={platformOptions}
              value={filters.platform}
              onChange={(value) => updateFilter("platform", !value || value === "all" ? undefined : (value as string))}
              dropdownId="platform"
              isOpen={openDropdownId === "platform"}
              onOpenChange={handleDropdownToggle}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            />
          </div>
        )}

        {}
        {isMovieOrTv && isSearching ? (
          <div className="flex-shrink-0 snap-start">
            <FilterDropdown
              label="Año"
              options={typeYears.map(y => ({ value: String(y), label: String(y), isCurrent: y === currentYear }))}
              value={filters.yearFrom ? String(filters.yearFrom) : undefined}
              onChange={(value) => {
                updateFilter("yearFrom", !value || value === "all" ? undefined : parseInt(value as string));
                
                if (filters.yearTo) {
                  const rest = { ...filters };
                  delete rest.yearTo;
                  onChange(rest);
                }
              }}
              scrollToValue={String(currentYear)}
              dropdownId="yearSearch"
              isOpen={openDropdownId === "yearSearch"}
              onOpenChange={handleDropdownToggle}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
          </div>
        ) : (
          <>
            {}
            <div className="flex-shrink-0 snap-start">
              <FilterDropdown
                label="Desde"
                options={yearFromOptions}
                value={filters.yearFrom ? String(filters.yearFrom) : undefined}
                onChange={(value) => updateFilter("yearFrom", !value || value === "all" ? undefined : parseInt(value as string))}
                scrollToValue={String(currentYear)}
                disabled={isYearDisabled}
                title={isYearDisabled ? "No disponible durante búsqueda" : undefined}
                dropdownId="yearFrom"
                isOpen={openDropdownId === "yearFrom"}
                onOpenChange={handleDropdownToggle}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              />
            </div>
            {}
            <div className="flex-shrink-0 snap-start">
              <FilterDropdown
                label="Hasta"
                options={yearToOptions}
                value={filters.yearTo ? String(filters.yearTo) : undefined}
                onChange={(value) => updateFilter("yearTo", !value || value === "all" ? undefined : parseInt(value as string))}
                scrollToValue={String(currentYear)}
                disabled={isYearDisabled}
                title={isYearDisabled ? "No disponible durante búsqueda" : undefined}
                dropdownId="yearTo"
                isOpen={openDropdownId === "yearTo"}
                onOpenChange={handleDropdownToggle}
              />
            </div>
          </>
        )}

        {}
        <div className="flex-shrink-0 snap-start">
          <FilterDropdown
            label="Ordenar"
            options={availableSortOptions}
            value={filters.sortBy}
            onChange={(value) => {
              if (value) {
                if (filters.sortBy === value) {
                  updateFilter("sortDirection", filters.sortDirection === "asc" ? "desc" : "asc");
                } else {
                  
                  onChange({ ...filters, sortBy: value as DiscoverFilters["sortBy"], sortDirection: "asc" });
                }
               } else {
                 const rest = { ...filters };
                 delete rest.sortBy;
                 delete rest.sortDirection;
                 onChange(rest);
               }
             }}
             sortDirection={filters.sortDirection}
             disabled={isSortDisabled}
            title={isSortDisabled ? "No disponible durante búsqueda" : undefined}
            dropdownId="sort"
            isOpen={openDropdownId === "sort"}
            onOpenChange={handleDropdownToggle}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
            }
          />
        </div>

         {}
         {hasActiveFilters && (
           <div className="flex-shrink-0 snap-start">
             <button
               onClick={() => onChange({})}
               className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30"
             >
               Limpiar
             </button>
           </div>
         )}
      </div>
    </div>
  );
}






