/**
 * WebSocket store. Mirrors the singleton DetectionSocket's state so any
 * component can subscribe with a Zustand selector.
 *
 * The service is the only writer — components only read.
 */
import { create } from 'zustand';
import type { ConnectionState, FrameStats } from '@/types/ws';
import type { ThreatType } from '@/types/domain';

export interface LiveDetection {
  id: string; // client-generated, used as React key
  threat_type: ThreatType;
  confidence: number;
  ts: number; // Date.now() at moment of receipt
}

interface WSState {
  state: ConnectionState;
  attempt: number; // reconnect attempt counter
  videoId: string | null;
  startedAt: number | null;
  lastError: string | null;
  stats: FrameStats;
  detections: LiveDetection[];

  // setters used by the service
  _setState: (state: ConnectionState) => void;
  _setAttempt: (n: number) => void;
  _setVideoId: (id: string | null) => void;
  _setStartedAt: (ms: number | null) => void;
  _setError: (msg: string | null) => void;
  _bumpStat: (kind: keyof FrameStats, delta?: number) => void;
  _pushDetection: (d: LiveDetection) => void;
  _reset: () => void;
}

const emptyStats: FrameStats = {
  framesSent: 0,
  framesReceived: 0,
  fpsIn: 0,
  fpsOut: 0,
};

const MAX_DETECTIONS = 50; // bounded array — live UI only keeps recent ones.

export const useWsStore = create<WSState>((set) => ({
  state: 'idle',
  attempt: 0,
  videoId: null,
  startedAt: null,
  lastError: null,
  stats: { ...emptyStats },
  detections: [],

  _setState: (state) => set({ state }),
  _setAttempt: (attempt) => set({ attempt }),
  _setVideoId: (videoId) => set({ videoId }),
  _setStartedAt: (startedAt) => set({ startedAt }),
  _setError: (lastError) => set({ lastError }),
  _bumpStat: (kind, delta = 1) =>
    set((s) => ({ stats: { ...s.stats, [kind]: s.stats[kind] + delta } })),
  _pushDetection: (d) =>
    set((s) => {
      // Replace if a recent detection of the same type is within 1.5s, else
      // prepend. Keeps the list from churning visually.
      const now = d.ts;
      const merged = [...s.detections];
      const existingIdx = merged.findIndex(
        (x) => x.threat_type === d.threat_type && Math.abs(now - x.ts) < 1500,
      );
      if (existingIdx >= 0) {
        const existing = merged[existingIdx]!;
        merged[existingIdx] =
          d.confidence > existing.confidence ? d : existing;
      } else {
        merged.unshift(d);
        if (merged.length > MAX_DETECTIONS) merged.length = MAX_DETECTIONS;
      }
      return { detections: merged };
    }),
  _reset: () =>
    set({
      state: 'idle',
      attempt: 0,
      videoId: null,
      startedAt: null,
      lastError: null,
      stats: { ...emptyStats },
      detections: [],
    }),
}));