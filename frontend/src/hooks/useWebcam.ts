/**
 * Webcam hook — opens getUserMedia, captures JPEG frames on requestAnimationFrame,
 * throttles to a target FPS, and cleans up tracks on unmount.
 *
 * Returns:
 *   videoRef    — bind to a <video> element
 *   canvasRef   — bind to a <canvas> used for capture (kept off-screen)
 *   state       — 'idle' | 'requesting' | 'streaming' | 'paused' | 'error'
 *   error       — typed error info if state === 'error'
 *   captureFrame — returns Promise<Blob | null> — a JPEG snapshot
 *   start / stop
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export type WebcamState = 'idle' | 'requesting' | 'streaming' | 'paused' | 'error';

export interface WebcamError {
  kind:
    | 'NotAllowedError'
    | 'NotFoundError'
    | 'NotReadableError'
    | 'OverconstrainedError'
    | 'SecurityError'
    | 'UnsupportedError'
    | 'Unknown';
  message: string;
}

export interface UseWebcamOptions {
  width?: number;
  height?: number;
  /** Target FPS for `captureFrame`. Defaults to 10. */
  fps?: number;
  /** JPEG quality 0..1. Defaults to 0.8. */
  quality?: number;
}

export function useWebcam(opts: UseWebcamOptions = {}) {
  const { width = 1280, height = 720, fps = 10, quality = 0.8 } = opts;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastCaptureRef = useRef(0);

  const [state, setState] = useState<WebcamState>('idle');
  const [error, setError] = useState<WebcamError | null>(null);

  /** Classify a getUserMedia error into something readable. */
  const classify = useCallback((err: unknown): WebcamError => {
    if (err instanceof DOMException) {
      return {
        kind: (err.name as WebcamError['kind']) ?? 'Unknown',
        message: err.message || 'Camera error',
      };
    }
    return {
      kind: 'Unknown',
      message: err instanceof Error ? err.message : 'Unknown camera error',
    };
  }, []);

  const stop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState('idle');
  }, []);

  const start = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError({ kind: 'UnsupportedError', message: 'Camera not supported in this browser' });
      setState('error');
      return;
    }

    setState('requesting');
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: width }, height: { ideal: height } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {
          // Autoplay policy: needs user gesture; UI must call play() from a click.
        });
      }
      setState('streaming');
    } catch (err) {
      const e = classify(err);
      // HTTPS check (security error from getUserMedia on http://).
      if (
        e.kind === 'NotAllowedError' &&
        window.isSecureContext === false &&
        location.hostname !== 'localhost' &&
        location.hostname !== '127.0.0.1'
      ) {
        setError({
          kind: 'SecurityError',
          message: 'Camera requires HTTPS or localhost',
        });
      } else {
        setError(e);
      }
      setState('error');
    }
  }, [classify, width, height]);

  const captureFrame = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || state !== 'streaming') {
        resolve(null);
        return;
      }
      const w = video.videoWidth || width;
      const h = video.videoHeight || height;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(video, 0, 0, w, h);
      canvas.toBlob(
        (blob) => resolve(blob),
        'image/jpeg',
        quality,
      );
    });
  }, [state, width, height, quality]);

  /** Run a continuous capture loop on rAF, throttled to `fps`. Calls onFrame
   *  with each Blob. Returns a stop function. */
  const startCaptureLoop = useCallback(
    (onFrame: (blob: Blob | null) => void): (() => void) => {
      const interval = 1000 / fps;
      const tick = () => {
        const now = performance.now();
        if (now - lastCaptureRef.current >= interval) {
          lastCaptureRef.current = now;
          captureFrame().then((b) => onFrame(b));
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      return () => {
        if (rafRef.current != null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      };
    },
    [captureFrame, fps],
  );

  // Ensure cleanup on unmount (StrictMode double-mount safe).
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    videoRef,
    canvasRef,
    state,
    error,
    start,
    stop,
    captureFrame,
    startCaptureLoop,
  };
}