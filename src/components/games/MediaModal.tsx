"use client";

import { useEffect } from "react";
import Image from "next/image";

interface MediaModalProps {
  type: "image" | "video";
  src: string;
  alt?: string;
  onClose: () => void;
}

export function MediaModal({ type, src, alt, onClose }: MediaModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {}
      <button
        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10"
        onClick={onClose}
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

       {}
       {type === "image" ? (
         <div
           className="relative max-w-full max-h-[90vh] animate-in zoom-in-95 duration-300"
           onClick={(e) => e.stopPropagation()}
         >
           <Image
             src={src}
             alt={alt || "Media"}
             fill
             className="object-contain rounded-lg"
             sizes="90vw"
             priority
           />
         </div>
       ) : (
        <div
          className="w-full max-w-5xl aspect-video rounded-lg overflow-hidden animate-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <iframe
            src={src}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
}





