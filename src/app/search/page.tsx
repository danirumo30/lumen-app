"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SupabaseUserProfileRepository } from "@/modules/social/infrastructure/repositories/supabase-user-profile.repository";
import { getSupabaseClient } from "@/lib/supabase";
import type { UserProfile } from "@/modules/social/domain/user-profile";

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const supabase = getSupabaseClient();
      const repository = new SupabaseUserProfileRepository(supabase);
      
      const users = await repository.searchUsers(searchQuery);
      setResults(users);
    } catch (err) {
      console.error("Error searching users:", err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  return (
    <div className="min-h-screen bg-zinc-950 py-24">
      <div className="max-w-3xl mx-auto px-4">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white mb-4">Buscar usuarios</h1>
          
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre de usuario..."
              className="w-full px-5 py-3 pl-12 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500"
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
          </form>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          </div>
        ) : hasSearched && results.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <p>No se encontraron usuarios</p>
          </div>
        ) : (
          <div className="space-y-2">
            {results.map((user) => (
              <Link
                key={user.id}
                href={`/profile/${user.username}`}
                className="flex items-center gap-4 p-4 bg-zinc-900/50 rounded-xl hover:bg-zinc-800/50 transition-colors group"
              >
                <div className="relative">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white text-lg font-semibold">
                        {user.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium group-hover:text-indigo-300 transition-colors">
                    {user.username}
                  </p>
                  {user.firstName || user.lastName ? (
                    <p className="text-zinc-500 text-sm">
                      {user.firstName} {user.lastName}
                    </p>
                  ) : null}
                </div>
                <svg
                  className="w-5 h-5 text-zinc-500 group-hover:text-indigo-400 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
