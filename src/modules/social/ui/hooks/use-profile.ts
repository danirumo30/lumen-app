"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SupabaseClient } from "@supabase/supabase-js";

import { SupabaseUserProfileRepository } from "@/modules/social/infrastructure/repositories/supabase-user-profile.repository";
import type {
  UpdateProfileData,
  UserProfileWithContent,
  UserProfileWithStats,
} from "@/modules/social/domain/user-profile";
import { getSupabaseClient } from "@/lib/supabase";

/**
 * Hook para obtener el perfil de un usuario por su nombre de usuario
 */
export function useProfileQuery(username: string) {
  return useQuery<UserProfileWithStats | null, Error>({
    queryKey: ["profile", username],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const repository = new SupabaseUserProfileRepository(supabase);
      return repository.getProfileByUsername(username);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook para obtener el contenido de un perfil
 */
export function useProfileContentQuery(
  userId: string,
  includeFavorites: boolean = true,
  includeWatched: boolean = true,
) {
  return useQuery<UserProfileWithContent, Error>({
    queryKey: ["profile-content", userId, includeFavorites, includeWatched],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const repository = new SupabaseUserProfileRepository(supabase);
      return repository.getProfileContent({
        userId,
        includeFavorites,
        includeWatched,
        mediaTypes: ["movie", "tv", "game"],
      });
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!userId,
  });
}

/**
 * Hook para actualizar el perfil de usuario
 */
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    { userId: string; data: UpdateProfileData }
  >({
    mutationFn: async ({ userId, data }) => {
      const supabase = getSupabaseClient();
      const repository = new SupabaseUserProfileRepository(supabase);
      await repository.updateProfile(userId, data);
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch queries
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["profile-content"] });
    },
  });
}
