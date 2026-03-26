"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

type TabType = "content" | "games" | "users";

interface MediaResult {
  id: string;
  type: "movie" | "tv" | "game";
  title: string;
  posterUrl: string | null;
  voteAverage: number | null;
  releaseDate: string | null;
  overview?: string;
  genres?: string[];
  platforms?: string[];
  platformLogos?: Array<{ id: number; name: string; logoUrl?: string | null }>;
  providers?: Array<{ id: number; name: string; logoUrl: string }>;
}

interface UserResult {
  id: string;
  type: "user";
  username: string;
  avatarUrl: string | null;
}

type SearchResult = MediaResult | UserResult;

interface SearchResponse {
  movies: MediaResult[];
  tv: MediaResult[];
  games: MediaResult[];
  users: UserResult[];
  totalResults: number;
  hasMore: {
    movies: boolean;
    tv: boolean;
    games: boolean;
    users: boolean;
  };
}

// Icons
function Film({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 4.5h16.5m-16.5 9h16.5m-16.5 9h16.5M3.75 4.5v15a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25V4.5m-16.5 0V4.5m16.5 0V4.5m0 0V3.75m0 0A2.25 2.25 0 0119.5 1.5h-15A2.25 2.25 0 012.25 3.75m16.5 0z" /></svg>
  );
}
function Gamepad({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.75 6.75h.75m.75 3h.75m-.75 8.25h.75m.75 3h.75m-9.75 0h.75M5.25 3h13.5M5.25 3l-1.5 7.5M9 9l6 6M9 9l-6 6" /></svg>
  );
}
function Users({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3" /></svg>
  );
}
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
  );
}
function Star({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
  );
}

const TABS = [
  { id: "content", label: "Películas & Series", icon: Film, gradient: "from-amber-500 to-orange-600" },
  { id: "games", label: "Videojuegos", icon: Gamepad, gradient: "from-violet-500 to-fuchsia-600" },
  { id: "users", label: "Usuarios", icon: Users, gradient: "from-indigo-500 to-blue-600" },
] as const;

