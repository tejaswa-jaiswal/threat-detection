/**
 * DetectionSocket — singleton WebSocket client for /ws/detect.
 *
 * Public API
 * ──────────
 *   const sock = DetectionSocket.getInstance();
 *   sock.startSession({ videoName, token, onFrame, onClose })
 *   sock.sendFrame(jpegBlob)
 *   sock.stopSession()
 *   sock.cancelReconnect()        ← user-driven "give up reconnecting"
 *   sock.subscribe(handler)       ← ConnectionState + lifecycle events
 *
 * Design choices
 * ──────────────
 *   • JWT is sent via the `Sec-WebSocket-Protocol` subprotocol so it isn't
 *     surfaced in URLs or proxy access logs.
 *   • The state machine is redux-style (reducer) for testability.
 *   • Backpressure: if more than `WS.maxBuffer` frames are in-flight we drop
 *     the oldest queued binary to keep latency low.
 *   • Auto-reconnect: exponential backoff with jitter, pauses while the tab
 *     is hidden, resumes on visibility.
 *   • Token-expiry check: if the auth store reports the JWT is expired we
 *     abort reconnect cleanly instead of looping.
 *
 * The service is the only writer to `useWsStore`; components select from it.
 */

import { config } from '@/constants/config';
import { WS } from '@/constants/ws';
import { useAuthStore } from '@/stores/authStore';
import { useWsStore } from '@/stores/wsStore';
import { backoff } from '@/utils/retry';
import { isExpired } from '@/utils/jwt';
import type { ConnectionState } from '@/types/ws';

// ---- Public event types --------------------------------------------------

export type LifecycleEvent =
  | { type: 'state'; state: ConnectionState }
  | { type: 'started'; videoId: string }
  | { type: 'error'; detail: string }
  | { type: 'close'; code: number; reason: string }
  | { type: 'frame'; blob: Blob };

export type LifecycleHandler = (e: LifecycleEvent) => void;

export interface StartOptions {
  videoName: string;
  token: string;
}

// ---- State machine -------------------------------------------------------

export interface SocketState {
  state: ConnectionState;
  attempt: number;
  videoId: string | null;
  videoName: string | null;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  socket: WebSocket | null;
  /** Bounded FIFO of pending binary frames. */
  outgoing: Blob[];
  /** True when the user explicitly stopped — do not auto-reconnect. */
  cancelled: boolean;
}

const initial: SocketState = {
  state: 'idle',
  attempt: 0,
  videoId: null,
  videoName: null,
  reconnectTimer: null,
  socket: null,
  outgoing: [],
  cancelled: false,
};

export type Action =
  | { type: 'CONNECT' }
  | { type: 'OPEN'; videoId: string }
  | { type: 'CLOSE'; code: number; reason: string }
  | { type: 'ERROR'; detail: string }
  | { type: 'SCHEDULE_RECONNECT' }
  | { type: 'CANCEL_RECONNECT' }
  | { type: 'RESET' };

/** Pure reducer — exported for unit tests. */
export function reduce(state: SocketState, action: Action): SocketState {
  switch (action.type) {
    case 'CONNECT':
      return {
        ...state,
        state: 'connecting',
        socket: null,
        cancelled: false,
      };
    case 'OPEN':
      return {
        ...state,
        state: 'open',
        attempt: 0,
        videoId: action.videoId,
        reconnectTimer: null,
      };
    case 'CLOSE':
      return {
        ...state,
        state: state.cancelled ? 'closed' : state.state === 'connecting' ? 'closed' : 'closed',
        socket: null,
        videoId: null,
        reconnectTimer: null,
      };
    case 'ERROR':
      return state; // surfaced via event; state follows CLOSE
    case 'SCHEDULE_RECONNECT':
      return {
        ...state,
        state: 'reconnecting',
        attempt: state.attempt + 1,
      };
    case 'CANCEL_RECONNECT':
      return {
        ...state,
        state: 'closed',
        cancelled: true,
        reconnectTimer: null,
      };
    case 'RESET':
      return { ...initial };
    default:
      return state;
  }
}

// ---- The singleton service ----------------------------------------------

export class DetectionSocket {
  private static instance: DetectionSocket | null = null;

