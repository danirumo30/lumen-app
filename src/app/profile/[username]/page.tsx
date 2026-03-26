"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, notFound } from "next/navigation";

import { SupabaseUserProfileRepository } from "@/modules/social/infrastructure/repositories/supabase-user-profile.repository";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { MediaTabs } from "@/components/profile/MediaTabs";
import { FollowersModal } from "@/components/profile/FollowersModal";
import { getSupabaseClient } from "@/lib/supabase";
import {
  useProfileStats,
  useProfileInvalidation,
} from "@/modules/social/infrastructure/hooks/use-profile-stats.hook";
import type { Follower, UserProfileWithContent, UserProfileWithStats } from "@/modules/social/domain/user-profile";

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"followers" | "following">("followers");
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [following, setFollowing] = useState<Follower[]>([]);
  const [content, setContent] = useState<UserProfileWithContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  
  
  const { data: profileStats } = useProfileStats(profileUserId);
  
  
  const { invalidate } = useProfileInvalidation();

  
  const profile: UserProfileWithStats | null = profileStats ?? null;

  const loadProfile = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();
      const repository = new SupabaseUserProfileRepository(supabase);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setCurrentUserId(user.id);
      }
      
      const profileData = await repository.getProfileByUsername(username);
      
      if (!profileData) {
        notFound();
        return;
      }

      setProfileUserId(profileData.id);

      let isFollowingUser = false;
      if (user && user.id !== profileData.id) {
        isFollowingUser = await repository.isFollowing(user.id, profileData.id);
        setIsFollowing(isFollowingUser);
      }

      const contentData = await repository.getProfileContent({
        userId: profileData.id,
        includeFavorites: true,
        includeWatched: true,
        mediaTypes: ["movie", "tv", "game"],
      });

      const [followersCount, followingCount] = await Promise.all([
        repository.getFollowersCount(profileData.id),
        repository.getFollowingCount(profileData.id),
      ]);

      setContent({
        ...contentData,
        followersCount,
        followingCount,
        isFollowing: isFollowingUser,
        isFollower: user ? await repository.isFollowing(profileData.id, user.id) : false,
      });

      
      const [followersList, followingList] = await Promise.all([
        repository.getFollowers(profileData.id),
        repository.getFollowing(profileData.id),
      ]);
      
      setFollowers(followersList);
      setFollowing(followingList);
    } catch (err) {
      console.error("Error loading profile:", err);
      notFound();
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  
  useEffect(() => {
    const handleSyncSuccess = async () => {
      invalidate();
      
      
      await loadProfile();
    };

    const handleSyncError = () => {
      
      invalidate();
    };

    window.addEventListener("episode-sync-success", handleSyncSuccess);
    window.addEventListener("episode-sync-error", handleSyncError);
    
    return () => {
      window.removeEventListener("episode-sync-success", handleSyncSuccess);
      window.removeEventListener("episode-sync-error", handleSyncError);
    };
  }, [invalidate, loadProfile]);

  const handleFollowToggle = async () => {
    try {
      const supabase = getSupabaseClient();
      const repository = new SupabaseUserProfileRepository(supabase);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !profile) return;

      if (isFollowing) {
        await repository.unfollowUser(user.id, profile.id);
        setIsFollowing(false);
        
        if (content) {
          setContent({
            ...content,
            followersCount: content.followersCount - 1,
            isFollowing: false,
          });
        }
        
        setFollowers(prev => prev.filter(f => f.id !== user.id));
      } else {
        await repository.followUser(user.id, profile.id);
        setIsFollowing(true);
        
        if (content) {
          setContent({
            ...content,
            followersCount: content.followersCount + 1,
            isFollowing: true,
          });
        }
        
        const currentUser = await repository.getProfileById(user.id);
        if (currentUser) {
          setFollowers(prev => [...prev, currentUser]);
        }
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
    }
  };

  const handleFollowersClick = (type: "followers" | "following") => {
    setModalType(type);
    setIsFollowersModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!profile || !content) {
    notFound();
    return null;
  }

  const isOwnProfile = currentUserId === profile.id;

  return (
    <div className="min-h-screen bg-zinc-950 pt-16">
      {}
      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        onFollowToggle={handleFollowToggle}
        onFollowersClick={() => handleFollowersClick("followers")}
        onFollowingClick={() => handleFollowersClick("following")}
        followersCount={content.followersCount}
        followingCount={content.followingCount}
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {}
        <ProfileStats stats={profile} />

        {}
        <MediaTabs content={content} />
      </div>

      {}
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

