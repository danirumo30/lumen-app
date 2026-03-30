"use client";

export function DiscoverSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden animate-pulse"
        >
          {}
          <div className="aspect-[2/3] bg-zinc-800" />
          
          {}
          <div className="p-3 space-y-2">
            <div className="h-4 bg-zinc-800 rounded w-3/4" />
            <div className="h-3 bg-zinc-800 rounded w-1/2" />
            <div className="flex gap-1">
              <div className="h-5 bg-zinc-800 rounded w-12" />
              <div className="h-5 bg-zinc-800 rounded w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}




