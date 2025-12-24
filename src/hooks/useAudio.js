/**
 * Audio Hook for Orbit
 *
 * Handles SFX for actions and immersive background audio.
 * Features:
 * - New item submission sound
 * - Mode switching sound
 * - Mark done sound
 * - Reminder sound for old items
 * - Immersive 8D spatial audio for ambient background
 * - File integrity verification via SHA-256
 */

import { useRef, useCallback, useEffect, useState } from 'react';
import { AUDIO, STORAGE_KEYS } from '../config/constants';

// =============================================================================
// Audio Integrity Verification
// =============================================================================

/**
 * Compute SHA-256 hash of an ArrayBuffer
 */
async function computeHash(buffer) {
  try {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    console.warn('[Audio] Hash computation unavailable:', e);
    return null;
  }
}

/**
 * Verify audio file integrity
 */
async function verifyAudioFile(url, expectedHash) {
  if (!AUDIO.VERIFY_INTEGRITY || !expectedHash) return true;

  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const actualHash = await computeHash(buffer);

    if (actualHash && actualHash !== expectedHash) {
      console.error(`[Audio] Integrity check FAILED for ${url}`);
      console.error(`  Expected: ${expectedHash}`);
      console.error(`  Actual:   ${actualHash}`);
      return false;
    }

    return true;
  } catch (e) {
    console.warn('[Audio] Integrity check failed:', e);
    return true; // Don't block on network errors
  }
}

// Track verified files to avoid re-checking
const verifiedFiles = new Set();

/**
 * Create verified audio element
 */
async function createVerifiedAudio(soundKey) {
  const url = AUDIO.SOUNDS[soundKey];
  const hash = AUDIO.HASHES?.[soundKey];

  // Only verify once per session
  if (!verifiedFiles.has(soundKey) && AUDIO.VERIFY_INTEGRITY) {
    const isValid = await verifyAudioFile(url, hash);
    if (!isValid) {
      console.warn(`[Audio] Skipping ${soundKey} due to failed integrity check`);
      return null;
    }
    verifiedFiles.add(soundKey);
  }

  const audio = new Audio(url);
  audio.volume = AUDIO.VOLUMES[soundKey];
  audio.preload = 'auto';
  return audio;
}

// =============================================================================
// Audio Hook
// =============================================================================

/**
 * Audio manager hook with immersive spatial audio
 */
