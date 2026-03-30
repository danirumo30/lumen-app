"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Media } from '@/domain/shared/value-objects/media-id';

interface MediaCardProps {
  media: Media;
}

interface CardContentProps {
  media: Media;
  imageUrl: string | null;
  placeholderGradient: string;
  icon: React.ReactNode;
  onImageError: () => void;
}

function CardContent({ media, imageUrl, placeholderGradient, icon, onImageError }: CardContentProps) {
  return (
    <div className="relative group/card">
      {}
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900/50 border border-white/[0.03] transition-all duration-500 ease-out group-hover/card:scale-[1.02] group-hover/card:border-white/[0.08]">
        
        {}
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none z-10">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/[0.03] via-transparent to-white/[0.02]" />
          <div className="absolute inset-[-1px] rounded-xl bg-gradient-to-br from-white/[0.05] via-transparent to-transparent" />
        </div>
        
        {}
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={media.title}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover/card:scale-105"
            loading="lazy"
            onError={onImageError}
            sizes="(max-width: 768px) 40vw, (max-width: 1024px) 20vw, 10vw"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${placeholderGradient}`}>
            {icon}
          </div>
        )}
        
        {}
        {media.rating && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/40 backdrop-blur-xl border border-white/10">
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              <span className="text-[10px] font-semibold text-white/90 tabular-nums">
                {media.rating.toFixed(1)}
              </span>
            </div>
          </div>
        )}
        
        {}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover/card:opacity-100 transition-all duration-400 flex flex-col justify-end p-3 z-20">
          <h3 className="text-xs font-medium text-white/95 tracking-tight line-clamp-2 leading-tight mb-2">
            {media.title}
          </h3>
          {media.releaseYear && (
            <span className="text-[10px] text-white/50 tracking-tight mb-2">
              {media.releaseYear}
            </span>
          )}
          <button className="w-full py-1.5 rounded-lg bg-white/[0.08] backdrop-blur-xl text-[10px] font-medium text-white/90 border border-white/10 hover:bg-white/[0.15] transition-all duration-200">
            {}
            Ver más
          </button>
        </div>
      </div>
    </div>
  );
}

export function MediaCard({ media }: MediaCardProps) {
  const [imageError, setImageError] = useState(false);
  
  const getHref = () => {
    switch (media.type) {
      case "movie":
        return `/movie/${media.id.value}`;
      case "tv":
        return `/tv/${media.id.value}`;
      case "game":
        return `/game/${media.id.value}`;
      default:
        return null;
    }
  };
  const href = getHref();
  
  const posterUrl = media.posterUrl;
  
  const getPlaceholderGradient = () => {
    switch (media.type) {
      case "movie":
        return "bg-gradient-to-br from-zinc-800/50 to-zinc-900/50";
      case "tv":
        return "bg-gradient-to-br from-sky-900/50 to-zinc-900/50";
      case "game":
        return "bg-gradient-to-br from-emerald-900/50 to-zinc-900/50";
      default:
        return "bg-gradient-to-br from-zinc-800/50 to-zinc-900/50";
    }
  };

  const getIcon = () => {
    switch (media.type) {
      case "movie":
        return (
          <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
        );
      case "tv":
        return (
          <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case "game":
        return (
          <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const imageUrl = posterUrl && !imageError 
    ? posterUrl 
    : null;
  
  const placeholderGradient = getPlaceholderGradient();
  const iconNode = getIcon();

  if (href) {
    return (
      <Link href={href} className="flex-shrink-0 w-40 snap-start block">
        <CardContent 
          media={media} 
          imageUrl={imageUrl} 
          placeholderGradient={placeholderGradient}
          icon={iconNode}
          onImageError={() => setImageError(true)}
        />
      </Link>
    );
  }

  return (
    <div className="flex-shrink-0 w-40 snap-start">
      <CardContent 
        media={media} 
        imageUrl={imageUrl} 
        placeholderGradient={placeholderGradient}
        icon={iconNode}
        onImageError={() => setImageError(true)}
      />
    </div>
  );
}




