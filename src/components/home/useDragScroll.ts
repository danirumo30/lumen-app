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
    onMouseUp: () => void;
    onMouseLeave: () => void;
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
  const hasDragged = useRef(false);
  const lastDragTime = useRef(0);
  const DRAG_THRESHOLD = 5;
  const CLICK_CANCEL_THRESHOLD = 200;

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
    hasDragged.current = false;
    startX.current = e.clientX;
    startScrollLeft.current = container.scrollLeft;

    container.style.cursor = "grabbing";
    container.style.userSelect = "none";
    container.style.scrollBehavior = "auto";
  }, [forceDragOnMobile]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const deltaX = e.clientX - startX.current;

    if (Math.abs(deltaX) > DRAG_THRESHOLD) {
      hasDragged.current = true;
      lastDragTime.current = Date.now();
    }

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

  // Cancelar clicks fantasma después de drag en desktop
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

  // Props para aplicar al contenedor
  const containerProps = {
    className: isTouchDevice.current && !forceDragOnMobile ? "touch-native-scroll" : "",
    style: {
      overflowX: "auto",
      overflowY: "hidden",
      WebkitOverflowScrolling: "touch", // Momentum scrolling en iOS
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
    },
    containerProps,
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
