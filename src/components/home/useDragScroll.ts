"use client";

import { useRef, useCallback, useEffect, useState, RefObject } from "react";

interface UseDragScrollOptions {
  
  speed?: number;
  
  snap?: boolean;
  
  snapSelector?: string;
  
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
  
  containerProps?: {
    className?: string;
    style?: React.CSSProperties;
  };
}


export function useDragScroll(options: UseDragScrollOptions = {}): UseDragScrollReturn {
  const { speed = 1, snap = false, forceDragOnMobile = false } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);
  const draggedDistance = useRef(0);
  const DRAG_THRESHOLD = 5;
  
  
  const [isTouchDevice, setIsTouchDevice] = useState(() => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });

  
  useEffect(() => {
    const updateTouchDetection = () => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    
    window.addEventListener("resize", updateTouchDetection);
    return () => window.removeEventListener("resize", updateTouchDetection);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    
    if (isTouchDevice && !forceDragOnMobile) return;

    e.preventDefault();

    isDragging.current = true;
    draggedDistance.current = 0;
    startX.current = e.clientX;
    startScrollLeft.current = container.scrollLeft;

    container.style.cursor = "grabbing";
    container.style.userSelect = "none";
    container.style.scrollBehavior = "auto";
  }, [forceDragOnMobile, isTouchDevice]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const deltaX = e.clientX - startX.current;
    draggedDistance.current = deltaX;

    if (Math.abs(deltaX) > DRAG_THRESHOLD) {
      
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
    if (Math.abs(draggedDistance.current) > DRAG_THRESHOLD) {
      e.preventDefault();
      e.stopPropagation();
      draggedDistance.current = 0;
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    return () => {
      if (container) {
        container.style.cursor = "";
        container.style.userSelect = "";
        container.style.scrollBehavior = "";
      }
    };
  }, []);

  
  const containerProps = {
    className: isTouchDevice && !forceDragOnMobile ? "touch-native-scroll" : "",
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


function snapToNearest(container: HTMLDivElement) {
  const items = Array.from(container.children) as HTMLElement[];
  if (items.length === 0) return;

  const maxScroll = container.scrollWidth - container.clientWidth;
  const currentScroll = container.scrollLeft;
  const containerWidth = container.clientWidth;

  if (currentScroll <= 1 || currentScroll >= maxScroll - 1) {
    return;
  }

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