  static getInstance(): DetectionSocket {
    DetectionSocket.instance ??= new DetectionSocket();
    return DetectionSocket.instance;
  }

  /** Test-only — wipe the singleton. */
  static _reset(): void {
    DetectionSocket.instance?.dispose();
    DetectionSocket.instance = null;
  }

  private state: SocketState = { ...initial };
  private handlers = new Set<LifecycleHandler>();
  private visibilityHandler: (() => void) | null = null;
  private fpsTimer: ReturnType<typeof setInterval> | null = null;
  private lastFpsInTick = 0;
  private lastFpsOutTick = 0;

  // ---- Subscription ----

  subscribe(handler: LifecycleHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  private emit(event: LifecycleEvent): void {
    // Snapshot handlers so unsubscribes during dispatch are safe.
    for (const h of [...this.handlers]) {
      try {
        h(event);
      } catch {
        // Don't let a misbehaving handler take down the socket.
      }
    }
  }

  // ---- Lifecycle ----

  startSession(opts: StartOptions): void {
    if (this.state.socket) {
      // Already active — refuse to start a second session.
      return;
    }
    if (isExpired(opts.token)) {
      this.emit({ type: 'error', detail: 'Token expired' });
      return;
    }
    this.state.videoName = opts.videoName;
    this.apply({ type: 'CONNECT' });
    this.connect(opts.token);
    this.attachVisibility();
    this.startFpsTimer();
  }

  stopSession(): void {
    this.detachVisibility();
    this.stopFpsTimer();
    if (this.state.socket) {
      try {
        this.state.socket.close(1000, 'client-stop');
      } catch {
        /* ignore */
      }
    }
    if (this.state.reconnectTimer) {
      clearTimeout(this.state.reconnectTimer);
      this.state.reconnectTimer = null;
    }
    this.apply({ type: 'CANCEL_RECONNECT' });
    useWsStore.getState()._reset();
    this.state = { ...initial };
  }

  cancelReconnect(): void {
    if (this.state.reconnectTimer) {
      clearTimeout(this.state.reconnectTimer);
      this.state.reconnectTimer = null;
    }
    this.apply({ type: 'CANCEL_RECONNECT' });
  }

  /** Queue a binary frame for the server. Returns false if buffer is full. */
  sendFrame(blob: Blob): boolean {
    if (this.state.state !== 'open' || !this.state.socket) return false;
    if (this.state.outgoing.length >= WS.maxBuffer) {
      // Drop the oldest queued frame to keep latency low.
      this.state.outgoing.shift();
    }
    this.state.outgoing.push(blob);
    this.flush();
    return true;
  }

  // ---- Internals ----

  private apply(action: Action): void {
    this.state = reduce(this.state, action);
    // Mirror to Zustand store so React can subscribe.
    const store = useWsStore.getState();
    store._setState(this.state.state);
    store._setAttempt(this.state.attempt);
    store._setVideoId(this.state.videoId);
    if (action.type === 'CONNECT' || action.type === 'RESET') {
      useWsStore.setState({ stats: { framesSent: 0, framesReceived: 0, fpsIn: 0, fpsOut: 0 } });
    }
    if (action.type === 'OPEN') {
      this.emit({ type: 'state', state: 'open' });
    } else if (action.type === 'CLOSE') {
      this.emit({ type: 'close', code: action.code, reason: action.reason });
    }
  }

  private connect(token: string): void {
    const url = `${config.wsUrl}/ws/detect`;
    // The backend accepts `["jwt", "<token>"]` as the subprotocol. If we
    // requested a subprotocol, the server must reply with the same string
    // or the browser closes the connection.
    let ws: WebSocket;
    try {
      ws = new WebSocket(url, [config.wsSubprotocol, token]);
    } catch (err) {
      this.emit({
        type: 'error',
        detail: err instanceof Error ? err.message : 'WS construction failed',
      });
      this.scheduleReconnect(token);
      return;
    }

    this.state.socket = ws;
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      // Send the start message as the very first frame.
      ws.send(JSON.stringify({ type: 'start', video_name: this.state.videoName }));
    };

    ws.onmessage = (evt) => {
      if (typeof evt.data === 'string') {
        // Could be started / error / future detections envelope.
        try {
          const parsed = JSON.parse(evt.data) as
            | { type: 'started'; video_id: string }
            | { type: 'error'; detail: string }
            | { type: 'detections'; detections: Array<{ threat_type: string; confidence: number }> };
          if (parsed.type === 'started') {
            this.apply({ type: 'OPEN', videoId: parsed.video_id });
            useWsStore.getState()._setStartedAt(Date.now());
            this.emit({ type: 'started', videoId: parsed.video_id });
          } else if (parsed.type === 'error') {
            useWsStore.getState()._setError(parsed.detail);
            this.emit({ type: 'error', detail: parsed.detail });
          } else if (parsed.type === 'detections') {
            for (const d of parsed.detections) {
              useWsStore.getState()._pushDetection({
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                threat_type: d.threat_type as never,
                confidence: d.confidence,
                ts: Date.now(),
              });
            }
          }
        } catch {
          // ignore malformed
        }
        return;
      }
      // Binary frame: annotated JPEG.
      const blob = new Blob([evt.data], { type: 'image/jpeg' });
      useWsStore.getState()._bumpStat('framesReceived', 1);
      this.emit({ type: 'frame', blob });
    };

    ws.onerror = () => {
      const msg = 'WebSocket error';
      useWsStore.getState()._setError(msg);
      this.emit({ type: 'error', detail: msg });
    };

    ws.onclose = (evt) => {
      this.apply({ type: 'CLOSE', code: evt.code, reason: evt.reason });
      this.state.socket = null;
      // Don't reconnect if the user explicitly cancelled, or if the JWT
      // expired during the session.
      if (this.state.cancelled) return;
      const auth = useAuthStore.getState();
      if (auth.token && isExpired(auth.token)) {
        auth.logout('expired');
        return;
      }
      if (auth.token) {
        this.scheduleReconnect(auth.token);
      }
    };
  }

