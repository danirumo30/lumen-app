import type { UserProfileWithStats } from "@/modules/social/domain/user-profile";

interface ProfileHeaderProps {
  profile: UserProfileWithStats;
  isFollowing: boolean;
  onFollowToggle: () => void;
  onFollowersClick: () => void;
  onFollowingClick: () => void;
  followersCount: number;
  followingCount: number;
}

export function ProfileHeader({
  profile,
  isFollowing,
  onFollowToggle,
  onFollowersClick,
  onFollowingClick,
  followersCount,
  followingCount,
}: ProfileHeaderProps) {
  return (
    <div className="relative h-64 bg-gradient-to-r from-indigo-600 to-purple-600">
      {/* Banner Image */}
      {profile.bannerUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${profile.bannerUrl})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600" />
      )}

      {/* Overlay gradient for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/20 to-transparent" />

      {/* Profile Info Container */}
      <div className="relative h-full max-w-6xl mx-auto px-4 flex items-end pb-6">
        <div className="flex items-end gap-6 w-full">
          {/* Avatar */}
          <div className="relative group">
            <div
              className="w-28 h-28 rounded-full border-4 border-white/20 bg-zinc-800 bg-cover bg-center shadow-2xl"
              style={{ backgroundImage: profile.avatarUrl ? `url(${profile.avatarUrl})` : undefined }}
            />
            {!profile.avatarUrl && (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-zinc-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 text-white pb-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {profile.username}
            </h1>
            
            {/* Stats Links */}
            <div className="flex gap-6 mt-3">
              <button
                onClick={onFollowersClick}
                className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors group"
              >
                <span className="font-medium text-white group-hover:text-indigo-300">
                  {followersCount}
                </span>
                <span className="text-sm">seguidores</span>
              </button>
              <button
                onClick={onFollowingClick}
                className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors group"
              >
                <span className="font-medium text-white group-hover:text-indigo-300">
                  {followingCount}
                </span>
                <span className="text-sm">siguiendo</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pb-2">
            {/* Follow Button */}
            <button
              onClick={onFollowToggle}
              className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                isFollowing
                  ? "bg-zinc-800 text-white hover:bg-zinc-700"
                  : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/30"
              }`}
            >
              {isFollowing ? "Siguiendo" : "Seguir"}
            </button>

            {/* Edit Profile Button */}
            <a
              href="/profile/edit"
              className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800/80 text-white rounded-xl font-medium hover:bg-zinc-700 transition-all backdrop-blur-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Editar
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
