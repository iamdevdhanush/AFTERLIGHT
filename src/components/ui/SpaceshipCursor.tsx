import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useExperienceStore } from '../../store/useExperienceStore';

// Hotspot calibrated precisely to the spaceship's nose tip:
// In the 438x363 cropped asset, tip is at (432, 4)
// X fraction = 432 / 437 = 0.98856 (98.86% from left)
// Y fraction = 4 / 362 = 0.01105 (1.11% from top)
const TIP_FRAC_X = 0.98856;
const TIP_FRAC_Y = 0.01105;

// Base display dimensions (compact desktop cursor)
const CURSOR_WIDTH = 34;
const CURSOR_HEIGHT = 28;

// Calibrated pixel offsets from container top-left to tip
const TIP_OFFSET_X = CURSOR_WIDTH * TIP_FRAC_X; // ~33.61px
const TIP_OFFSET_Y = CURSOR_HEIGHT * TIP_FRAC_Y; // ~0.31px

/**
 * SpaceshipCursor
 *
 * Implements AFTERLIGHT's custom spaceship pointer across all screens.
 * - Hardware-accelerated smooth 60/120fps tracking via direct style updates
 * - Hotspot mathematically calibrated to the spaceship's nose tip
 * - pointer-events: none ensures zero interference with Three.js or DOM clicks
 * - Automatically hides over text inputs to preserve native I-beam cursor
 * - Contextual hover scaling and engine thrust flare over interactive elements
 * - Completely suppressed on touch devices (pointer: coarse)
 * - Respects prefers-reduced-motion / experience store settings
 */
export const SpaceshipCursor: React.FC = () => {
  const reducedMotion = useExperienceStore((s) => s.reducedMotion);
  const cursorRef = useRef<HTMLDivElement>(null);
  const flameRef = useRef<HTMLDivElement>(null);

  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);
  const [isTextInput, setIsTextInput] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Position coordinates maintained via refs to avoid React re-renders during high-frequency mouse movements
  const posRef = useRef({ x: -100, y: -100 });
  const isTextInputRef = useRef(false);
  const isInteractiveRef = useRef(false);
  const movingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // 1. Detect touch-only devices
    if (typeof window !== 'undefined') {
      const touchCheck = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
      setIsTouchDevice(touchCheck);
      if (touchCheck) return;
    }

    const handlePointerMove = (e: PointerEvent | MouseEvent) => {
      posRef.current.x = e.clientX;
      posRef.current.y = e.clientY;

      if (!isVisible) {
        setIsVisible(true);
      }

      // Update cursor position directly via transform translate3d for zero-lag tracking
      if (cursorRef.current) {
        const left = e.clientX - TIP_OFFSET_X;
        const top = e.clientY - TIP_OFFSET_Y;
        cursorRef.current.style.transform = `translate3d(${left}px, ${top}px, 0)`;
      }

      // Detect engine thrust activity on movement
      if (flameRef.current && !reducedMotion) {
        flameRef.current.style.opacity = '1';
        flameRef.current.style.transform = 'scale(1.25)';
        if (movingTimerRef.current) {
          window.clearTimeout(movingTimerRef.current);
        }
        movingTimerRef.current = window.setTimeout(() => {
          if (flameRef.current) {
            flameRef.current.style.opacity = '0.65';
            flameRef.current.style.transform = 'scale(1)';
          }
        }, 120);
      }

      // Check element under pointer for interactive / text states
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Text input detection (native I-beam cursor must be preserved)
      const isText = !!target.closest(
        'input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea, select, [contenteditable="true"]'
      );
      if (isText !== isTextInputRef.current) {
        isTextInputRef.current = isText;
        setIsTextInput(isText);
      }

      // Interactive clickable elements (buttons, links, tab items, clickable cards, 3D canvases)
      const isClickable = !isText && !!(
        target.closest(
          'button, a, [role="button"], [role="tab"], [role="switch"], [role="menuitem"], [data-interactive="true"], [data-clickable="true"], .cursor-pointer, .cursor-grab, .cursor-grabbing, summary, [tabindex]:not([tabindex="-1"]), [onclick], input[type="button"], input[type="submit"], input[type="checkbox"], input[type="radio"], input[type="range"]'
        ) ||
        (target.closest('canvas') && !!useExperienceStore.getState().hoveredArtifactId)
      );
      if (isClickable !== isInteractiveRef.current) {
        isInteractiveRef.current = isClickable;
        setIsInteractive(isClickable);
      }
    };

    const handleMouseDown = () => setIsMouseDown(true);
    const handleMouseUp = () => setIsMouseDown(false);

    const handleMouseLeave = () => {
      setIsVisible(false);
      setIsMouseDown(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      if (movingTimerRef.current) {
        window.clearTimeout(movingTimerRef.current);
      }
    };
  }, [isVisible, reducedMotion]);

  if (isTouchDevice) {
    return null;
  }

  // Dynamic transforms based on interaction state:
  // Using transform-origin at the spaceship's nose tip ensures scale changes anchor perfectly on the click position
  const scale = isMouseDown ? 0.92 : isInteractive ? 1.15 : 1.0;
  const opacity = !isVisible || isTextInput ? 0 : 1;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden select-none"
    >
      <div
        ref={cursorRef}
        style={{
          width: `${CURSOR_WIDTH}px`,
          height: `${CURSOR_HEIGHT}px`,
          opacity,
          transition: isTextInput ? 'opacity 60ms ease-out' : 'opacity 120ms ease-out',
          willChange: 'transform, opacity',
        }}
        className="absolute top-0 left-0"
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: `${TIP_FRAC_X * 100}% ${TIP_FRAC_Y * 100}%`,
            transition: reducedMotion ? 'none' : 'transform 140ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className="relative w-full h-full"
        >
          {/* Subtle Engine Thruster Glow & Trail */}
          <div
            ref={flameRef}
            style={{
              // Located behind the bottom-left thruster nozzle (~24% X, ~69% Y)
              left: '4px',
              top: '16px',
              width: '18px',
              height: '18px',
              background: isInteractive
                ? 'radial-gradient(circle, rgba(251, 191, 36, 0.85) 0%, rgba(249, 115, 22, 0.45) 45%, transparent 75%)'
                : 'radial-gradient(circle, rgba(249, 115, 22, 0.75) 0%, rgba(220, 38, 38, 0.35) 50%, transparent 80%)',
              transition: reducedMotion ? 'none' : 'opacity 150ms ease-out, transform 150ms ease-out',
              opacity: 0.65,
            }}
            className="absolute rounded-full pointer-events-none filter blur-[1.5px]"
          />

          {/* Interactive Aura Flare on Clickable Elements */}
          {isInteractive && !reducedMotion && (
            <div
              style={{
                left: '-2px',
                top: '-2px',
                width: `${CURSOR_WIDTH + 4}px`,
                height: `${CURSOR_HEIGHT + 4}px`,
                background: 'radial-gradient(circle at 75% 25%, rgba(251, 191, 36, 0.3) 0%, rgba(249, 115, 22, 0.15) 50%, transparent 80%)',
              }}
              className="absolute rounded-full pointer-events-none filter blur-[3px] animate-pulse"
            />
          )}

          {/* Calibrated Spaceship Image */}
          <img
            src="/cursors/spaceship-cursor.png"
            alt=""
            draggable={false}
            className="w-full h-full object-contain pointer-events-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)]"
          />
        </div>
      </div>
    </div>
  );
};