  private scheduleReconnect(_token: string): void {
    // Skip reconnect if the page is hidden — defer to visibilitychange.
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }
    const delay = backoff(
      this.state.attempt,
      WS.reconnectInitialMs,
      WS.reconnectMaxMs,
      WS.jitterRatio,
    );
    this.apply({ type: 'SCHEDULE_RECONNECT' });
    this.state.reconnectTimer = setTimeout(() => {
      this.state.reconnectTimer = null;
      if (this.state.cancelled) return;
      const auth = useAuthStore.getState();
      if (!auth.token || isExpired(auth.token)) {
        this.cancelReconnect();
        return;
      }
      this.apply({ type: 'CONNECT' });
      this.connect(auth.token);
    }, delay);
  }

  private flush(): void {
    const ws = this.state.socket;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    while (this.state.outgoing.length > 0) {
      const next = this.state.outgoing.shift();
      if (!next) break;
      ws.send(next);
      useWsStore.getState()._bumpStat('framesSent', 1);
    }
  }

  private attachVisibility(): void {
    if (typeof document === 'undefined' || this.visibilityHandler) return;
    this.visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        const auth = useAuthStore.getState();
        if (
          this.state.state === 'reconnecting' &&
          auth.token &&
          !isExpired(auth.token) &&
          !this.state.reconnectTimer
        ) {
          this.apply({ type: 'CONNECT' });
          this.connect(auth.token);
        }
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  private detachVisibility(): void {
    if (typeof document !== 'undefined' && this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
    this.visibilityHandler = null;
  }

  private startFpsTimer(): void {
    this.stopFpsTimer();
    this.fpsTimer = setInterval(() => {
      const store = useWsStore.getState();
      const s = store.stats;
      // Simple counter-based FPS (frames since last tick / 1s).
      const fpsIn = s.framesReceived - this.lastFpsInTick;
      const fpsOut = s.framesSent - this.lastFpsOutTick;
      this.lastFpsInTick = s.framesReceived;
      this.lastFpsOutTick = s.framesSent;
      useWsStore.setState({
        stats: { ...s, fpsIn, fpsOut },
      });
    }, 1000);
  }

  private stopFpsTimer(): void {
    if (this.fpsTimer) {
      clearInterval(this.fpsTimer);
      this.fpsTimer = null;
    }
  }

  private dispose(): void {
    this.stopSession();
    this.handlers.clear();
  }
}