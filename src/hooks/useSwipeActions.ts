import { useState, useRef, useCallback } from "react";

interface SwipeActionsOptions {
  threshold?: number;
  maxSwipe?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export function useSwipeActions({
  threshold = 80,
  maxSwipe = 100,
  onSwipeLeft,
  onSwipeRight,
}: SwipeActionsOptions = {}) {
  const [swipeX, setSwipeX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  const triggerHaptic = useCallback((intensity: "light" | "medium" | "heavy" = "light") => {
    if ("vibrate" in navigator) {
      const durations = { light: 10, medium: 25, heavy: 50 };
      navigator.vibrate(durations[intensity]);
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = null;
    setIsSwiping(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isSwiping) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - startX.current;
    const diffY = currentY - startY.current;

    // Determine direction on first significant move
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
        isHorizontalSwipe.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    // Only handle horizontal swipes
    if (!isHorizontalSwipe.current) {
      return;
    }

    // Prevent vertical scroll while swiping horizontally
    e.preventDefault();

    // Clamp swipe distance
    const clampedX = Math.max(-maxSwipe, Math.min(maxSwipe, diffX));
    setSwipeX(clampedX);

    // Haptic feedback at threshold
    if (Math.abs(clampedX) >= threshold && Math.abs(swipeX) < threshold) {
      triggerHaptic("light");
    }
  }, [isSwiping, maxSwipe, threshold, swipeX, triggerHaptic]);

  const handleTouchEnd = useCallback(() => {
    if (Math.abs(swipeX) >= threshold) {
      triggerHaptic("medium");
      if (swipeX < 0 && onSwipeLeft) {
        onSwipeLeft();
      } else if (swipeX > 0 && onSwipeRight) {
        onSwipeRight();
      }
    }
    setSwipeX(0);
    setIsSwiping(false);
    isHorizontalSwipe.current = null;
  }, [swipeX, threshold, onSwipeLeft, onSwipeRight, triggerHaptic]);

  const resetSwipe = useCallback(() => {
    setSwipeX(0);
    setIsSwiping(false);
  }, []);

  return {
    swipeX,
    isSwiping,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    resetSwipe,
    isSwipedLeft: swipeX < -threshold,
    isSwipedRight: swipeX > threshold,
  };
}
