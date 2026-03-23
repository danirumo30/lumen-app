import type { UserProfileWithStats } from "@/modules/social/domain/user-profile";
import { useDragScroll } from "@/components/home/useDragScroll";

interface ProfileStatsProps {
  stats: UserProfileWithStats;
}

// Formatea minutos en formato dinámico: H/M/S, D/H/M, o A/M/D
const formatTime = (minutes: number): string => {
  const minutesInHour = 60;
  const minutesInDay = 60 * 24; // 1440
  const minutesInMonth = 60 * 24 * 30; // 43200
  const minutesInYear = 60 * 24 * 365; // 525600

  if (minutes >= minutesInYear) {
    // Años / Meses / Días
    const years = Math.floor(minutes / minutesInYear);
    const remainingAfterYears = minutes % minutesInYear;
    const months = Math.floor(remainingAfterYears / minutesInMonth);
    const remainingAfterMonths = remainingAfterYears % minutesInMonth;
    const days = Math.floor(remainingAfterMonths / (60 * 24));
    
    if (months > 0 && days > 0) {
      return `${years}a ${months}mes ${days}d`;
    } else if (months > 0) {
      return `${years}a ${months}mes`;
    } else {
      return `${years}a`;
    }
  } else if (minutes >= minutesInDay) {
    // Días / Horas / Minutos
    const days = Math.floor(minutes / minutesInDay);
    const remainingAfterDays = minutes % minutesInDay;
    const hours = Math.floor(remainingAfterDays / minutesInHour);
    const remainingAfterHours = remainingAfterDays % minutesInHour;
    const mins = Math.floor(remainingAfterHours);

    if (hours > 0 && mins > 0) {
      return `${days}d ${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${days}d ${hours}h`;
    } else {
      return `${days}d`;
    }
  } else {
    // Horas / Minutos
    const hours = Math.floor(minutes / minutesInHour);
    const mins = Math.floor(minutes % minutesInHour);

    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  }
};

// Mapeo estático de colores (Tailwind no soporta bg-${variable})
const colorStyles = {
  indigo: "bg-indigo-500/10",
  cyan: "bg-cyan-500/10",
  rose: "bg-rose-500/10",
  emerald: "bg-emerald-500/10",
  amber: "bg-amber-500/10",
} as const;

export function ProfileStats({ stats }: ProfileStatsProps) {
  const { containerRef, handlers, containerProps } = useDragScroll();

  const statsData = [
    {
      label: "Tiempo Total",
      value: formatTime(stats.totalMinutes),
      icon: (
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      colorKey: "indigo" as const,
    },
    {
      label: "Series",
      value: formatTime(stats.totalTvMinutes),
      icon: (
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      colorKey: "cyan" as const,
    },
    {
      label: "Episodios",
      value: stats.totalEpisodesWatched.toString(),
      icon: (
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      colorKey: "cyan" as const,
    },
    {
      label: "Películas",
      value: formatTime(stats.totalMovieMinutes),
      icon: (
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
      ),
      colorKey: "rose" as const,
    },
    {
      label: "Vistas",
      value: stats.totalMoviesWatched.toString(),
      icon: (
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
      ),
      colorKey: "rose" as const,
    },
    {
      label: "Juegos",
      value: formatTime(stats.totalGameMinutes),
      icon: (
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
      colorKey: "emerald" as const,
    },
    {
      label: "Jugados",
      value: stats.totalGamesPlayed.toString(),
      icon: (
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
      colorKey: "emerald" as const,
    },
    {
      label: "Platinados",
      value: stats.totalGamesPlatinum.toString(),
      icon: (
        <img src="/icons/platforms/platino.png" alt="Platino" className="w-4 h-4 sm:w-5 sm:h-5" />
      ),
      colorKey: "amber" as const,
    },
  ];

  return (
    <div className="mb-6 sm:mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 px-1">
        <h2 className="text-base sm:text-lg font-semibold text-white/90 tracking-tight">Estadísticas</h2>
      </div>

      {/* Stats Horizontal Scroll */}
      <div
        ref={containerRef}
        {...handlers}
        className="flex gap-2 sm:gap-3 px-1 pb-2 stats-scroll-container"
        style={containerProps?.style}
      >
        {statsData.map((stat, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-[180px] bg-zinc-900/50 backdrop-blur-sm rounded-xl p-3 border border-white/[0.03] hover:border-white/[0.06] transition-all"
          >
            <div className="flex items-center gap-2.5">
              {/* Static color class instead of dynamic bg-${color} */}
              <div className={`p-1.5 rounded-lg ${colorStyles[stat.colorKey]}`}>
                {stat.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-zinc-500 uppercase tracking-wider truncate">{stat.label}</p>
                <p className="text-xs sm:text-sm font-semibold text-white/90 truncate">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Hide scrollbar styles */}
      <style jsx global>{`
        .stats-scroll-container::-webkit-scrollbar {
          display: none !important;
        }
        .stats-scroll-container {
          overflow-x: scroll !important;
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
      `}</style>
    </div>
  );
}
