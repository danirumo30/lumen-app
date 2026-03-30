"use client";

import { useState } from "react";
import Image from "next/image";
import { BaseCarousel } from "./BaseCarousel";
import { MediaModal } from "./MediaModal";

interface GameMedia {
  id?: number;
  url: string;
  type: "screenshot" | "artwork";
  width: number;
  height: number;
}

interface GameVideo {
  id: string;
  name: string;
  thumbnailUrl: string;
  videoUrl: string;
}

interface LightboxContent {
  type: "image" | "video";
  src: string;
  alt?: string;
}

interface GameMediaCarouselProps {
  images: GameMedia[];
  videos: GameVideo[];
}

export function GameMediaCarousel({ images, videos }: GameMediaCarouselProps) {
  const [lightbox, setLightbox] = useState<LightboxContent | null>(null);

  const hasImages = images && images.length > 0;
  const hasVideos = videos && videos.length > 0;

  if (!hasImages && !hasVideos) {
    return null;
  }

  return (
    <>
      <BaseCarousel title="Galería" className="mt-4">
        {}
        {hasVideos &&
          videos.map((video) => (
            <button
              key={video.id}
              onClick={() => setLightbox({ type: "video", src: video.videoUrl })}
              className="flex-shrink-0 w-56 snap-start group/video relative"
            >
               <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-800 border border-white/[0.03] transition-all duration-500 group-hover/video:scale-[1.02] group-hover/video:border-white/[0.08]">
                 <Image
                   src={video.thumbnailUrl}
                   alt={video.name}
                   width={320}
                   height={180}
                   className="object-cover"
                   loading="lazy"
                 />
                 {}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover/video:bg-black/40 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                    <svg className="w-5 h-5 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                {}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-red-600/80 backdrop-blur-sm">
                  <span className="text-[10px] font-semibold text-white">VIDEO</span>
                </div>
              </div>
            </button>
          ))}

        {}
        {hasImages &&
          images.map((image, index) => (
            <button
              key={image.id || index}
              onClick={() => setLightbox({ type: "image", src: image.url })}
              className="flex-shrink-0 w-56 snap-start group/image relative"
            >
               <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-800 border border-white/[0.03] transition-all duration-500 group-hover/image:scale-[1.02] group-hover/image:border-white/[0.08]">
                 <Image
                   src={image.url}
                   alt={image.type === "screenshot" ? `Screenshot ${index + 1}` : `Artwork ${index + 1}`}
                   width={320}
                   height={180}
                   className="object-cover"
                   loading="lazy"
                 />
                 {}
                <div
                  className={`absolute top-2 left-2 px-2 py-0.5 rounded-md backdrop-blur-sm ${
                    image.type === "screenshot" ? "bg-blue-600/80" : "bg-purple-600/80"
                  }`}
                >
                  <span className="text-[10px] font-semibold text-white uppercase">
                    {image.type === "screenshot" ? "Screenshot" : "Artwork"}
                  </span>
                </div>
              </div>
            </button>
          ))}
      </BaseCarousel>

      {}
      {lightbox && (
        <MediaModal
          type={lightbox.type}
          src={lightbox.src}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}




