/**
 * Audio Hook for Orbit
 *
 * Handles hover sounds, click sounds, and background music.
 * Music starts muted by preference and can be toggled.
 * Features: debounced hover sounds, lazy-loaded ambient audio.
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import { AUDIO, STORAGE_KEYS } from '../config/constants.js';

/**
 * Audio manager hook
 * @returns {{ playHover, playClick, toggleMusic, isMusicPlaying }}
 */
export function useAudio() {
  const hoverRef = useRef(null);
  const clickRef = useRef(null);
  const ambientRef = useRef(null);
  const lastHoverTime = useRef(0);
  const ambientLoaded = useRef(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  // Initialize SFX audio elements (small files, load immediately)
  useEffect(() => {
    // Hover sound - quiet, subtle
    hoverRef.current = new Audio(AUDIO.SOUNDS.hover);
    hoverRef.current.volume = AUDIO.VOLUMES.hover;
    hoverRef.current.preload = 'auto';

    // Click sound - slightly louder
    clickRef.current = new Audio(AUDIO.SOUNDS.click);
    clickRef.current.volume = AUDIO.VOLUMES.click;
    clickRef.current.preload = 'auto';

    // Check if ambient should auto-play (don't load until needed)
    const musicPref = localStorage.getItem(STORAGE_KEYS.MUSIC_PREF);
    if (musicPref === 'on') {
      loadAndPlayAmbient();
    }

    return () => {
      hoverRef.current?.pause();
      clickRef.current?.pause();
      ambientRef.current?.pause();
    };
  }, []);

  // Lazy load ambient audio (3MB+ file)
  const loadAndPlayAmbient = useCallback(() => {
    if (!ambientLoaded.current) {
      ambientRef.current = new Audio(AUDIO.SOUNDS.ambient);
      ambientRef.current.volume = AUDIO.VOLUMES.ambient;
      ambientRef.current.loop = true;
      ambientLoaded.current = true;
    }
    ambientRef.current.play().catch(() => {});
    setIsMusicPlaying(true);
  }, []);

  // Debounced hover sound
  const playHover = useCallback(() => {
    const now = Date.now();
    if (now - lastHoverTime.current < AUDIO.DEBOUNCE_MS) return;
    lastHoverTime.current = now;

    if (hoverRef.current) {
      hoverRef.current.currentTime = 0;
      hoverRef.current.play().catch(() => {});
    }
  }, []);

  const playClick = useCallback(() => {
    if (clickRef.current) {
      clickRef.current.currentTime = 0;
      clickRef.current.play().catch(() => {});
    }
  }, []);

  const toggleMusic = useCallback(() => {
    if (isMusicPlaying) {
      ambientRef.current?.pause();
      localStorage.setItem(STORAGE_KEYS.MUSIC_PREF, 'off');
      setIsMusicPlaying(false);
    } else {
      loadAndPlayAmbient();
      localStorage.setItem(STORAGE_KEYS.MUSIC_PREF, 'on');
    }
  }, [isMusicPlaying, loadAndPlayAmbient]);

  return {
    playHover,
    playClick,
    toggleMusic,
    isMusicPlaying,
  };
}
