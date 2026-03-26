"use client";

import Image from "next/image";
import { BaseCarousel } from "../games/BaseCarousel";
import Link from "next/link";

interface MediaItem {
  id: string;
  title: string;
  posterUrl: string | null;
  releaseYear: number | null;
  rating: number | null;
  overview?: string;
}

interface SimilarMediaCarouselProps {
  items: MediaItem[];
  type?: "movie" | "tv";
}

export function SimilarMediaCarousel({ items, type = "movie" }: SimilarMediaCarouselProps) {
  if (!items || items.length === 0) {
    return null;
  }

  const basePath = type === "movie" ? "/movie" : "/tv";
  const title = type === "movie" ? "Películas similares" : "Series similares";

  return (
    <BaseCarousel title={title}>
      {items.map((item) => {
        // Strip prefix if present (e.g., "tmdb_116135" → "116135")
        const cleanId = item.id.replace(/^(tmdb_|movie_|tv_|igdb_)/, "");
        return (
          <Link
            key={item.id}
            href={`${basePath}/${cleanId}`}
            className="flex-shrink-0 w-36 snap-start group/similar block"
          >
             {/* Poster */}
             <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 border border-white/[0.03] transition-all duration-300 group-hover/similar:scale-[1.03] group-hover/similar:border-white/[0.08]">
               {item.posterUrl ? (
                 <Image
                   src={item.posterUrl}
                   alt={item.title}
                   fill
                   className="object-cover"
                   loading="lazy"
                   sizes="(max-width: 768px) 40vw, (max-width: 1024px) 25vw, 15vw"
                 />
               ) : (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-zinc-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}

              {/* Rating badge */}
              {item.rating && item.rating > 0 && (
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm flex items-center gap-1">
                  <svg
                    className="w-3 h-3 text-amber-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-[10px] font-medium text-white">{item.rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Title */}
            <h3 className="text-sm text-white/90 mt-2 line-clamp-2 leading-tight">
              {item.title}
            </h3>
            {item.releaseYear && (
              <p className="text-xs text-zinc-500">{item.releaseYear}</p>
            )}
          </Link>
        );
      })}
    </BaseCarousel>
  );
}
