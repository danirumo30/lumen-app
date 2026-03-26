"use client";

import { ReactNode } from "react";
import { useDragScroll } from "../home/useDragScroll";

interface BaseCarouselProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function BaseCarousel({ title, children, className = "" }: BaseCarouselProps) {
  const { containerRef, handlers } = useDragScroll({ snap: true });
  const [isHovered, setIsHovered] = BaseCarousel.useState(false);

  return (
    <section className={`mb-10 ${className}`}>
      {title && (
        <h2 className="text-lg font-semibold text-white/90 tracking-tight mb-4 px-1">
          {title}
        </h2>
      )}
      
      <div
        ref={containerRef}
        className={`flex gap-3 snap-x snap-mandatory carousel-scroll touch-native-scroll ${
          isHovered ? "is-scrolling" : ""
        }`}
        {...handlers}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          overflowX: "auto",
          overflowY: "hidden",
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
          paddingBottom: "16px",
          paddingLeft: "4px",
          paddingRight: "4px",
        }}
        onClickCapture={handlers.onClick}
      >
        {children}
      </div>
    </section>
  );
}

// Attach useState for convenience
BaseCarousel.useState = (initial: boolean) => {
  const { useState } = require("react");
  return useState(initial);
};
