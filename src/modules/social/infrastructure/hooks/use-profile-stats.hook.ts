/**
 * useProfileStats - React Query hook for fetching user profile with stats
 * 
 * Provides cached profile data with automatic invalidation support.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { profileKeys } from "@/lib/query-client";
import { SupabaseUserProfileRepository } from "@/modules/social/infrastructure/repositories/supabase-user-profile.repository";
import { getSupabaseClient } from "@/lib/supabase";
import type { UserProfileWithStats } from "@/modules/social/domain/user-profile";

/**
 * Fetch profile with stats for a given user ID
 */
async function fetchProfileWithStats(userId: string): Promise<UserProfileWithStats> {
  const supabase = getSupabaseClient();
  const repository = new SupabaseUserProfileRepository(supabase);
  
  const profile = await repository.getProfileById(userId);
  
  if (!profile) {
    throw new Error("Profile not found");
  }
  
  return profile;
}

/**
 * Hook to fetch profile with stats for a specific user
 * 
 * @param userId - The user ID to fetch profile for
 * @returns Query result with profile data including stats
 * 
 * @example
 * ```tsx
 * const { data: profile, isLoading, error } = useProfileStats(userId);
 * 
 * if (profile) {
 *   console.log("Total time watched:", profile.totalMinutes);
 *   console.log("TV time:", profile.totalTvMinutes);
 * }
 * ```
 */
export function useProfileStats(userId: string | null) {
  return useQuery({
    queryKey: profileKeys.stats(userId ?? ""),
    queryFn: () => fetchProfileWithStats(userId!),
    enabled: userId !== null,
    
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    
    retry: 1,
    
    // Don't refetch on window focus (we invalidate manually)
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch the current user's profile with stats
 * 
 * @returns Query result with current user's profile data
 * 
 * @example
 * ```tsx
 * const { data: profile, isLoading, isLoggedIn } = useCurrentUserProfile();
 * 
 * if (isLoggedIn && profile) {
 *   console.log("Your total time watched:", profile.totalMinutes);
 * }
 * ```
 */
export function useCurrentUserProfile() {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: profileKeys.current(),
    queryFn: async (): Promise<UserProfileWithStats | null> => {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }
      
      const repository = new SupabaseUserProfileRepository(supabase);
      const profile = await repository.getProfileById(user.id);
      
      return profile;
    },
    
    // Keep current user's stats fresh
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    
    retry: 1,
    
    // Don't refetch on window focus
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to invalidate profile stats
 * Call this after episode mutations to refresh stats
 * 
 * @example
 * ```tsx
 * const { invalidateProfileStats } = useProfileInvalidation();
 * 
 * // After marking an episode
 * await markEpisode();
 * invalidateProfileStats(); // This will refetch profile stats
 * ```
 */
export function useProfileInvalidation() {
  const queryClient = useQueryClient();
  
  return {
    /**
     * Invalidate all profile queries
     */
    invalidateAll: () => {
      queryClient.invalidateQueries({
        queryKey: profileKeys.all,
      });
    },
    
    /**
     * Invalidate stats for a specific user
     */
    invalidateUserStats: (userId: string) => {
      queryClient.invalidateQueries({
        queryKey: profileKeys.stats(userId),
      });
    },
    
    /**
     * Invalidate current user's profile
     */
    invalidateCurrentUser: () => {
      queryClient.invalidateQueries({
        queryKey: profileKeys.current(),
      });
    },
    
    /**
     * Invalidate profile stats by userId
     * If no userId provided, invalidates current user
     */
    invalidate: (userId?: string) => {
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: profileKeys.stats(userId),
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: profileKeys.current(),
        });
        queryClient.invalidateQueries({
          queryKey: profileKeys.all,
        });
      }
    },
  };
}

/**
 * Hook for subscribing to profile stats changes
 * 
 * @param onStatsUpdate - Callback when stats are updated
 * @param userId - Optional user ID (defaults to current user)
 * 
 * @example
 * ```tsx
 * function StatsDisplay() {
 *   const [stats, setStats] = useState<TotalStats | null>(null);
 *   
 *   useProfileStatsSubscription((newStats) => {
 *     setStats({
 *       totalMinutes: newStats.totalMinutes,
 *       totalTvMinutes: newStats.totalTvMinutes,
 *     });
 *   });
 *   
 *   // ...
 * }
 * ```
 */
export function useProfileStatsSubscription(
  onStatsUpdate: (stats: UserProfileWithStats) => void,
  userId?: string | null
) {
  const { data: profile } = userId
    ? useProfileStats(userId)
    : useCurrentUserProfile();
  
  if (profile) {
    onStatsUpdate(profile);
  }
  
  return profile;
}

/**
 * Quick hook to get just the total minutes stats
 * 
 * @param userId - The user ID (or null for current user)
 * @returns Object with total minutes breakdown
 */
export function useTotalMinutes(userId?: string | null) {
  const { data: profile, ...rest } = userId
    ? useProfileStats(userId)
    : useCurrentUserProfile();
  
  return {
    totalMinutes: profile?.totalMinutes ?? 0,
    totalTvMinutes: profile?.totalTvMinutes ?? 0,
    totalMovieMinutes: profile?.totalMovieMinutes ?? 0,
    totalGameMinutes: profile?.totalGameMinutes ?? 0,
    ...rest,
  };
}

