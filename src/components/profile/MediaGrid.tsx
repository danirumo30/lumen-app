import Image from "next/image";
import type { Media } from "@/modules/shared/domain/media";

interface MediaGridProps {
  mediaList: Media[];
}

export function MediaGrid({ mediaList }: MediaGridProps) {
  if (!mediaList || mediaList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
        <svg className="w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
        <p className="text-sm">No hay contenido para mostrar</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
      {mediaList.map((media) => (
        <MediaCard key={media.id} media={media} />
      ))}
    </div>
  );
}

interface MediaCardProps {
  media: Media;
}

function MediaCard({ media }: MediaCardProps) {
  const hasPoster = !!media.posterUrl;

  return (
    <div className="group relative aspect-[2/3] overflow-hidden rounded-md sm:rounded-lg bg-gray-200 shadow-sm hover:shadow-lg transition-all cursor-pointer">
      {hasPoster ? (
        <Image
          src={media.posterUrl!}
          alt={media.title}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          loading="lazy"
          sizes="(max-width: 640px) 25vw, (max-width: 1024px) 16vw, 12vw"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
        </div>
      )}

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Info */}
      <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 text-white">
        <h3 className="font-medium text-xs sm:text-sm line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-1 group-hover:translate-y-0">
          {media.title}
        </h3>
        {media.releaseYear && (
          <p className="text-xs text-gray-300 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {media.releaseYear}
          </p>
        )}
      </div>
    </div>
  );
}