export function useAudio() {
  // SFX refs
  const newItemRef = useRef(null);
  const modeSwitchRef = useRef(null);
  const markDoneRef = useRef(null);
  const reminderRef = useRef(null);

  // Immersive audio refs
  const audioContextRef = useRef(null);
  const ambientSourceRef = useRef(null);
  const ambientGainRef = useRef(null);
  const pannerRef = useRef(null);
  const filterRef = useRef(null);
  const ambientBufferRef = useRef(null);
  const animationFrameRef = useRef(null);
  const panPhaseRef = useRef(0);

  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const ambientLoaded = useRef(false);
  const ambientVerified = useRef(false);

  // Initialize SFX audio elements with integrity verification
  useEffect(() => {
    async function initAudio() {
      // Verify and create all SFX audio elements
      const [newItem, modeSwitch, markDone, reminder] = await Promise.all([
        createVerifiedAudio('newItem'),
        createVerifiedAudio('modeSwitch'),
        createVerifiedAudio('markDone'),
        createVerifiedAudio('reminder'),
      ]);

      newItemRef.current = newItem;
      modeSwitchRef.current = modeSwitch;
      markDoneRef.current = markDone;
      reminderRef.current = reminder;

      setAudioReady(true);

      // Check if ambient should auto-play
      const musicPref = localStorage.getItem(STORAGE_KEYS.MUSIC_PREF);
      if (musicPref === 'on') {
        loadAndPlayAmbient();
      }
    }

    initAudio();

    return () => {
      newItemRef.current?.pause();
      modeSwitchRef.current?.pause();
      markDoneRef.current?.pause();
      reminderRef.current?.pause();
      stopAmbient();
    };
  }, []);

  // Create immersive audio context with 8D panning
  const initAudioContext = useCallback(async () => {
    if (audioContextRef.current) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContextRef.current = new AudioContext();
    const ctx = audioContextRef.current;

    // Create panner for 8D effect
    pannerRef.current = ctx.createStereoPanner();
    pannerRef.current.pan.value = 0;

    // Create filter for warmth
    filterRef.current = ctx.createBiquadFilter();
    filterRef.current.type = 'lowpass';
    filterRef.current.frequency.value = AUDIO.IMMERSIVE.FILTER_FREQ;
    filterRef.current.Q.value = AUDIO.IMMERSIVE.FILTER_Q;

    // Create gain node
    ambientGainRef.current = ctx.createGain();
    ambientGainRef.current.gain.value = AUDIO.VOLUMES.ambient;

    // Connect: source -> filter -> panner -> gain -> destination
    filterRef.current.connect(pannerRef.current);
    pannerRef.current.connect(ambientGainRef.current);
    ambientGainRef.current.connect(ctx.destination);

    // Verify ambient audio integrity before loading
    if (AUDIO.VERIFY_INTEGRITY && !ambientVerified.current) {
      const isValid = await verifyAudioFile(AUDIO.SOUNDS.ambient, AUDIO.HASHES?.ambient);
      if (!isValid) {
        console.error('[Audio] Ambient audio failed integrity check');
        return;
      }
      ambientVerified.current = true;
    }

    // Load ambient audio buffer
    try {
      const response = await fetch(AUDIO.SOUNDS.ambient);
      const arrayBuffer = await response.arrayBuffer();
      ambientBufferRef.current = await ctx.decodeAudioData(arrayBuffer);
      ambientLoaded.current = true;
    } catch (e) {
      console.warn('Failed to load ambient audio:', e);
    }
  }, []);

  // Animate 8D panning effect
  const animatePanning = useCallback(() => {
    if (!pannerRef.current || !isMusicPlaying) return;

    panPhaseRef.current += AUDIO.IMMERSIVE.PAN_SPEED;
    const panValue = Math.sin(panPhaseRef.current) * AUDIO.IMMERSIVE.PAN_RANGE;
    pannerRef.current.pan.setValueAtTime(panValue, audioContextRef.current.currentTime);

    // Subtle filter modulation for depth
    const filterMod = 600 + Math.sin(panPhaseRef.current * 0.7) * 200;
    filterRef.current.frequency.setValueAtTime(filterMod, audioContextRef.current.currentTime);

    animationFrameRef.current = requestAnimationFrame(animatePanning);
  }, [isMusicPlaying]);

  // Start panning animation when music plays
  useEffect(() => {
    if (isMusicPlaying) {
      animatePanning();
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isMusicPlaying, animatePanning]);

  // Load and play ambient with immersive effect
  const loadAndPlayAmbient = useCallback(async () => {
    await initAudioContext();

    if (!ambientBufferRef.current) {
      // Fallback: wait a bit and retry
      setTimeout(() => loadAndPlayAmbient(), 500);
      return;
    }

    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // Create new source (sources can only be played once)
    ambientSourceRef.current = ctx.createBufferSource();
    ambientSourceRef.current.buffer = ambientBufferRef.current;
    ambientSourceRef.current.loop = true;
    ambientSourceRef.current.connect(filterRef.current);
    ambientSourceRef.current.start();

    setIsMusicPlaying(true);
  }, [initAudioContext]);

  const stopAmbient = useCallback(() => {
    if (ambientSourceRef.current) {
      try {
        ambientSourceRef.current.stop();
      } catch (e) {
        // Already stopped
      }
      ambientSourceRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsMusicPlaying(false);
  }, []);

  // Play new item SFX
  const playNewItem = useCallback(() => {
    if (newItemRef.current) {
      newItemRef.current.currentTime = 0;
      newItemRef.current.play().catch(() => {});
    }
  }, []);

  // Play mode switch SFX
  const playModeSwitch = useCallback(() => {
    if (modeSwitchRef.current) {
      modeSwitchRef.current.currentTime = 0;
      modeSwitchRef.current.play().catch(() => {});
    }
  }, []);

  // Play mark done SFX
  const playMarkDone = useCallback(() => {
    if (markDoneRef.current) {
      markDoneRef.current.currentTime = 0;
      markDoneRef.current.play().catch(() => {});
    }
  }, []);

  // Play reminder SFX
  const playReminder = useCallback(() => {
    if (reminderRef.current) {
      reminderRef.current.currentTime = 0;
      reminderRef.current.play().catch(() => {});
    }
  }, []);

  // Toggle music
  const toggleMusic = useCallback(() => {
    if (isMusicPlaying) {
      stopAmbient();
      localStorage.setItem(STORAGE_KEYS.MUSIC_PREF, 'off');
    } else {
      loadAndPlayAmbient();
      localStorage.setItem(STORAGE_KEYS.MUSIC_PREF, 'on');
    }
  }, [isMusicPlaying, stopAmbient, loadAndPlayAmbient]);

  return {
    playNewItem,
    playModeSwitch,
    playMarkDone,
    playReminder,
    toggleMusic,
    isMusicPlaying,
    audioReady,
  };
}
