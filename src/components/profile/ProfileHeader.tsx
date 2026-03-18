import type { UserProfileWithStats } from "@/modules/social/domain/user-profile";

interface ProfileHeaderProps {
  profile: UserProfileWithStats;
  isOwnProfile: boolean;
  isFollowing: boolean;
  onFollowToggle: () => void;
  onFollowersClick: () => void;
  onFollowingClick: () => void;
  followersCount: number;
  followingCount: number;
}

export function ProfileHeader({
  profile,
  isOwnProfile,
  isFollowing,
  onFollowToggle,
  onFollowersClick,
  onFollowingClick,
  followersCount,
  followingCount,
}: ProfileHeaderProps) {
  return (
    <div className="relative h-40 sm:h-48 md:h-56 lg:h-64 bg-gradient-to-r from-indigo-600 to-purple-600">
      {/* Banner Image */}
      {profile.bannerUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${profile.bannerUrl})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600" />
      )}

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/20 to-transparent" />

      {/* Profile Info Container - positioned below header */}
      <div className="absolute bottom-0 left-0 right-0 pb-4 sm:pb-6">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-6 w-full">
            {/* Avatar */}
            <div className="relative -mt-10 sm:-mt-12">
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full border-4 border-zinc-900 bg-gradient-to-br from-indigo-500 to-purple-600 bg-cover bg-center shadow-2xl flex items-center justify-center"
                style={{ backgroundImage: profile.avatarUrl ? `url(${profile.avatarUrl})` : undefined }}
              />
              {!profile.avatarUrl && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full">
                  <span className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white drop-shadow-lg">
                    {profile.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 text-white min-w-0 mt-2 sm:mt-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight truncate">
                {profile.username}
              </h1>
              
              {/* Stats Links with hover effect */}
              <div className="flex gap-4 sm:gap-6 mt-1 sm:mt-2">
                <button
                  onClick={onFollowersClick}
                  className="group flex items-center gap-1.5 sm:gap-2 px-2 py-1 rounded-lg hover:bg-white/10 transition-all"
                >
                  <span className="font-bold text-base sm:text-lg group-hover:scale-110 transition-transform">
                    {followersCount}
                  </span>
                  <span className="text-xs sm:text-sm text-zinc-300 group-hover:text-white">seguidores</span>
                </button>
                <button
                  onClick={onFollowingClick}
                  className="group flex items-center gap-1.5 sm:gap-2 px-2 py-1 rounded-lg hover:bg-white/10 transition-all"
                >
                  <span className="font-bold text-base sm:text-lg group-hover:scale-110 transition-transform">
                    {followingCount}
                  </span>
                  <span className="text-xs sm:text-sm text-zinc-300 group-hover:text-white">siguiendo</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0">
              {/* Follow Button */}
              {!isOwnProfile && (
                <button
                  onClick={onFollowToggle}
                  className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-medium text-sm transition-all ${
                    isFollowing
                      ? "bg-zinc-800 text-white hover:bg-zinc-700"
                      : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50"
                  }`}
                >
                  {isFollowing ? "Siguiendo" : "Seguir"}
                </button>
              )}

              {/* Edit Profile Button */}
              {isOwnProfile && (
                <a
                  href="/profile/edit"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-zinc-800/80 text-white rounded-xl font-medium text-sm hover:bg-zinc-700 transition-all backdrop-blur-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className="hidden sm:inline">Editar</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
