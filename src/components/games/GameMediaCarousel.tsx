"use client";

import { useState } from "react";
import { useDragScroll } from "../home/useDragScroll";
import Image from "next/image";

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
  watchUrl: string;
}

interface GameMediaCarouselProps {
  images: GameMedia[];
  videos: GameVideo[];
}

export function GameMediaCarousel({ images, videos }: GameMediaCarouselProps) {
  const { containerRef, handlers } = useDragScroll({ snap: true });
  const [isHovered, setIsHovered] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  if ((!images || images.length === 0) && (!videos || videos.length === 0)) {
    return null;
  }

  return (
    <>
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-white/90 tracking-tight mb-4">Galería</h2>
        
        <div
          ref={containerRef}
          className={`flex gap-3 snap-x snap-mandatory carousel-scroll touch-native-scroll ${isHovered ? 'is-scrolling' : ''}`}
          {...handlers}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            overflowX: "auto",
            overflowY: "hidden",
            scrollBehavior: "smooth",
            WebkitOverflowScrolling: "touch",
            paddingBottom: "16px",
            touchAction: "pan-x",
          }}
        >
          {/* Videos first */}
          {videos?.map((video) => (
            <a
              key={video.id}
              href={video.watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 w-56 snap-start group/video relative"
            >
              {/* Video thumbnail */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-800 border border-white/[0.03] transition-all duration-500 group-hover/video:scale-[1.02] group-hover/video:border-white/[0.08]">
                <img
                  src={video.thumbnailUrl}
                  alt={video.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover/video:bg-black/40 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                    <svg className="w-5 h-5 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
                {/* Video type badge */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-red-600/80 backdrop-blur-sm">
                  <span className="text-[10px] font-semibold text-white">VIDEO</span>
                </div>
              </div>
              {/* Video name */}
              <h3 className="text-xs font-medium text-white/90 mt-2 line-clamp-2 leading-tight">
                {video.name}
              </h3>
            </a>
          ))}

          {/* Screenshots and artworks */}
          {images?.map((image, index) => (
            <button
              key={image.id || index}
              onClick={() => setLightboxImage(image.url)}
              className="flex-shrink-0 w-56 snap-start group/image relative"
            >
              {/* Image */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-800 border border-white/[0.03] transition-all duration-500 group-hover/image:scale-[1.02] group-hover/image:border-white/[0.08]">
                <img
                  src={image.url}
                  alt={image.type === "screenshot" ? `Screenshot ${index + 1}` : `Artwork ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Type badge */}
                <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-md backdrop-blur-sm ${
                  image.type === "screenshot" ? "bg-blue-600/80" : "bg-purple-600/80"
                }`}>
                  <span className="text-[10px] font-semibold text-white uppercase">
                    {image.type === "screenshot" ? "Screenshot" : "Artwork"}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-zinc-300"
            onClick={() => setLightboxImage(null)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={lightboxImage}
            alt="Full size"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
