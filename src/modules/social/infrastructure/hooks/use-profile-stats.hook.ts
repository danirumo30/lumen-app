

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { profileKeys } from "@/lib/query-client";
import { SupabaseUserProfileRepository } from "@/modules/social/infrastructure/repositories/supabase-user-profile.repository";
import { getSupabaseClient } from "@/lib/supabase";
import type { UserProfileWithStats } from "@/modules/social/domain/user-profile";


async function fetchProfileWithStats(userId: string): Promise<UserProfileWithStats> {
  const supabase = getSupabaseClient();
  const repository = new SupabaseUserProfileRepository(supabase);
  
  const profile = await repository.getProfileById(userId);
  
  if (!profile) {
    throw new Error("Profile not found");
  }
  
  return profile;
}


export function useProfileStats(userId: string | null) {
  return useQuery({
    queryKey: profileKeys.stats(userId ?? ""),
    queryFn: () => fetchProfileWithStats(userId!),
    enabled: !!userId,
    
    staleTime: 30 * 1000, 
    gcTime: 5 * 60 * 1000, 
    
    retry: 1,
    
    
    refetchOnWindowFocus: false,
  });
}


export function useCurrentUserProfile() {
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
    
    
    staleTime: 30 * 1000, 
    gcTime: 5 * 60 * 1000, 
    
    retry: 1,
    
    
    refetchOnWindowFocus: false,
  });
}


export function useProfileInvalidation() {
  const queryClient = useQueryClient();
  
  return {
    
    invalidateAll: () => {
      queryClient.invalidateQueries({
        queryKey: profileKeys.all,
      });
    },
    
    
    invalidateUserStats: (userId: string) => {
      queryClient.invalidateQueries({
        queryKey: profileKeys.stats(userId),
      });
    },
    
    
    invalidateCurrentUser: () => {
      queryClient.invalidateQueries({
        queryKey: profileKeys.current(),
      });
    },
    
    
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


export function useProfileStatsSubscription(
  onStatsUpdate: (stats: UserProfileWithStats) => void,
  userId?: string | null
) {
  
  const { data: profileFromUserId } = useProfileStats(userId ?? "");
  const { data: currentProfile } = useCurrentUserProfile();

  
  const profile = userId ? profileFromUserId : currentProfile;

  if (profile) {
    onStatsUpdate(profile);
  }

  return profile;
}


export function useTotalMinutes(userId?: string | null) {
  
  const { data: profileFromUserId, ...rest1 } = useProfileStats(userId ?? "");
  const { data: currentProfile, ...rest2 } = useCurrentUserProfile();

  
  const profile = userId ? profileFromUserId : currentProfile;

  
  
  const rest = userId ? rest1 : rest2;

  return {
    totalMinutes: profile?.totalMinutes ?? 0,
    totalTvMinutes: profile?.totalTvMinutes ?? 0,
    totalMovieMinutes: profile?.totalMovieMinutes ?? 0,
    totalGameMinutes: profile?.totalGameMinutes ?? 0,
    ...rest,
  };
}

