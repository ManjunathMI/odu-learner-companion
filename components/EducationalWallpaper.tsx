'use client';

import { useEffect, useRef } from 'react';

export default function EducationalWallpaper() {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    const finePointer = window.matchMedia('(any-pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const maxShift = Number.parseFloat(
      window.getComputedStyle(document.documentElement).getPropertyValue('--wallpaper-shift'),
    ) || 5;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let frame = 0;

    const animate = () => {
      frame = 0;
      currentX += (targetX - currentX) * 0.14;
      currentY += (targetY - currentY) * 0.14;
      layer.style.setProperty('--wallpaper-x', `${currentX.toFixed(2)}px`);
      layer.style.setProperty('--wallpaper-y', `${currentY.toFixed(2)}px`);

      if (Math.abs(targetX - currentX) > 0.04 || Math.abs(targetY - currentY) > 0.04) {
        frame = window.requestAnimationFrame(animate);
      }
    };

    const queueAnimation = () => {
      if (!frame) frame = window.requestAnimationFrame(animate);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      targetX = ((event.clientX / window.innerWidth) * 2 - 1) * maxShift;
      targetY = ((event.clientY / window.innerHeight) * 2 - 1) * maxShift;
      queueAnimation();
    };

    const resetPosition = () => {
      targetX = 0;
      targetY = 0;
      queueAnimation();
    };

    const syncPointerListeners = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('blur', resetPosition);
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;

      if (finePointer.matches && !reducedMotion.matches) {
        window.addEventListener('pointermove', handlePointerMove, { passive: true });
        window.addEventListener('blur', resetPosition);
      } else {
        targetX = 0;
        targetY = 0;
        currentX = 0;
        currentY = 0;
        layer.style.setProperty('--wallpaper-x', '0px');
        layer.style.setProperty('--wallpaper-y', '0px');
      }
    };

    syncPointerListeners();
    finePointer.addEventListener('change', syncPointerListeners);
    reducedMotion.addEventListener('change', syncPointerListeners);

    return () => {
      finePointer.removeEventListener('change', syncPointerListeners);
      reducedMotion.removeEventListener('change', syncPointerListeners);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('blur', resetPosition);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={layerRef} className="educational-wallpaper" aria-hidden="true" />;
}