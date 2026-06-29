/**
 * Tracks `document.visibilityState`. Used by the WS service to pause
 * reconnect while the tab is hidden.
 */
import { useEffect, useState } from 'react';

export function useVisibility(): boolean {
  const [visible, setVisible] = useState<boolean>(() =>
    typeof document === 'undefined' ? true : document.visibilityState === 'visible',
  );
  useEffect(() => {
    const onVis = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);
  return visible;
}