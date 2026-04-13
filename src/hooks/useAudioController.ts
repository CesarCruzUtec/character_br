"use client";

import { useRef, useCallback, useEffect } from "react";
import { Howl } from "howler";
import { isYouTubeUrl, extractYouTubeVideoId } from "@/lib/youtube";

// ─── Howler (direct audio files) ───────────────────────────────────────────

interface HowlerEntry {
  type: "howler";
  howl: Howl;
  url: string;
}

// ─── YouTube IFrame Player API ─────────────────────────────────────────────

declare global {
  interface Window {
    YT: {
      Player: new (
        element: HTMLElement | string,
        config: Record<string, unknown>
      ) => YTPlayer;
      PlayerState: { ENDED: number; PLAYING: number; PAUSED: number; BUFFERING: number };
      ready: (callback: () => void) => void;
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  setVolume: (v: number) => void;
  getVolume: () => number;
  getPlayerState: () => number;
  destroy: () => void;
}

interface YouTubeEntry {
  type: "youtube";
  player: YTPlayer;
  videoId: string;
  container: HTMLDivElement;
}

type AudioEntry = HowlerEntry | YouTubeEntry;

// ─── YouTube API loader (singleton) ────────────────────────────────────────

let ytApiLoaded = false;
let ytApiLoading = false;
const ytReadyQueue: (() => void)[] = [];

function ensureYouTubeAPI(): Promise<void> {
  if (ytApiLoaded) return Promise.resolve();
  if (ytApiLoading) {
    return new Promise((resolve) => ytReadyQueue.push(resolve));
  }
  ytApiLoading = true;
  return new Promise((resolve) => {
    ytReadyQueue.push(resolve);
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.head.appendChild(script);
    window.onYouTubeIframeAPIReady = () => {
      ytApiLoaded = true;
      ytApiLoading = false;
      ytReadyQueue.forEach((cb) => cb());
      ytReadyQueue.length = 0;
    };
  });
}

// ─── Unified audio controller hook ─────────────────────────────────────────

export function useAudioController() {
  const audioMapRef = useRef<Map<string, AudioEntry>>(new Map());
  const currentPlayingIdRef = useRef<string | null>(null);
  const fadeOutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ytContainerRef = useRef<HTMLDivElement | null>(null);
  const ytFadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Generation counter to prevent stale async operations from playing
  const playGenerationRef = useRef(0);

  const FADE_DURATION = 600;
  const FADE_STEP = 50;

  // Create hidden container for YouTube players
  useEffect(() => {
    if (typeof window === "undefined") return;
    const div = document.createElement("div");
    div.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:0;height:0;overflow:hidden;";
    div.id = "yt-audio-container";
    document.body.appendChild(div);
    ytContainerRef.current = div;
    return () => { div.remove(); };
  }, []);

  // ── Howler helpers ─────────────────────────────────────────────────────

  const getOrCreateHowl = useCallback(
    (characterId: string, url: string): Howl | null => {
      const existing = audioMapRef.current.get(characterId);
      if (existing?.type === "howler" && existing.url === url) return existing.howl;
      if (existing?.type === "howler") {
        existing.howl.stop();
        existing.howl.unload();
      }
      // If it was a YouTube player, destroy it
      if (existing?.type === "youtube") {
        existing.player.destroy();
        existing.container.remove();
      }
      try {
        const howl = new Howl({ src: [url], html5: true, loop: true, volume: 0 });
        const entry: HowlerEntry = { type: "howler", howl, url };
        audioMapRef.current.set(characterId, entry);
        return howl;
      } catch {
        return null;
      }
    },
    []
  );

  // ── YouTube helpers ────────────────────────────────────────────────────

  const getOrCreateYTPlayer = useCallback(
    async (characterId: string, videoId: string): Promise<YouTubeEntry | null> => {
      const existing = audioMapRef.current.get(characterId);
      if (existing?.type === "youtube" && existing.videoId === videoId) return existing;
      if (existing?.type === "youtube") {
        existing.player.destroy();
        existing.container.remove();
      }
      if (existing?.type === "howler") {
        existing.howl.stop();
        existing.howl.unload();
      }

      await ensureYouTubeAPI();
      if (!ytContainerRef.current) return null;

      return new Promise((resolve) => {
        const playerDiv = document.createElement("div");
        playerDiv.id = `yt-audio-${characterId}-${Date.now()}`;
        ytContainerRef.current!.appendChild(playerDiv);

        window.YT.ready(() => {
          try {
            const player = new window.YT.Player(playerDiv.id, {
              height: "0",
              width: "0",
              videoId,
              playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, modestbranding: 1, loop: 1, playlist: videoId },
              events: {
                onReady: () => {
                  const entry: YouTubeEntry = { type: "youtube", player, videoId, container: playerDiv };
                  audioMapRef.current.set(characterId, entry);
                  resolve(entry);
                },
                onError: () => { playerDiv.remove(); resolve(null); },
              },
            });
          } catch { playerDiv.remove(); resolve(null); }
        });
      });
    },
    []
  );

  // ── Fade helpers ───────────────────────────────────────────────────────

  const fadeHowler = useCallback(
    (howl: Howl, from: number, to: number, onComplete?: () => void) => {
      howl.fade(from, to, FADE_DURATION);
      if (onComplete) {
        if (fadeOutTimerRef.current) clearTimeout(fadeOutTimerRef.current);
        fadeOutTimerRef.current = setTimeout(onComplete, FADE_DURATION);
      }
    },
    []
  );

  const fadeYT = useCallback(
    (player: YTPlayer, from: number, to: number, onComplete?: () => void) => {
      if (ytFadeIntervalRef.current) clearInterval(ytFadeIntervalRef.current);
      const steps = Math.max(1, Math.floor(FADE_DURATION / FADE_STEP));
      const increment = (to - from) / steps;
      let step = 0;
      ytFadeIntervalRef.current = setInterval(() => {
        step++;
        player.setVolume(Math.max(0, Math.min(100, Math.round(from + increment * step))));
        if (step >= steps) {
          if (ytFadeIntervalRef.current) { clearInterval(ytFadeIntervalRef.current); ytFadeIntervalRef.current = null; }
          player.setVolume(to);
          onComplete?.();
        }
      }, FADE_STEP);
    },
    []
  );

  // ── Public API ─────────────────────────────────────────────────────────

  const playAudio = useCallback(
    async (characterId: string, url: string) => {
      if (!url) return;

      // Bump generation — any stale async result will be discarded
      const gen = ++playGenerationRef.current;

      const isYT = isYouTubeUrl(url);

      // Immediately stop whatever is currently playing
      if (currentPlayingIdRef.current && currentPlayingIdRef.current !== characterId) {
        const prev = audioMapRef.current.get(currentPlayingIdRef.current);
        if (prev?.type === "howler") {
          prev.howl.stop();
          prev.howl.volume(0);
        } else if (prev?.type === "youtube") {
          prev.player.setVolume(0);
          prev.player.pauseVideo();
        }
        currentPlayingIdRef.current = null;
      }

      // If same character already playing, just ensure volume is up
      if (currentPlayingIdRef.current === characterId) {
        const entry = audioMapRef.current.get(characterId);
        if (entry?.type === "howler" && entry.howl.playing()) {
          entry.howl.fade(entry.howl.volume(), 1, FADE_DURATION);
          return;
        }
        if (entry?.type === "youtube") {
          const state = entry.player.getPlayerState();
          if (state === window.YT?.PlayerState?.PLAYING || state === window.YT?.PlayerState?.PAUSED) {
            entry.player.playVideo();
            fadeYT(entry.player, entry.player.getVolume(), 100);
            return;
          }
        }
      }

      // Play new audio
      if (isYT) {
        const videoId = extractYouTubeVideoId(url);
        if (!videoId) return;
        const entry = await getOrCreateYTPlayer(characterId, videoId);
        // Stale check: a newer playAudio was called while we were loading
        if (playGenerationRef.current !== gen) {
          // We're stale — stop ourselves
          entry?.player.setVolume(0);
          entry?.player.pauseVideo();
          return;
        }
        if (!entry) return;
        currentPlayingIdRef.current = characterId;
        entry.player.playVideo();
        setTimeout(() => {
          // Double-check generation before fading in
          if (playGenerationRef.current !== gen) {
            entry.player.setVolume(0);
            entry.player.pauseVideo();
            return;
          }
          entry.player.setVolume(0);
          fadeYT(entry.player, 0, 100);
        }, 300);
      } else {
        const howl = getOrCreateHowl(characterId, url);
        if (!howl) return;
        // Stale check for howler too (in case of rapid switches)
        if (playGenerationRef.current !== gen) {
          howl.stop();
          return;
        }
        currentPlayingIdRef.current = characterId;
        if (!howl.playing()) howl.play();
        howl.volume(0);
        fadeHowler(howl, 0, 1);
      }
    },
    [getOrCreateHowl, getOrCreateYTPlayer, fadeHowler, fadeYT]
  );

  const pauseAudio = useCallback(
    (characterId: string) => {
      if (currentPlayingIdRef.current !== characterId) return;
      const entry = audioMapRef.current.get(characterId);
      if (!entry) return;

      // Bump generation so any in-flight playAudio becomes stale
      playGenerationRef.current++;

      if (entry.type === "howler") {
        entry.howl.stop();
        entry.howl.volume(0);
      } else {
        entry.player.setVolume(0);
        entry.player.pauseVideo();
      }
      currentPlayingIdRef.current = null;
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fadeOutTimerRef.current) clearTimeout(fadeOutTimerRef.current);
      if (ytFadeIntervalRef.current) clearInterval(ytFadeIntervalRef.current);
      audioMapRef.current.forEach((entry) => {
        if (entry.type === "howler") { entry.howl.stop(); entry.howl.unload(); }
        else { entry.player.destroy(); entry.container.remove(); }
      });
      audioMapRef.current.clear();
    };
  }, []);

  return { playAudio, pauseAudio };
}
