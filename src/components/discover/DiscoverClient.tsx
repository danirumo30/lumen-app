"use client";

import { useState, useCallback, useEffect } from "react";
import { DiscoverSearchBar } from "@/components/discover/DiscoverSearchBar";
import { DiscoverTypeChips, MediaType } from "@/components/discover/DiscoverTypeChips";
import { DiscoverFiltersComponent, DiscoverFilters } from "@/components/discover/DiscoverFilters";
import { DiscoverGrid } from "@/components/discover/DiscoverGrid";

interface StreamingProvider {
  id: number;
  name: string;
  logoUrl: string | null;
  types: string[]; 
}

export function DiscoverClient() {
  const [selectedType, setSelectedType] = useState<MediaType>("all");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<DiscoverFilters>({});
  const [availableProviders, setAvailableProviders] = useState<StreamingProvider[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const [providersError, setProvidersError] = useState<string | null>(null);

   useEffect(() => {
     console.log("[DiscoverClient] Loading watch providers...");
     
     
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
        .then((data: StreamingProvider[]) => {
          console.log("[DiscoverClient] Providers data:", data);
          console.log("[DEBUG] Netflix provider:", data.find((p: StreamingProvider) => p.name === "Netflix"));
          console.log("[DEBUG] Amazon Prime provider:", data.find((p: StreamingProvider) => p.name === "Amazon Prime Video"));
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

  
  const handleTypeChange = useCallback((newType: MediaType) => {
    setSelectedType(newType);
    setFilters({});
  }, []);

  
  const handleProviderChange = useCallback((providerIds: number[]) => {
    setFilters(prev => ({
      ...prev,
      providerIds: providerIds.length > 0 ? providerIds : undefined,
    }));
  }, []);

   

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black pt-16">
      {}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/10 via-zinc-950 to-zinc-950" />
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2334d399' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {}
        <div className="w-full flex justify-center mb-6">
          <div className="relative w-full max-w-3xl">
            <div className="absolute -inset-2 blur-md bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-full" />
            <div className="relative h-[2px] w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-full animate-gradient-x" />
          </div>
        </div>

        {}
        <div className="w-full flex justify-center mb-6">
          <p className="text-lg tracking-wide max-w-3xl text-center font-light animate-gradient-text">
            Encuentra tu próxima película, serie o juego favorito
          </p>
        </div>

        {}
        <div className="w-full flex justify-center mb-4">
          <div className="w-full max-w-3xl">
            <DiscoverSearchBar onSearch={handleSearch} />
          </div>
        </div>

        {}
        <div className="flex flex-col items-start gap-2 w-full max-w-3xl mx-auto">
          {}
          <div className="flex justify-start overflow-x-auto hide-scrollbar gap-2 w-full snap-x snap-mandatory">
            <div className="snap-start">
              <DiscoverTypeChips selected={selectedType} onChange={handleTypeChange} />
            </div>
          </div>

          {}
          <div className="flex justify-start overflow-x-auto hide-scrollbar gap-2 w-full snap-x snap-mandatory">
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

      {}
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <DiscoverGrid
          query={query}
          type={selectedType}
          filters={filters}
        />
      </div>
    </div>
  );
}

