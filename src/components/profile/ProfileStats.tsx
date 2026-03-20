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
      <div className="group bg-zinc-900/50 backdrop-blur-sm rounded-xl p-4 border border-zinc-800/50 hover:border-zinc-700/50 transition-all cursor-default">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-xl group-hover:bg-indigo-500/20 transition-colors">
            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Tiempo Total</p>
            <p className="text-xl font-semibold text-white mt-0.5">{formatHours(stats.totalMinutes)}</p>
          </div>
        </div>
      </div>

      {/* TV Shows Time */}
      <div className="group bg-zinc-900/50 backdrop-blur-sm rounded-xl p-4 border border-zinc-800/50 hover:border-zinc-700/50 transition-all cursor-default">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 rounded-xl group-hover:bg-cyan-500/20 transition-colors">
            <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Series</p>
            <p className="text-xl font-semibold text-white mt-0.5">{formatHours(stats.totalTvMinutes)}</p>
          </div>
        </div>
      </div>

      {/* Movies Time */}
      <div className="group bg-zinc-900/50 backdrop-blur-sm rounded-xl p-4 border border-zinc-800/50 hover:border-zinc-700/50 transition-all cursor-default">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 rounded-xl group-hover:bg-rose-500/20 transition-colors">
            <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Películas</p>
            <p className="text-xl font-semibold text-white mt-0.5">{formatHours(stats.totalMovieMinutes)}</p>
          </div>
        </div>
      </div>

      {/* Games Time */}
      <div className="group bg-zinc-900/50 backdrop-blur-sm rounded-xl p-4 border border-zinc-800/50 hover:border-zinc-700/50 transition-all cursor-default">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
            <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Videojuegos</p>
            <p className="text-xl font-semibold text-white mt-0.5">{formatHours(stats.totalGameMinutes)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
