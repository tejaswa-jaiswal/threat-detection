/**
 * WebSocket tuning constants.
 */

export const WS = {
  /** Frames buffered in-flight before backpressure kicks in. */
  maxBuffer: 8,
  /** Initial reconnect delay. */
  reconnectInitialMs: 1_000,
  /** Maximum reconnect delay. */
  reconnectMaxMs: 30_000,
  /** Jitter factor applied to each backoff (0..1). */
  jitterRatio: 0.25,
  /** Binary max size in bytes (server uses 8 MB). */
  maxFrameBytes: 8 * 1024 * 1024,
} as const;

export const WS_PROTOCOL = {
  subprotocolMarker: 'jwt',
} as const;