import type { Media } from "@/modules/shared/domain/media";

interface MediaGridProps {
  mediaList: Media[];
}

export function MediaGrid({ mediaList }: MediaGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
  // Placeholder image based on media type
  const getPlaceholderImage = () => {
    switch (media.type) {
      case "movie":
        return "https://via.placeholder.com/300x450/374151/9CA3AF?text=Película";
      case "tv":
        return "https://via.placeholder.com/300x450/1e3a5f/60a5fa?text=Serie";
      case "game":
        return "https://via.placeholder.com/300x450/1a472a/4ade80?text=Juego";
      default:
        return "https://via.placeholder.com/300x450/374151/9CA3AF?text=Media";
    }
  };

  return (
    <div className="group relative aspect-[2/3] overflow-hidden rounded-lg bg-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
      {/* Image */}
      <img
        src={getPlaceholderImage()}
        alt={media.title}
        className="w-full h-full object-cover"
        loading="lazy"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Info */}
      <div className="absolute bottom-0 left-0 right-0 p-3 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform">
        <h3 className="font-medium text-sm line-clamp-2">{media.title}</h3>
        {media.releaseYear && (
          <p className="text-xs text-gray-300 mt-1">{media.releaseYear}</p>
        )}
      </div>
    </div>
  );
}
