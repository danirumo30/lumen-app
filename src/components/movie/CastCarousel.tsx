"use client";

import Image from "next/image";
import { BaseCarousel } from "../games/BaseCarousel";

interface CastMember {
  id: number;
  name: string;
  character: string;
  profileUrl: string | null;
  order: number;
}

interface CastCarouselProps {
  cast: CastMember[];
}

export function CastCarousel({ cast }: CastCarouselProps) {
  if (!cast || cast.length === 0) {
    return null;
  }

  return (
    <BaseCarousel title="Reparto" className="mt-4">
      {cast.map((person) => (
        <div
          key={person.id}
          className="flex-shrink-0 w-28 group/cast"
        >
           {/* Profile image */}
           <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-800 border border-white/[0.03] mb-2 transition-transform duration-500 group-hover/cast:scale-105">
             {person.profileUrl ? (
               <Image
                 src={person.profileUrl}
                 alt={person.name}
                 fill
                 className="object-cover"
                 loading="lazy"
                 sizes="(max-width: 640px) 28vw, (max-width: 1024px) 14vw, 10vw"
               />
             ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-800">
                <svg
                  className="w-8 h-8 text-zinc-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Name and character */}
          <h3 className="text-xs font-medium text-white/90 truncate">{person.name}</h3>
          <p className="text-[10px] text-zinc-500 truncate">{person.character}</p>
        </div>
      ))}
    </BaseCarousel>
  );
}
