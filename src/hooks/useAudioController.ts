"use client";

import { useRef, useCallback, useEffect } from "react";
import { Howl } from "howler";

interface AudioEntry {
  howl: Howl;
  url: string;
}

/**
 * Custom hook for managing crossfading audio playback.
 * Handles play/pause with smooth fade transitions.
 */
export function useAudioController() {
  const audioMapRef = useRef<Map<string, AudioEntry>>(new Map());
  const currentPlayingIdRef = useRef<string | null>(null);
  const fadeOutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const FADE_DURATION = 600; // ms

  const getOrCreateHowl = useCallback((characterId: string, url: string): Howl | null => {
    if (!url) return null;

    const existing = audioMapRef.current.get(characterId);
    if (existing && existing.url === url) {
      return existing.howl;
    }

    // Stop and unload old one if exists
    if (existing) {
      existing.howl.stop();
      existing.howl.unload();
    }

    try {
      const howl = new Howl({
        src: [url],
        html5: true,
        loop: true,
        volume: 0,
        onloaderror: () => {
          console.warn(`Failed to load audio for character ${characterId}`);
        },
      });

      audioMapRef.current.set(characterId, { howl, url });
      return howl;
    } catch {
      console.warn(`Failed to create Howl for character ${characterId}`);
      return null;
    }
  }, []);

  const playAudio = useCallback(
    (characterId: string, url: string) => {
      if (!url) return;

      // Clear any pending fade-out
      if (fadeOutTimerRef.current) {
        clearTimeout(fadeOutTimerRef.current);
        fadeOutTimerRef.current = null;
      }

      // If same character is already playing, just ensure it's audible
      if (currentPlayingIdRef.current === characterId) {
        const entry = audioMapRef.current.get(characterId);
        if (entry && entry.howl.playing()) {
          entry.howl.fade(entry.howl.volume(), 1, FADE_DURATION);
          return;
        }
      }

      // Fade out current audio
      if (currentPlayingIdRef.current) {
        const currentEntry = audioMapRef.current.get(currentPlayingIdRef.current);
        if (currentEntry) {
          const currentHowl = currentEntry.howl;
          const currentVol = currentHowl.volume();
          currentHowl.fade(currentVol, 0, FADE_DURATION);
          // Pause after fade completes
          const id = currentPlayingIdRef.current;
          setTimeout(() => {
            const entry = audioMapRef.current.get(id);
            if (entry && entry.howl.volume() === 0) {
              entry.howl.pause();
            }
          }, FADE_DURATION);
        }
      }

      // Play new audio
      const howl = getOrCreateHowl(characterId, url);
      if (howl) {
        currentPlayingIdRef.current = characterId;
        if (!howl.playing()) {
          howl.play();
        }
        howl.fade(0, 1, FADE_DURATION);
      }
    },
    [getOrCreateHowl]
  );

  const pauseAudio = useCallback(
    (characterId: string) => {
      if (currentPlayingIdRef.current !== characterId) return;

      const entry = audioMapRef.current.get(characterId);
      if (!entry) return;

      const howl = entry.howl;
      const currentVol = howl.volume();

      howl.fade(currentVol, 0, FADE_DURATION);
      fadeOutTimerRef.current = setTimeout(() => {
        if (howl.volume() === 0) {
          howl.pause();
        }
        if (currentPlayingIdRef.current === characterId) {
          currentPlayingIdRef.current = null;
        }
      }, FADE_DURATION);
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fadeOutTimerRef.current) {
        clearTimeout(fadeOutTimerRef.current);
      }
      audioMapRef.current.forEach((entry) => {
        entry.howl.stop();
        entry.howl.unload();
      });
      audioMapRef.current.clear();
    };
  }, []);

  return { playAudio, pauseAudio };
}
