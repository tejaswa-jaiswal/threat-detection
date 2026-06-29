/**
 * useWebSocket — convenience hook over the singleton DetectionSocket.
 *
 * Encapsulates the start/stop lifecycle so a component only needs to call
 * `useWebSocketSession({ videoName, onFrame })` and the rest is handled.
 */
import { useEffect, useRef } from 'react';
import { DetectionSocket, type LifecycleEvent } from '@/services/ws.service';
import { useAuthStore } from '@/stores/authStore';
import { useWsStore } from '@/stores/wsStore';

export interface UseWebSocketSessionOptions {
  /** Set non-null when the component wants a session started. */
  videoName: string | null;
  /** Called for every annotated frame received from the server. */
  onFrame?: (blob: Blob) => void;
}

export function useWebSocketSession(opts: UseWebSocketSessionOptions): {
  cancelReconnect: () => void;
} {
  const { videoName, onFrame } = opts;
  // Latest callbacks in refs so we don't restart the socket when they change.
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!videoName || !token) return;
    const sock = DetectionSocket.getInstance();
    const unsub = sock.subscribe((e: LifecycleEvent) => {
      if (e.type === 'frame') {
        onFrameRef.current?.(e.blob);
      }
    });
    sock.startSession({ videoName, token });
    return () => {
      unsub();
      sock.stopSession();
      useWsStore.getState()._reset();
    };
  }, [videoName, token]);

  return {
    cancelReconnect: () => DetectionSocket.getInstance().cancelReconnect(),
  };
}