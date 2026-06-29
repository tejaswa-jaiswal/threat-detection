/**
 * useFps — measure instantaneous frames-per-second of a callback. The
 * LiveDetection page uses it to count annotated frames received per second
 * (independent of the WS service's own FPS counter, in case the service is
 * reused in tests).
 */
import { useEffect, useRef, useState } from 'react';

export function useFps(intervalMs = 1000): {
  fps: number;
  tick: () => void;
  reset: () => void;
} {
  const [fps, setFps] = useState(0);
  const frameCount = useRef(0);
  const lastUpdate = useRef(performance.now());
  const tick = () => {
    frameCount.current += 1;
    const now = performance.now();
    const delta = now - lastUpdate.current;
    if (delta >= intervalMs) {
      setFps(Math.round((frameCount.current * 1000) / delta));
      frameCount.current = 0;
      lastUpdate.current = now;
    }
  };
  const reset = () => {
    frameCount.current = 0;
    lastUpdate.current = performance.now();
    setFps(0);
  };
  useEffect(() => reset, [intervalMs]);
  return { fps, tick, reset };
}