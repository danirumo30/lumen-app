"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface DiscoverCardProps {
  id: string;
  type: "movie" | "tv" | "game" | "user";
  title: string;
  posterUrl?: string | null;
  voteAverage?: number | null;
  releaseDate?: string;
  genres?: string[];
  platforms?: string[];
  username?: string;
  avatarUrl?: string | null;
}

const typeColors = {
  movie: "from-amber-500/20 to-transparent border-amber-500/30 hover:border-amber-500/60",
  tv: "from-cyan-500/20 to-transparent border-cyan-500/30 hover:border-cyan-500/60",
  game: "from-violet-500/20 to-transparent border-violet-500/30 hover:border-violet-500/60",
  user: "from-emerald-500/20 to-transparent border-emerald-500/30 hover:border-emerald-500/60",
};

const typeAccent = {
  movie: "text-amber-400",
  tv: "text-cyan-400",
  game: "text-violet-400",
  user: "text-emerald-400",
};

// Platform icon mapping - using PNG icons
const platformIcons: Record<string, string> = {
  "PlayStation": "/icons/platforms/playstation.png",
  "PlayStation 5": "/icons/platforms/playstation.png",
  "PlayStation 4": "/icons/platforms/playstation.png",
  "PlayStation 3": "/icons/platforms/playstation.png",
  "PlayStation 2": "/icons/platforms/playstation.png",
  "Xbox": "/icons/platforms/xbox.png",
  "Xbox Series X": "/icons/platforms/xbox.png",
  "Xbox One": "/icons/platforms/xbox.png",
  "Xbox 360": "/icons/platforms/xbox.png",
  "Nintendo Switch": "/icons/platforms/nintendo-switch.png",
  "Nintendo": "/icons/platforms/nintendo-switch.png",
  "PC": "/icons/platforms/windows.png",
  "Windows": "/icons/platforms/windows.png",
  "Mobile": "/icons/platforms/android.png",
  "iOS": "/icons/platforms/ios.png",
  "Android": "/icons/platforms/android.png",
  "Linux": "/icons/platforms/linux.png",
  "Web": "/icons/platforms/web.png",
};

function getPlatformIcon(platform: string): string {
  return platformIcons[platform] || "/icons/platforms/windows.png";
}

export function DiscoverCard({
  id,
  type,
  title,
  posterUrl,
  voteAverage,
  releaseDate,
  genres,
  platforms,
  username,
  avatarUrl,
}: DiscoverCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const href = type === "user" 
    ? `/profile/${username}` 
    : `/${type}/${id}`;

  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;

  return (
    <Link
      href={href}
      className={`
        group relative block bg-zinc-900/60 backdrop-blur-sm
        border rounded-xl overflow-hidden
        transition-all duration-300 ease-out
        hover:-translate-y-1 hover:shadow-xl
        ${typeColors[type]}
      `}
    >
      {/* Poster / Avatar */}
      <div className="relative aspect-[2/3] overflow-hidden bg-zinc-800">
        {type === "user" ? (
          // User avatar
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={username || "User"}
                fill
                className="object-cover"
                onLoad={() => setIsLoading(false)}
                onError={() => setError(true)}
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-zinc-700 flex items-center justify-center">
                <span className="text-3xl font-bold text-zinc-500">
                  {username?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        ) : (
          // Media poster
          <>
            {isLoading && (
              <div className="absolute inset-0 bg-zinc-800 animate-pulse" />
            )}
            {posterUrl && !error ? (
              <Image
                src={posterUrl}
                alt={title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className={`
                  object-cover transition-all duration-500
                  ${isLoading ? "opacity-0" : "opacity-100 group-hover:scale-105"}
                `}
                onLoad={() => setIsLoading(false)}
                onError={() => setError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl">🎬</span>
              </div>
            )}
          </>
        )}

        {/* Rating Badge */}
        {voteAverage && voteAverage > 0 && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-lg flex items-center gap-1">
            <svg className={`w-3 h-3 ${typeAccent[type]}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className={`text-xs font-bold ${typeAccent[type]}`}>
              {voteAverage.toFixed(1)}
            </span>
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-2 left-2">
          {type === "movie" && (
            <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-amber-500/90 text-black rounded">
              Película
            </span>
          )}
          {type === "tv" && (
            <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-cyan-500/90 text-black rounded">
              Serie
            </span>
          )}
          {type === "game" && (
            <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-violet-500/90 text-white rounded">
              Juego
            </span>
          )}
        </div>

        {/* Platform Icons for Games - inside the image at bottom */}
        {type === "game" && platforms && platforms.length > 0 && (
          <div className="absolute bottom-2 left-2 right-2 flex gap-1">
            {platforms.slice(0, 4).map((platform) => (
              <div 
                key={platform}
                className="w-6 h-6 flex items-center justify-center"
                title={platform}
              >
                <img 
                  src={getPlatformIcon(platform)} 
                  alt={platform}
                  className="w-full h-full object-contain"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className={`font-semibold text-sm truncate group-hover:${type === "game" ? "text-violet-400" : type === "tv" ? "text-cyan-400" : type === "user" ? "text-emerald-400" : "text-amber-400"} transition-colors`}>
          {type === "user" ? username : title}
        </h3>
        
        {/* Show year for movies/TV and games */}
        {type !== "user" && (
          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
            {year && <span>{year}</span>}
          </div>
        )}

        {/* Only show genres for movies/TV */}
        {type !== "user" && type !== "game" && genres && genres.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {genres.slice(0, 2).map((genre) => (
              <span
                key={genre}
                className="px-1.5 py-0.5 text-[10px] bg-zinc-800 text-zinc-400 rounded"
              >
                {genre}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