function LoadingSpinner({ colorClass = "border-indigo-500" }: { colorClass?: string }) {
  return (
    <div className="flex justify-center py-8">
      <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${colorClass}`} />
    </div>
  );
}

function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 bg-zinc-900/30 rounded-xl animate-pulse">
      <div className="w-12 h-16 rounded bg-zinc-800" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-zinc-800 rounded w-3/4" />
        <div className="h-3 bg-zinc-800/50 rounded w-1/2" />
      </div>
    </div>
  );
}

function UserCard({ user }: { user: UserResult }) {
  return (
    <Link href={`/profile/${user.username}`} className="flex items-center gap-4 p-4 bg-zinc-900/40 rounded-xl hover:bg-zinc-800/60 transition-all duration-300 group border border-transparent hover:border-zinc-700">
       <div className="relative flex-shrink-0">
         {user.avatarUrl ? (
           <Image
             src={user.avatarUrl}
             alt={user.username}
             width={48}
             height={48}
             className="rounded-full object-cover ring-2 ring-zinc-800 group-hover:ring-indigo-500/50 transition-all"
           />
         ) : (
           <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
             <span className="text-white text-lg font-semibold">{user.username?.charAt(0).toUpperCase() || 'U'}</span>
           </div>
         )}
       </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate group-hover:text-indigo-300 transition-colors">@{user.username}</p>
      </div>
    </Link>
  );
}

function MediaCard({ media, accentColor }: { media: MediaResult; accentColor: string }) {
  return (
    <Link href={`/${media.type}/${media.id}`} className="flex items-center gap-4 p-4 bg-zinc-900/40 rounded-xl hover:bg-zinc-800/60 transition-all duration-300 group border border-transparent hover:border-zinc-700">
      {/* Poster (left) */}
       <div className="relative w-12 h-16 flex-shrink-0 rounded overflow-hidden bg-zinc-800">
         {media.posterUrl ? (
           <Image
             src={media.posterUrl}
             alt={media.title}
             width={48}
             height={64}
             className="object-cover"
             loading="lazy"
           />
         ) : (
           <div className={`w-full h-full bg-gradient-to-br ${accentColor} flex items-center justify-center`}>
             <span className="text-white text-2xl opacity-60">
               {media.type === "movie" ? "🎬" : media.type === "tv" ? "📺" : "🎮"}
             </span>
           </div>
         )}
       </div>
      {/* Info (right) */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {/* Type badge */}
          {(media.type === "movie" || media.type === "tv") && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              media.type === "movie" 
                ? "bg-amber-500/20 text-amber-400" 
                : "bg-emerald-500/20 text-emerald-400"
            }`}>
              {media.type === "movie" ? "Película" : "Serie"}
            </span>
          )}
          <p className={`font-medium truncate transition-colors ${
            accentColor === "from-amber-500 to-orange-600" ? "text-amber-400 group-hover:text-amber-300" :
            accentColor === "from-violet-500 to-fuchsia-600" ? "text-violet-400 group-hover:text-violet-300" :
            "text-indigo-400 group-hover:text-indigo-300"
          }`}>
            {media.title}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
          <span>{media.releaseDate ? new Date(media.releaseDate).getFullYear() : "Desconocido"}</span>
          {media.voteAverage && (
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400 fill-current" />
              {media.voteAverage.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";
  const initialTab = (searchParams.get("tab") as TabType) || "content";

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState({ movies: true, tv: true, games: true, users: true });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const updateURL = useCallback((newQuery: string, newTab: TabType) => {
    const params = new URLSearchParams();
    if (newQuery) params.set("q", newQuery);
    params.set("tab", newTab);
    router.replace(`/search?${params.toString()}`, { scroll: false });
  }, [router]);

  const handleTabChange = (tab: TabType) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
      setResults([]);
      setPage(1);
      setHasMore({ movies: true, tv: true, games: true, users: true });
      updateURL(query, tab);
    }
  };

  const performSearch = async (searchQuery: string, tab: TabType, pageNum: number = 1) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    setIsLoading(pageNum === 1);
    if (pageNum > 1) setIsLoadingMore(true);
    try {
      const typeParam = tab === "content" ? "all" : tab === "games" ? "game" : "user";
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=${typeParam}&page=${pageNum}`, {
        signal: abortControllerRef.current.signal,
      });
      const data: SearchResponse = await response.json();

      const combined: SearchResult[] = [];
      if (tab === "content" && data.movies && data.tv) {
        data.movies.forEach(m => combined.push({ ...m, type: "movie" as const }));
        data.tv.forEach(t => combined.push({ ...t, type: "tv" as const }));
      } else if (tab === "games" && data.games) {
        data.games.forEach(g => combined.push({ ...g, type: "game" as const }));
      } else if (tab === "users" && data.users) {
        data.users.forEach(u => combined.push({ ...u, type: "user" as const }));
      }
      
      // Update hasMore from response
      if (data.hasMore) {
        setHasMore(data.hasMore);
      }
      
      // Append results if loading more, replace if first page
      // Deduplicate by ID to avoid duplicates from API
      if (pageNum === 1) {
        setResults(combined);
      } else {
        setResults(prev => {
          const existingIds = new Set(prev.map(r => r.id));
          const newUniqueResults = combined.filter(r => !existingIds.has(r.id));
          return [...prev, ...newUniqueResults];
        });
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Search error:", err);
        if (pageNum === 1) setResults([]);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Load trending on mount if no query
  useEffect(() => {
    if (!initialQuery && !isLoading) {
      const loadTrending = async () => {
        setIsLoading(true);
        try {
          const typeParam = activeTab === "content" ? "all" : activeTab === "games" ? "game" : "user";
          const response = await fetch(`/api/search?type=${typeParam}`);
          const data: SearchResponse = await response.json();
          const combined: SearchResult[] = [];
          if (activeTab === "content" && data.movies && data.tv) {
            data.movies.forEach(m => combined.push({ ...m, type: "movie" as const }));
            data.tv.forEach(t => combined.push({ ...t, type: "tv" as const }));
          } else if (activeTab === "games" && data.games) {
            data.games.forEach(g => combined.push({ ...g, type: "game" as const }));
          } else if (activeTab === "users" && data.users) {
            data.users.forEach(u => combined.push({ ...u, type: "user" as const }));
          }
          setResults(combined);
        } catch (err) {
          console.error("Trending load error:", err);
        } finally {
          setIsLoading(false);
        }
      };
      loadTrending();
    }
  }, [activeTab]);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  // Reset page when query or tab changes
  useEffect(() => {
    setPage(1);
  }, [query, activeTab]);

   useEffect(() => {
     const timeout = setTimeout(() => {
       performSearch(query, activeTab, 1);
     }, 300);
     return () => {
       clearTimeout(timeout);
       if (abortControllerRef.current) abortControllerRef.current.abort();
     };
   }, [query, activeTab]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoading && !isLoadingMore) {
          // Determine if there's more content for current tab
          const currentHasMore = activeTab === "content" 
            ? hasMore.movies || hasMore.tv 
            : activeTab === "games" 
              ? hasMore.games 
              : hasMore.users;
          
          // Load more if there's more content and we're not already at the limit
          // For search: need query (at least 2 chars) OR we have trending content to load more of
          // For trending: page starts at 1, so we can load page 2 if hasMore is true
          const shouldLoadMore = (currentHasMore && query.trim().length >= 2) || 
                                  (currentHasMore && page === 1 && query.trim() === "");
          
          if (shouldLoadMore) {
            const nextPage = page + 1;
            console.log("[Search] Loading more - current page:", page, "next page:", nextPage, "hasMore:", currentHasMore, "query:", query);
            setPage(nextPage);
            performSearch(query, activeTab, nextPage);
          }
        }
      },
      { rootMargin: "100px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isLoading, isLoadingMore, hasMore, activeTab, query, page]);

  const getAccentColor = () => {
    switch (activeTab) {
      case "content": return "from-amber-500 to-orange-600";
      case "games": return "from-violet-500 to-fuchsia-600";
      case "users": return "from-indigo-500 to-blue-600";
    }
  };

  const TabIcon = TABS.find(t => t.id === activeTab)?.icon || Film;

  return (
    <div className="min-h-screen bg-zinc-950 pt-16">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex flex-nowrap overflow-x-auto hide-scrollbar px-4 sm:overflow-x-visible sm:justify-center sm:px-0 gap-2 mb-6">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex-shrink-0
                  ${isActive
                    ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg`
                    : "bg-zinc-900/60 text-zinc-400 border border-zinc-800 hover:bg-zinc-800"}
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="relative flex items-center bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-xl overflow-hidden transition-all duration-300 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50">
            <div className="pl-4">
              <SearchIcon className="w-5 h-5 text-zinc-500" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="¿Qué estás buscando?"
              className="flex-1 bg-transparent py-3 px-4 text-white placeholder-zinc-500 focus:outline-none text-base"
              autoFocus
            />
            {/* Clear button - show when there's text */}
            {query.trim() !== "" && (
              <button
                onClick={() => setQuery("")}
                className="pr-4 text-zinc-500 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {isLoading && query.trim() !== "" && (
              <div className="pr-4">
                <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${
                  activeTab === "content" ? "border-amber-500" :
                  activeTab === "games" ? "border-violet-500" : "border-indigo-500"
                }`} />
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {query.trim() === "" && results.length === 0 && !isLoading && activeTab === "users" && (
          <div className="text-center py-16 text-zinc-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No hay trending de usuarios</p>
          </div>
        )}

        {query.trim() === "" && results.length === 0 && !isLoading && activeTab !== "users" && (
          <div className="text-center py-16 text-zinc-500">
            <div className="w-12 h-12 mx-auto mb-3 opacity-30">
              {activeTab === "content" ? <Film className="w-12 h-12" /> : <Gamepad className="w-12 h-12" />}
            </div>
            <p>Cargando trending...</p>
          </div>
        )}

        {isLoading && results.length === 0 && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <ListItemSkeleton key={i} />)}
          </div>
        )}

        {!isLoading && results.length > 0 && (
          <div className="space-y-3">
            {results.map(item => {
              const accent = getAccentColor();
              if (item.type === "user") {
                return <UserCard key={item.id} user={item} />;
              } else {
                return <MediaCard key={item.id} media={item} accentColor={accent} />;
              }
            })}
            
            {/* Sentinel for infinite scroll */}
            <div ref={sentinelRef} className="h-4" />
            
            {/* Loading more indicator */}
            {isLoadingMore && (
              <div className="flex justify-center py-4">
                <div className={`w-6 h-6 border-2 border-t-transparent rounded-full animate-spin ${
                  activeTab === "content" ? "border-amber-500" :
                  activeTab === "games" ? "border-violet-500" : "border-indigo-500"
                }`} />
              </div>
            )}
          </div>
        )}

        {!isLoading && results.length === 0 && query.trim() !== "" && (
          <div className="text-center py-16 text-zinc-500">
            <SearchIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No se encontraron resultados para "{query}"</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SearchFallback() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-500">Cargando...</p>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchContent />
    </Suspense>
  );
}
