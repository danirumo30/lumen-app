"use client";

import { useRef, useCallback, RefObject, useEffect } from "react";

interface UseSimpleDragScrollReturn {
  containerRef: RefObject<HTMLDivElement | null>;
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
 * Hook simple para drag-scroll horizontal
 * Sin scrollbar visible, sin flechas
 */
export function useSimpleDragScroll(): UseSimpleDragScrollReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);
  const hasDragged = useRef(false);
  const lastDragTime = useRef(0);
  const DRAG_THRESHOLD = 5;
  const CLICK_CANCEL_THRESHOLD = 200;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

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

    if (Math.abs(deltaX) > DRAG_THRESHOLD) {
      hasDragged.current = true;
      lastDragTime.current = Date.now();
    }

    if (hasDragged.current) {
      containerRef.current.scrollLeft = startScrollLeft.current - deltaX;
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!containerRef.current) return;

    isDragging.current = false;
    hasDragged.current = false;
    containerRef.current.style.cursor = "";
    containerRef.current.style.userSelect = "";
    containerRef.current.style.scrollBehavior = "smooth";
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (isDragging.current) {
      handleMouseUp();
    }
  }, [handleMouseUp]);

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

    e.preventDefault();

    const deltaX = e.touches[0].clientX - startX.current;

    if (Math.abs(deltaX) > DRAG_THRESHOLD) {
      hasDragged.current = true;
    }

    if (hasDragged.current) {
      containerRef.current.scrollLeft = startScrollLeft.current - deltaX;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    hasDragged.current = false;
  }, []);

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

  return {
    containerRef,
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

