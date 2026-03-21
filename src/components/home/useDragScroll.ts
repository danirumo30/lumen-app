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
  isDragging?: React.RefObject<boolean>;
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
  const hasDragged = useRef(false);
  const lastDragTime = useRef(0);
  const DRAG_THRESHOLD = 5; // pixels para distinguir drag de click
  const CLICK_CANCEL_THRESHOLD = 200; // ms para cancelar clicks después de drag

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    // Prevenir que el navegador interprete esto como drag de imagen/enlace
    e.preventDefault();

    isDragging.current = true;
    hasDragged.current = false;
    startX.current = e.clientX;
    startScrollLeft.current = container.scrollLeft;

    container.style.cursor = "grabbing";
    container.style.userSelect = "none";
    container.style.scrollBehavior = "auto";
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const deltaX = e.clientX - startX.current;

    // Solo marcar como drag si superó el threshold
    if (Math.abs(deltaX) > DRAG_THRESHOLD) {
      hasDragged.current = true;
      lastDragTime.current = Date.now();
    }

    // Solo hacer scroll si realmente estamos arrastrando
    if (hasDragged.current) {
      containerRef.current.scrollLeft = startScrollLeft.current - deltaX * speed;
    }
  }, [speed]);

  const handleMouseUp = useCallback(() => {
    if (!containerRef.current) return;

    isDragging.current = false;
    hasDragged.current = false;
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
    hasDragged.current = false;
    startX.current = e.touches[0].clientX;
    startScrollLeft.current = container.scrollLeft;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    // Prevenir scroll nativo del navegador para evitar delay/conflicto
    e.preventDefault();

    const deltaX = e.touches[0].clientX - startX.current;

    // Solo marcar como drag si superó el threshold
    if (Math.abs(deltaX) > DRAG_THRESHOLD) {
      hasDragged.current = true;
    }

    // Solo hacer scroll si realmente estamos arrastrando
    if (hasDragged.current) {
      containerRef.current.scrollLeft = startScrollLeft.current - deltaX * speed;
    }
  }, [speed]);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    hasDragged.current = false;
    
    if (snap && containerRef.current) {
      containerRef.current.style.scrollBehavior = "smooth";
      snapToNearest(containerRef.current);
    }
  }, [snap]);

  // Cancelar clicks fantasma a nivel de documento después de drag
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const timeSinceDrag = Date.now() - lastDragTime.current;
      if (timeSinceDrag < CLICK_CANCEL_THRESHOLD) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener("click", handleGlobalClick, true);
    return () => {
      document.removeEventListener("click", handleGlobalClick, true);
    };
  }, []);

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
    isDragging,
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
