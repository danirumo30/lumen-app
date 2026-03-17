import type { UserProfileWithStats } from "@/modules/social/domain/user-profile";

interface ProfileStatsProps {
  stats: UserProfileWithStats;
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  const formatHours = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {/* Total Time */}
      <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tiempo Total</p>
            <p className="text-xl font-semibold">{formatHours(stats.totalMinutes)}</p>
          </div>
        </div>
      </div>

      {/* TV Shows Time */}
      <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Series</p>
            <p className="text-xl font-semibold">{formatHours(stats.totalTvMinutes)}</p>
          </div>
        </div>
      </div>

      {/* Movies Time */}
      <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Películas</p>
            <p className="text-xl font-semibold">{formatHours(stats.totalMovieMinutes)}</p>
          </div>
        </div>
      </div>

      {/* Games Time */}
      <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Videojuegos</p>
            <p className="text-xl font-semibold">{formatHours(stats.totalGameMinutes)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
