'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { api, PlaybackResponse, Track } from './api';

export type RepeatMode = 'off' | 'all' | 'one';

interface PlayerContextValue {
  current: Track | null;
  queue: Track[];
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  repeat: RepeatMode;
  shuffle: boolean;
  isFullScreen: boolean;

  play: (track: Track, context?: Track[]) => Promise<void>;
  playQueue: (tracks: Track[], startIndex?: number) => Promise<void>;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  openFullScreen: () => void;
  closeFullScreen: () => void;
  toggleFullScreen: () => void;
  close: () => void;

  playbackInfo: PlaybackResponse | null;
  /** true quando o áudio atual é uma prévia de 30s */
  isPreview: boolean;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [playbackInfo, setPlaybackInfo] = useState<PlaybackResponse | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [muted, setMuted] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [shuffle, setShuffle] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // ─────────────────────────────────────────────────────
  // CARREGAR FAIXA
  // ─────────────────────────────────────────────────────
  const loadTrack = useCallback(async (track: Track) => {
    setError(null);
    setPlaybackInfo(null);

    setIsLoading(true);
    try {
      const info = await api.authorize(track.id);
      setPlaybackInfo(info);

      const a = audioRef.current;
      if (!a) return;

      a.src = info.url;
      a.load();
      try {
        await a.play();
      } catch {
        // Autoplay bloqueado pelo navegador — OK
      }
    } catch (e: unknown) {
      const err = e as { status?: number; message?: string };
      if (err.status === 403) {
        setError('Você não tem assinatura, aluguel ou preview disponível.');
      } else if (err.status === 401) {
        setError('Faça login para ouvir esta faixa.');
      } else {
        setError(err.message ?? 'Erro ao carregar a faixa');
      }
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─────────────────────────────────────────────────────
  // PLAY
  // ─────────────────────────────────────────────────────
  const play = useCallback(
    async (track: Track, context?: Track[]) => {
      setCurrent(track);
      if (context) setQueue(context);
      await loadTrack(track);
    },
    [loadTrack],
  );

  const playQueue = useCallback(
    async (tracks: Track[], startIndex = 0) => {
      if (tracks.length === 0) return;
      const index = Math.max(0, Math.min(startIndex, tracks.length - 1));
      setQueue(tracks);
      await play(tracks[index], tracks);
    },
    [play],
  );

  // ─────────────────────────────────────────────────────
  // NAVEGAÇÃO
  // ─────────────────────────────────────────────────────
  const findCurrentIndex = useCallback(() => {
    if (!current) return -1;
    return queue.findIndex((t) => t.id === current.id);
  }, [queue, current]);

  const next = useCallback(() => {
    if (queue.length === 0) return;
    const i = findCurrentIndex();
    if (i < 0) return;

    let nextIndex: number;
    if (shuffle) {
      do {
        nextIndex = Math.floor(Math.random() * queue.length);
      } while (queue.length > 1 && nextIndex === i);
    } else {
      nextIndex = i + 1;
      if (nextIndex >= queue.length) {
        if (repeat === 'all') nextIndex = 0;
        else return;
      }
    }
    play(queue[nextIndex], queue);
  }, [queue, shuffle, repeat, findCurrentIndex, play]);

  const previous = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;

    if (a.currentTime > 3) {
      a.currentTime = 0;
      return;
    }

    if (queue.length === 0) return;
    const i = findCurrentIndex();
    if (i <= 0) {
      a.currentTime = 0;
      return;
    }
    play(queue[i - 1], queue);
  }, [queue, findCurrentIndex, play]);

  const handleEnded = useCallback(() => {
    if (!current) return;
    const a = audioRef.current;
    if (!a) return;

    if (repeat === 'one') {
      a.currentTime = 0;
      a.play().catch(() => undefined);
      return;
    }

    // Se for preview, para em vez de avançar
    if (playbackInfo?.isPreview) {
      setIsPlaying(false);
      return;
    }

    next();
  }, [current, repeat, next, playbackInfo]);

  // ─────────────────────────────────────────────────────
  // AUDIO ELEMENT (cria uma vez)
  // ─────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = volume;
    audioRef.current = audio;

    const onTime = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onError = () => {
      setError('Erro ao reproduzir o áudio');
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
      audio.pause();
      audio.src = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handler de "ended" — registrado separado pra sempre pegar a versão atual
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.addEventListener('ended', handleEnded);
    return () => a.removeEventListener('ended', handleEnded);
  }, [handleEnded]);

  // Sincroniza volume
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = muted ? 0 : volume;
  }, [volume, muted]);

  // ─────────────────────────────────────────────────────
  // CONTROLES
  // ─────────────────────────────────────────────────────
  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a || !a.src) return;
    if (a.paused) {
      a.play().catch(() => setError('Erro ao reproduzir'));
    } else {
      a.pause();
    }
  }, []);

  const seek = useCallback((seconds: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min(seconds, a.duration || 0));
    setCurrentTime(a.currentTime);
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(Math.max(0, Math.min(1, v)));
    if (v > 0) setMuted(false);
  }, []);

  const toggleMute = useCallback(() => setMuted((m) => !m), []);
  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);
  const cycleRepeat = useCallback(() => {
    setRepeat((r) => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off'));
  }, []);

  const openFullScreen = useCallback(() => setIsFullScreen(true), []);
  const closeFullScreen = useCallback(() => setIsFullScreen(false), []);
  const toggleFullScreen = useCallback(() => setIsFullScreen((v) => !v), []);

  const close = useCallback(() => {
    const a = audioRef.current;
    if (a) {
      a.pause();
      a.src = '';
    }
    setCurrent(null);
    setQueue([]);
    setPlaybackInfo(null);
    setError(null);
    setIsPlaying(false);
    setIsFullScreen(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const isPreview = playbackInfo?.isPreview === true;

  const value = useMemo<PlayerContextValue>(
    () => ({
      current,
      queue,
      isPlaying,
      isLoading,
      error,
      currentTime,
      duration,
      volume,
      muted,
      repeat,
      shuffle,
      isFullScreen,
      play,
      playQueue,
      toggle,
      next,
      previous,
      seek,
      setVolume,
      toggleMute,
      toggleShuffle,
      cycleRepeat,
      openFullScreen,
      closeFullScreen,
      toggleFullScreen,
      close,
      playbackInfo,
      isPreview,
    }),
    [
      current,
      queue,
      isPlaying,
      isLoading,
      error,
      currentTime,
      duration,
      volume,
      muted,
      repeat,
      shuffle,
      isFullScreen,
      play,
      playQueue,
      toggle,
      next,
      previous,
      seek,
      setVolume,
      toggleMute,
      toggleShuffle,
      cycleRepeat,
      openFullScreen,
      closeFullScreen,
      toggleFullScreen,
      close,
      playbackInfo,
      isPreview,
    ],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer deve ser usado dentro de <PlayerProvider>');
  return ctx;
}

export function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}