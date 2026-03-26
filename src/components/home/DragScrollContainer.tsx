"use client";

import { useDragScroll } from "./useDragScroll";
import "./DragScrollContainer.css";

interface DragScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  snap?: boolean;
}


export function DragScrollContainer({
  children,
  className = "",
  speed,
  snap,
}: DragScrollContainerProps) {
  const { containerRef, handlers } = useDragScroll({ speed, snap });

  return (
    <div
      ref={containerRef}
      className={`drag-scroll-container ${className}`}
      {...handlers}
    >
      {children}
    </div>
  );
}
