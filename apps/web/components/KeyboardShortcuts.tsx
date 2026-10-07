'use client';

import { useEffect, useRef } from 'react';
import { usePlayer } from '@/lib/player';

export function KeyboardShortcuts() {
  const {
    current,
    toggle,
    next,
    previous,
    toggleMute,
    seek,
    currentTime,
    closeFullScreen,
  } = usePlayer();

  const lastLeft = useRef(0);
  const lastRight = useRef(0);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Ignora se estiver digitando em input/textarea
      const target = e.target as HTMLElement;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) return;
      if (!current) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          toggle();
          break;
        case 'ArrowRight': {
          const now = Date.now();
          if (now - lastRight.current < 400) {
            next();
            lastRight.current = 0;
          } else {
            seek(currentTime + 5);
            lastRight.current = now;
          }
          break;
        }
        case 'ArrowLeft': {
          const now = Date.now();
          if (now - lastLeft.current < 400) {
            previous();
            lastLeft.current = 0;
          } else {
            seek(currentTime - 5);
            lastLeft.current = now;
          }
          break;
        }
        case 'm':
        case 'M':
          toggleMute();
          break;
        case 'Escape':
          closeFullScreen();
          break;
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, toggle, next, previous, toggleMute, seek, currentTime, closeFullScreen]);

  return null;
}