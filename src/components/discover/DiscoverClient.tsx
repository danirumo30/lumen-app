"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { DiscoverSearchBar } from "@/components/discover/DiscoverSearchBar";
import { DiscoverTypeChips, MediaType } from "@/components/discover/DiscoverTypeChips";
import { DiscoverFiltersComponent, DiscoverFilters } from "@/components/discover/DiscoverFilters";
import { DiscoverGrid } from "@/components/discover/DiscoverGrid";

interface StreamingProvider {
  id: number;
  name: string;
  logoUrl: string | null;
  types: string[]; // TMDB types: flatrate, free, ads, rent, buy, etc.
}

export function DiscoverClient() {
  const [selectedType, setSelectedType] = useState<MediaType>("all");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<DiscoverFilters>({});
  const [availableProviders, setAvailableProviders] = useState<StreamingProvider[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const [providersError, setProvidersError] = useState<string | null>(null);

   // Load watch providers on mount
   useEffect(() => {
     console.log("[DiscoverClient] Loading watch providers...");
     
     // Detect browser region (e.g., "es-ES" -> "ES")
     const detectRegion = () => {
       if (typeof navigator === 'undefined') return 'ES';
       const lang = navigator.language || 'en-US';
       const regionPart = lang.split('-')[1];
       return regionPart ? regionPart.toUpperCase() : 'ES';
     };
     
     const region = detectRegion();
     console.log("[DiscoverClient] Detected region:", region);
     
     fetch(`/api/watch-providers?region=${region}`)
       .then(res => {
         console.log("[DiscoverClient] Response status:", res.status);
         return res.json();
       })
        .then(data => {
          console.log("[DiscoverClient] Providers data:", data);
          console.log("[DEBUG] Netflix provider:", data.find((p: any) => p.name === "Netflix"));
          console.log("[DEBUG] Amazon Prime provider:", data.find((p: any) => p.name === "Amazon Prime Video"));
          setAvailableProviders(data);
          setIsLoadingProviders(false);
          setProvidersError(null);
        })
       .catch(err => {
         console.error("[DiscoverClient] Failed to load providers:", err);
         setIsLoadingProviders(false);
         setProvidersError(err.message || "Unknown error");
       });
   }, []);

  const handleSearch = useCallback((newQuery: string) => {
    setQuery(newQuery);
    if (newQuery && newQuery.trim().length > 0) {
      setSelectedType("all");
    }
  }, []);

  // Clear filters when changing type
  const handleTypeChange = useCallback((newType: MediaType) => {
    setSelectedType(newType);
    setFilters({});
  }, []);

  // Multi-provider toggle
  const handleProviderChange = useCallback((providerIds: number[]) => {
    setFilters(prev => ({
      ...prev,
      providerIds: providerIds.length > 0 ? providerIds : undefined,
    }));
  }, []);

   // No availableAccessTypes needed; dropdown always shows all options when providers selected

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black pt-16">
      {/* Hero Section */}
      <div className="relative overflow-visible">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-zinc-950 to-zinc-950" />
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2334d399' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                Descubrir
              </span>
            </h1>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Explora películas, series, juegos y más en un solo lugar
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto mb-6">
            <DiscoverSearchBar onSearch={handleSearch} />
          </div>

          {/* Combined container for tabs and filters */}
          <div className="flex flex-col items-center gap-3">
            {/* Type Chips row */}
            <div className="flex justify-start sm:justify-center overflow-x-auto hide-scrollbar px-4 sm:px-0 gap-2 w-full snap-x snap-mandatory">
              <div className="snap-start">
                <DiscoverTypeChips selected={selectedType} onChange={handleTypeChange} />
              </div>
            </div>

            {/* Filters row */}
            <div className="flex justify-start sm:justify-center overflow-x-auto hide-scrollbar px-4 sm:px-0 gap-2 w-full snap-x snap-mandatory">
              <DiscoverFiltersComponent
                  type={selectedType}
                  filters={filters}
                  onChange={setFilters}
                  query={query}
                  availableProviders={selectedType !== "game" ? availableProviders : []}
                  isLoadingProviders={isLoadingProviders}
                  providersError={providersError}
                  onProviderChange={handleProviderChange}
                />
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <DiscoverGrid
          query={query}
          type={selectedType}
          filters={filters}
        />
      </div>
    </div>
  );
}
