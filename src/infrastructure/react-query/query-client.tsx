"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

interface QueryProviderProps {
  children: ReactNode;
}


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
            staleTime: 60 * 1000, 
            gcTime: 30 * 60 * 1000, 
            retry: 1,
            refetchOnWindowFocus: false, 
          },
          mutations: {
            retry: 3,
            retryDelay: (attemptIndex: number) =>
              Math.min(1000 * Math.pow(2, attemptIndex), 30000), 
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export { QueryClient };




