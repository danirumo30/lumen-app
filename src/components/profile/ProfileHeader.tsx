import type { UserProfileWithStats } from "@/modules/social/domain/user-profile";

interface ProfileHeaderProps {
  profile: UserProfileWithStats;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  return (
    <div className="relative h-64 bg-gradient-to-r from-purple-500 to-pink-500">
      {/* Banner Image */}
      {profile.bannerUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${profile.bannerUrl})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500" />
      )}

      {/* Overlay gradient for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Profile Info Container */}
      <div className="relative h-full max-w-6xl mx-auto px-4 flex items-end pb-6">
        <div className="flex items-end gap-6">
          {/* Avatar */}
          <div className="relative">
            <div
              className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 bg-cover bg-center shadow-lg"
              style={{ backgroundImage: profile.avatarUrl ? `url(${profile.avatarUrl})` : undefined }}
            />
            {!profile.avatarUrl && (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="w-16 h-16 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="text-white pb-2">
            <h1 className="text-3xl font-bold">{profile.username}</h1>
            <div className="flex gap-4 mt-2 text-sm opacity-90">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span>0 Seguidores</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span>0 Seguidos</span>
              </div>
            </div>
          </div>

          {/* Edit Button (will be shown only for owner) */}
          <div className="ml-auto pb-2">
            <a
              href="/profile/edit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Editar perfil
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
