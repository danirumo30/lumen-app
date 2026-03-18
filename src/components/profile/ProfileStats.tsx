import { useRef } from "react";
import type { UserProfileWithStats } from "@/modules/social/domain/user-profile";

interface ProfileStatsProps {
  stats: UserProfileWithStats;
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const formatHours = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200; // Card width + gap
      scrollRef.current.scrollBy({
        left: direction === "right" ? scrollAmount : -scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const statsData = [
    {
      label: "Tiempo Total",
      value: formatHours(stats.totalMinutes),
      icon: (
        <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "indigo",
    },
    {
      label: "Series",
      value: formatHours(stats.totalTvMinutes),
      icon: (
        <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      color: "cyan",
    },
    {
      label: "Películas",
      value: formatHours(stats.totalMovieMinutes),
      icon: (
        <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
      ),
      color: "rose",
    },
    {
      label: "Videojuegos",
      value: formatHours(stats.totalGameMinutes),
      icon: (
        <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
      color: "emerald",
    },
  ];

  return (
    <div className="mb-8">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Estadísticas</h2>
        <div className="flex gap-1">
          <button
            onClick={() => scroll("left")}
            className="p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-white transition-colors"
            aria-label="Scroll left"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 hover:text-white transition-colors"
            aria-label="Scroll right"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {statsData.map((stat, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-44 bg-zinc-900/50 backdrop-blur-sm rounded-xl p-4 border border-zinc-800/50 hover:border-zinc-700/50 transition-all cursor-default"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-${stat.color}-500/10 rounded-lg`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-xl font-semibold text-white mt-0.5">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
