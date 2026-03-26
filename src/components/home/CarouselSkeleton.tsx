"use client";

interface CarouselSkeletonProps {
  variant?: "movies" | "tv" | "games";
}

export function CarouselSkeleton({ variant = "movies" }: CarouselSkeletonProps) {
  const accentColor = {
    movies: "bg-amber-500/10",
    tv: "bg-cyan-500/10",
    games: "bg-emerald-500/10",
  }[variant];

  return (
    <div className="mb-12 animate-pulse">
      {}
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className={`w-48 h-8 rounded-lg ${accentColor}`} />
          <div className={`w-32 h-4 rounded mt-2 bg-zinc-800/50`} />
        </div>
        <div className="flex gap-2">
          <div className="w-10 h-10 rounded-lg bg-zinc-800/50" />
          <div className="w-10 h-10 rounded-lg bg-zinc-800/50" />
        </div>
      </div>

      {}
      <div className="flex gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-44 rounded-xl overflow-hidden"
          >
            <div className="aspect-[2/3] bg-zinc-800/50 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function HomepageSkeleton() {
  return (
    <div className="pt-20 pb-8">
      {}
      <div className="h-64 rounded-2xl bg-zinc-800/30 mb-12" />

      {}
      <div className="max-w-7xl mx-auto px-6">
        <CarouselSkeleton variant="movies" />
        <CarouselSkeleton variant="tv" />
        <CarouselSkeleton variant="games" />
      </div>
    </div>
  );
}
