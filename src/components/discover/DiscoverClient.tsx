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
      accessType: undefined,
    }));
  }, []);

  const handleAccessTypeChange = useCallback((accessType: "subscription" | "free" | "ads" | "rent" | "buy" | null) => {
    setFilters(prev => ({
      ...prev,
      accessType: accessType || undefined,
    }));
  }, []);

  // Compute allowed access types: show ALL types when any provider is selected
  const availableAccessTypes = useMemo(() => {
    if (filters.providerIds && filters.providerIds.length > 0) {
      // All possible access types (TMDB monetization types mapped to UI)
      return ["subscription", "free", "ads", "rent", "buy"] as ("subscription" | "free" | "ads" | "rent" | "buy")[];
    }
    return [] as ("subscription" | "free" | "ads" | "rent" | "buy")[];
  }, [filters.providerIds]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black pt-16">
      {/* Hero Section */}
      <div className="relative overflow-visible">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-zinc-950 to-zinc-950" />
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f59e0b' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">
              Desc<span className="text-amber-400">ubrir</span>
            </h1>
            <p className="text-zinc-400 text-lg">
              Películas, series, juegos y más
            </p>
          </div>

          {/* Search Bar */}
          <DiscoverSearchBar onSearch={handleSearch} />

          {/* Type Chips */}
          <div className="mt-8 flex justify-center">
            <DiscoverTypeChips selected={selectedType} onChange={handleTypeChange} />
          </div>

          {/* Filters */}
          <div className="mt-4 flex justify-center">
           <DiscoverFiltersComponent
               type={selectedType}
               filters={filters}
               onChange={setFilters}
               query={query}
               availableProviders={selectedType !== "game" ? availableProviders : []}
               isLoadingProviders={isLoadingProviders}
               providersError={providersError}
               onProviderChange={handleProviderChange}
               onAccessTypeChange={handleAccessTypeChange}
               availableAccessTypes={availableAccessTypes}
             />
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <DiscoverGrid 
          query={query} 
          type={selectedType} 
          filters={filters}
        />
      </div>
    </div>
  );
}
