"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { SupabaseUserProfileRepository } from "@/infrastructure/persistence/supabase/social/supabase-user-profile.repository";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { MediaTabs } from "@/components/profile/MediaTabs";
import { FollowersModal } from "@/components/profile/FollowersModal";
import { getSupabaseClient } from "@/infrastructure/supabase/client";
import type { Follower, UserProfileWithContent } from '@/domain/social/entities/user-profile.entity';
import { UserProfile } from '@/domain/social/entities/user-profile.entity';

function buildProfileWithUpdatedStats(
  base: UserProfileWithContent,
  followersCount: number,
  followingCount: number,
  isFollowing: boolean,
  isFollower: boolean
): UserProfileWithContent {
  const newProfile = new UserProfile(
    base.id,
    base.username,
    base.firstName,
    base.lastName,
    base.avatarUrl,
    base.bannerUrl,
    base.stats,
    followersCount,
    followingCount,
    isFollowing,
    isFollower
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (newProfile as any).favoriteMovies = base.favoriteMovies;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (newProfile as any).watchedMovies = base.watchedMovies;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (newProfile as any).favoriteTvShows = base.favoriteTvShows;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (newProfile as any).watchedTvShows = base.watchedTvShows;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (newProfile as any).favoriteGames = base.favoriteGames;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (newProfile as any).watchedGames = base.watchedGames;
  return newProfile as UserProfileWithContent;
}

async function fetchProfileContent(username: string): Promise<{ profile: UserProfileWithContent; currentUserId: string | null }> {
  console.log("[fetchProfileContent] Iniciando búsqueda para username:", username);
  console.log("[fetchProfileContent] Tipo de username:", typeof username, "¿Es array?", Array.isArray(username));

  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  console.log("[fetchProfileContent] Usuario autenticado:", user?.id ?? "ninguno");
  const repository = new SupabaseUserProfileRepository(supabase);

  try {
    const profileData = await repository.getProfileByUsername(username);
    console.log("[fetchProfileContent] Resultado de getProfileByUsername:", profileData ? "encontrado" : "null");
    if (!profileData) {
      throw new Error(`Profile not found for username: ${username}`);
    }

    const contentData = await repository.getProfileContent({
      userId: profileData.id,
      includeFavorites: true,
      includeWatched: true,
      mediaTypes: ["movie", "tv", "game"],
    });
    console.log("[fetchProfileContent] Contenido obtenido para userId:", profileData.id);

    const [followersCount, followingCount, isFollowingUser, isFollower] = await Promise.all([
      repository.getFollowersCount(profileData.id),
      repository.getFollowingCount(profileData.id),
      user && user.id !== profileData.id ? repository.isFollowing(user.id, profileData.id) : Promise.resolve(false),
      user ? repository.isFollowing(profileData.id, user.id) : Promise.resolve(false),
    ]);

    const fullProfile = buildProfileWithUpdatedStats(
      contentData,
      followersCount,
      followingCount,
      isFollowingUser,
      isFollower
    );

    return { profile: fullProfile, currentUserId: user?.id ?? null };
  } catch (error) {
    console.error("[fetchProfileContent] Error completo:", error);
    if (error instanceof Error && error.message.includes("Profile not found")) {
      throw error;
    }
    throw new Error(`Failed to fetch profile for username '${username}': ${error instanceof Error ? error.message : String(error)}`);
  }
}



export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => fetchProfileContent(username),
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });

  const profile = data?.profile ?? null;
  const currentUserId = data?.currentUserId ?? null;

  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"followers" | "following">("followers");
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [following, setFollowing] = useState<Follower[]>([]);

  useEffect(() => {
    const handleSyncSuccess = async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile', username] });
    };
    const handleSyncError = async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile', username] });
    };
    window.addEventListener("episode-sync-success", handleSyncSuccess);
    window.addEventListener("episode-sync-error", handleSyncError);
    return () => {
      window.removeEventListener("episode-sync-success", handleSyncSuccess);
      window.removeEventListener("episode-sync-error", handleSyncError);
    };
  }, [queryClient, username]);

  const handleFollowToggle = async () => {
    if (!profile || !currentUserId) return;
    try {
      const supabase = getSupabaseClient();
      const repository = new SupabaseUserProfileRepository(supabase);

      const currentlyFollowing = profile.isFollowing;

      // Perform mutation first
      if (currentlyFollowing) {
        await repository.unfollowUser(currentUserId, profile.id);
        setFollowers(prev => prev.filter(f => f.id !== currentUserId));
      } else {
        await repository.followUser(currentUserId, profile.id);
        const currentUser = await repository.getProfileById(currentUserId);
        if (currentUser) {
          setFollowers(prev => [...prev, currentUser]);
        }
      }

      // Optimistically update cache
      const newIsFollowing = !currentlyFollowing;
      const followersCountDelta = newIsFollowing ? 1 : -1;

      queryClient.setQueryData<UserProfileWithContent>(['profile', username], (old) => {
        if (!old) return old;
        return buildProfileWithUpdatedStats(
          old,
          old.followersCount + followersCountDelta,
          old.followingCount,
          newIsFollowing,
          old.isFollower
        );
      });

      // Invalidate to sync with server
      await queryClient.invalidateQueries({ queryKey: ['profile', username] });
    } catch (err) {
      console.error("Error toggling follow:", err);
      // Revert to server state on error
      await queryClient.invalidateQueries({ queryKey: ['profile', username] });
    }
  };

  const handleFollowersClick = (type: "followers" | "following") => {
    setModalType(type);
    setIsFollowersModalOpen(true);
  };

  useEffect(() => {
    if (!isFollowersModalOpen || !profile) return;
    if (modalType === "followers" && followers.length === 0) {
      const fetchFollowers = async () => {
        const supabase = getSupabaseClient();
        const repository = new SupabaseUserProfileRepository(supabase);
        const list = await repository.getFollowers(profile.id);
        setFollowers(list);
      };
      fetchFollowers();
    } else if (modalType === "following" && following.length === 0) {
      const fetchFollowing = async () => {
        const supabase = getSupabaseClient();
        const repository = new SupabaseUserProfileRepository(supabase);
        const list = await repository.getFollowing(profile.id);
        setFollowing(list);
      };
      fetchFollowing();
    }
  }, [isFollowersModalOpen, modalType, followers.length, following.length, profile]);

  const isOwnProfile = currentUserId === profile?.id;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-white">Perfil no encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-16">
      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        isFollowing={profile.isFollowing}
        onFollowToggle={handleFollowToggle}
        onFollowersClick={() => handleFollowersClick("followers")}
        onFollowingClick={() => handleFollowersClick("following")}
        followersCount={profile.followersCount}
        followingCount={profile.followingCount}
      />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ProfileStats stats={profile} />
        <MediaTabs content={profile} />
      </div>
      <FollowersModal
        isOpen={isFollowersModalOpen}
        onClose={() => setIsFollowersModalOpen(false)}
        followers={followers}
        following={following}
        type={modalType}
      />
    </div>
  );
}
