import type { Media } from "@/modules/shared/domain/media";

interface MediaCardProps {
  media: Media;
}

export function MediaCard({ media }: MediaCardProps) {
  const getPlaceholderImage = () => {
    switch (media.type) {
      case "movie":
        return "https://via.placeholder.com/200x300/374151/9CA3AF?text=Película";
      case "tv":
        return "https://via.placeholder.com/200x300/1e3a5f/60a5fa?text=Serie";
      case "game":
        return "https://via.placeholder.com/200x300/1a472a/4ade80?text=Juego";
      default:
        return "https://via.placeholder.com/200x300/374151/9CA3AF?text=Media";
    }
  };

  return (
    <div className="flex-shrink-0 w-36 sm:w-40 group cursor-pointer">
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-gray-200 shadow-sm hover:shadow-lg transition-all">
        <img
          src={getPlaceholderImage()}
          alt={media.title}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Watched badge */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-6 h-6 rounded-full bg-green-500/90 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Title */}
      <div className="mt-2">
        <h3 className="text-sm font-medium text-white line-clamp-2 group-hover:text-indigo-300 transition-colors">
          {media.title}
        </h3>
        {media.releaseYear && (
          <p className="text-xs text-zinc-500 mt-0.5">{media.releaseYear}</p>
        )}
      </div>
    </div>
  );
}
