"use client";

import { useRef, useCallback, useEffect, RefObject } from "react";

interface UseDragScrollOptions {
  /** Velocidad del scroll relativo al arrastre (1 = 1:1) */
  speed?: number;
  /** Habilitar snap a elementos hijos */
  snap?: boolean;
  /** Selector CSS para elementos que hacen snap (ej: 'article', '.item') */
  snapSelector?: string;
}

interface UseDragScrollReturn {
  containerRef: RefObject<HTMLDivElement | null>;
  isDragging: boolean;
  handlers: {
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
}

/**
 * Hook para scroll horizontal por arrastre (drag-to-scroll)
 * Sin dependencias externas
 */
export function useDragScroll(options: UseDragScrollOptions = {}): UseDragScrollReturn {
  const { speed = 1, snap = false } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    // Solo iniciar si el click es dentro del contenedor
    isDragging.current = true;
    startX.current = e.clientX;
    startScrollLeft.current = container.scrollLeft;

    container.style.cursor = "grabbing";
    container.style.userSelect = "none";
    container.style.scrollBehavior = "auto";
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const deltaX = startX.current - e.clientX;
    containerRef.current.scrollLeft = startScrollLeft.current + deltaX * speed;
  }, [speed]);

  const handleMouseUp = useCallback(() => {
    if (!containerRef.current) return;

    isDragging.current = false;
    containerRef.current.style.cursor = "";
    containerRef.current.style.userSelect = "";
    
    if (snap) {
      containerRef.current.style.scrollBehavior = "smooth";
      snapToNearest(containerRef.current);
    }
  }, [snap]);

  const handleMouseLeave = useCallback(() => {
    if (isDragging.current) {
      handleMouseUp();
    }
  }, [handleMouseUp]);

  // Touch support para móviles
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const container = containerRef.current;
    if (!container) return;

    isDragging.current = true;
    startX.current = e.touches[0].clientX;
    startScrollLeft.current = container.scrollLeft;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const deltaX = startX.current - e.touches[0].clientX;
    containerRef.current.scrollLeft = startScrollLeft.current + deltaX * speed;
  }, [speed]);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    
    if (snap && containerRef.current) {
      containerRef.current.style.scrollBehavior = "smooth";
      snapToNearest(containerRef.current);
    }
  }, [snap]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (containerRef.current) {
        containerRef.current.style.cursor = "";
        containerRef.current.style.userSelect = "";
        containerRef.current.style.scrollBehavior = "";
      }
    };
  }, []);

  return {
    containerRef,
    isDragging: isDragging.current,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}

/**
 * Snap al elemento más cercano
 */
function snapToNearest(container: HTMLDivElement) {
  const items = Array.from(container.children) as HTMLElement[];
  const containerCenter = container.scrollLeft + container.clientWidth / 2;

  let closestIndex = 0;
  let closestDistance = Infinity;

  items.forEach((item, index) => {
    const itemCenter = item.offsetLeft + item.offsetWidth / 2;
    const distance = Math.abs(containerCenter - itemCenter);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  const target = items[closestIndex];
  if (target) {
    container.scrollTo({
      left: target.offsetLeft - container.clientWidth / 2 + target.offsetWidth / 2,
      behavior: "smooth",
    });
  }
}
