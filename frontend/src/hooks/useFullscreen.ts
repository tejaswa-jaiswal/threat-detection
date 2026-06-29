/**
 * Fullscreen helpers — wraps the Fullscreen API with React ergonomics.
 */
import { useCallback, useEffect, useState } from 'react';

export function useFullscreen(targetRef: React.RefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggle = useCallback(async () => {
    const el = targetRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      // Permissions / not supported — fail silently.
    }
  }, [targetRef]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === targetRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [targetRef]);

  return { isFullscreen, toggle };
}