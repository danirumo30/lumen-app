"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Profile query key factory
 * Used for invalidating profile-related queries after episode mutations
 */
export const profileKeys = {
  all: ["profile"] as const,
  stats: (userId: string) => ["profile", "stats", userId] as const,
  content: (userId: string) => ["profile", "content", userId] as const,
  current: () => ["profile", "current"] as const,
};

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute default
            gcTime: 30 * 60 * 1000, // 30 minutes
            retry: 1,
            refetchOnWindowFocus: false, // We handle invalidation manually
          },
          mutations: {
            retry: 3,
            retryDelay: (attemptIndex: number) =>
              Math.min(1000 * Math.pow(2, attemptIndex), 30000), // 1s, 2s, 4s, max 30s
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export { QueryClient };
