import { notFound } from "next/navigation";
import { SupabaseClient } from "@supabase/supabase-js";

import { SupabaseUserProfileRepository } from "@/modules/social/infrastructure/repositories/supabase-user-profile.repository";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { MediaTabs } from "@/components/profile/MediaTabs";
import { getSupabaseClient } from "@/lib/supabase";

interface PageProps {
  params: {
    username: string;
  };
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params;

  // Get Supabase client
  const supabase = getSupabaseClient();
  const repository = new SupabaseUserProfileRepository(supabase);

  // Fetch profile data
  const profile = await repository.getProfileByUsername(username);

  if (!profile) {
    notFound();
  }

  // Fetch profile content (favorites and watched)
  const content = await repository.getProfileContent({
    userId: profile.id,
    includeFavorites: true,
    includeWatched: true,
    mediaTypes: ["movie", "tv", "game"],
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Profile Header with Banner */}
      <ProfileHeader profile={profile} />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Stats */}
        <ProfileStats stats={profile} />

        {/* Media Tabs with Content */}
        <MediaTabs content={content} />
      </div>
    </div>
  );
}
