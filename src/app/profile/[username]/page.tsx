"use client";

import { useState, useEffect } from "react";
import { useParams, notFound } from "next/navigation";

import { SupabaseUserProfileRepository } from "@/modules/social/infrastructure/repositories/supabase-user-profile.repository";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { MediaTabs } from "@/components/profile/MediaTabs";
import { FollowersModal } from "@/components/profile/FollowersModal";
import { getSupabaseClient } from "@/lib/supabase";
import type { Follower, UserProfileWithContent } from "@/modules/social/domain/user-profile";

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"followers" | "following">("followers");
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [following, setFollowing] = useState<Follower[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [content, setContent] = useState<UserProfileWithContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch profile data
  useEffect(() => {
    const loadProfile = async () => {
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
        }

        setProfile(profileData);

        // Check if current user is following this profile
        if (user && user.id !== profileData.id) {
          // TODO: Check following status from database
          setIsFollowing(false);
        }

        // Load content
        const contentData = await repository.getProfileContent({
          userId: profileData.id,
          includeFavorites: true,
          includeWatched: true,
          mediaTypes: ["movie", "tv", "game"],
        });

        setContent({
          ...contentData,
          followersCount: 0, // Empty - user will populate manually
          followingCount: 0, // Empty - user will populate manually
          isFollowing: false,
          isFollower: false,
        });

        // Empty lists - no mock data
        setFollowers([]);
        setFollowing([]);
      } catch (err) {
        console.error("Error loading profile:", err);
        notFound();
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [username]);

  const handleFollowToggle = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !profile) return;

      // TODO: Implement follow/unfollow logic
      setIsFollowing(!isFollowing);
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
  }

  // Check if viewing own profile
  const isOwnProfile = currentUserId === profile.id;

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Profile Header with Banner */}
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
        {/* Profile Stats */}
        <ProfileStats stats={profile} />

        {/* Media Tabs with Content */}
        <MediaTabs content={content} />
      </div>

      {/* Followers Modal */}
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
