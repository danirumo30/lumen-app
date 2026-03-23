"use client";

import { useRef, useCallback, useEffect, RefObject } from "react";

interface UseDragScrollOptions {
  /** Velocidad del scroll relativo al arrastre (1 = 1:1) - solo desktop */
  speed?: number;
  /** Habilitar snap a elementos hijos */
  snap?: boolean;
  /** Selector CSS para elementos que hacen snap */
  snapSelector?: string;
  /** Forzar uso de drag custom incluso en mobile (default: false = usar scroll nativo) */
  forceDragOnMobile?: boolean;
}

interface UseDragScrollReturn {
  containerRef: RefObject<HTMLDivElement | null>;
  isDragging?: React.RefObject<boolean>;
  handlers: {
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: (e: React.MouseEvent) => void;
    onMouseLeave: () => void;
    onClick: (e: React.MouseEvent) => void;
  };
  /** CSS classes para aplicar al contenedor */
  containerProps?: {
    className?: string;
    style?: React.CSSProperties;
  };
}

/**
 * Hook para scroll horizontal con soporte nativo en mobile
 * 
 * Estrategia:
 * - Mobile/Touch: Usa scroll NATIVO del navegador (óptimo, con momentum)
 * - Desktop/Mouse: Usa drag custom para mejor control
 */
export function useDragScroll(options: UseDragScrollOptions = {}): UseDragScrollReturn {
  const { speed = 1, snap = false, forceDragOnMobile = false } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);
  const draggedDistance = useRef(0);
  const DRAG_THRESHOLD = 5;

  // Detectar si es dispositivo táctil
  const isTouchDevice = useRef(
    typeof window !== "undefined" && 
    ("ontouchstart" in window || navigator.maxTouchPoints > 0)
  );

  // Actualizar detección de touch en resize (para hybrid devices)
  useEffect(() => {
    const updateTouchDetection = () => {
      isTouchDevice.current = 
        "ontouchstart" in window || 
        navigator.maxTouchPoints > 0;
    };
    
    window.addEventListener("resize", updateTouchDetection);
    return () => window.removeEventListener("resize", updateTouchDetection);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    // Solo usar drag custom en desktop
    if (isTouchDevice.current && !forceDragOnMobile) return;

    e.preventDefault();

    isDragging.current = true;
    draggedDistance.current = 0;
    startX.current = e.clientX;
    startScrollLeft.current = container.scrollLeft;

    container.style.cursor = "grabbing";
    container.style.userSelect = "none";
    container.style.scrollBehavior = "auto";
  }, [forceDragOnMobile]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const deltaX = e.clientX - startX.current;
    draggedDistance.current = deltaX;

    if (Math.abs(deltaX) > DRAG_THRESHOLD) {
      // Clamp to prevent over-scrolling
      const newScrollLeft = startScrollLeft.current - deltaX * speed;
      const maxScroll = containerRef.current.scrollWidth - containerRef.current.clientWidth;
      containerRef.current.scrollLeft = Math.max(0, Math.min(newScrollLeft, maxScroll));
    }
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
      isDragging.current = false;
      if (containerRef.current) {
        containerRef.current.style.cursor = "";
        containerRef.current.style.userSelect = "";
      }
    }
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    // Si arrastraste más del threshold, cancelá el click
    if (Math.abs(draggedDistance.current) > DRAG_THRESHOLD) {
      e.preventDefault();
      e.stopPropagation();
      draggedDistance.current = 0;
    }
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

  // Props para aplicar al contenedor
  const containerProps = {
    className: isTouchDevice.current && !forceDragOnMobile ? "touch-native-scroll" : "",
    style: {
      overflowX: "auto",
      overflowY: "hidden",
      WebkitOverflowScrolling: "touch",
    } as React.CSSProperties,
  };

  return {
    containerRef,
    isDragging,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
      onClick: handleClick,
    },
    containerProps,
  };
}

/**
 * Snap al elemento más cercano - versión mejorada
 */
function snapToNearest(container: HTMLDivElement) {
  const items = Array.from(container.children) as HTMLElement[];
  if (items.length === 0) return;

  const maxScroll = container.scrollWidth - container.clientWidth;
  const currentScroll = container.scrollLeft;
  const containerWidth = container.clientWidth;

  // Si ya estás pegado a un borde, dejalo ahí
  if (currentScroll <= 1 || currentScroll >= maxScroll - 1) {
    return;
  }

  // Si estás cerca del borde, déjalo ahí
  const EDGE_THRESHOLD = 50;
  if (currentScroll < EDGE_THRESHOLD || currentScroll > maxScroll - EDGE_THRESHOLD) {
    container.scrollTo({
      left: currentScroll < maxScroll / 2 ? 0 : maxScroll,
      behavior: "smooth",
    });
    return;
  }

  let closestIndex = 0;
  let closestDistance = Infinity;

  items.forEach((item, index) => {
    const itemLeft = item.offsetLeft;
    const itemWidth = item.offsetWidth;
    const snapPoint = itemLeft - (containerWidth - itemWidth) / 2;
    const distance = Math.abs(currentScroll - snapPoint);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  const target = items[closestIndex];
  if (target) {
    const itemWidth = target.offsetWidth;
    const targetScrollLeft = target.offsetLeft - (containerWidth - itemWidth) / 2;
    const clampedScrollLeft = Math.max(0, Math.min(targetScrollLeft, maxScroll));
    
    container.scrollTo({
      left: clampedScrollLeft,
      behavior: "smooth",
    });
  }
}
