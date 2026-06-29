/**
 * Reads chart theme tokens from CSS vars at mount. Single source of truth so
 * every chart in the app shares consistent colors.
 */
import { useEffect, useState } from 'react';

export interface ChartTheme {
  text: string;
  muted: string;
  border: string;
  card: string;
  ring: string;
  palette: [string, string, string, string, string];
}

function readVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

const FALLBACK: ChartTheme = {
  text: '#f5f5fa',
  muted: '#a8a8b8',
  border: '#3b3b50',
  card: '#1d1f2c',
  ring: '#a78bfa',
  palette: ['#a78bfa', '#22c55e', '#eab308', '#f97316', '#ef4444'],
};

export function useChartTheme(): ChartTheme {
  const [theme, setTheme] = useState<ChartTheme>(FALLBACK);
  useEffect(() => {
    setTheme({
      text: readVar('--color-foreground', FALLBACK.text),
      muted: readVar('--color-muted-foreground', FALLBACK.muted),
      border: readVar('--color-border', FALLBACK.border),
      card: readVar('--color-card', FALLBACK.card),
      ring: readVar('--color-primary', FALLBACK.ring),
      palette: [
        readVar('--color-chart-1', FALLBACK.palette[0]!),
        readVar('--color-chart-2', FALLBACK.palette[1]!),
        readVar('--color-chart-3', FALLBACK.palette[2]!),
        readVar('--color-chart-4', FALLBACK.palette[3]!),
        readVar('--color-chart-5', FALLBACK.palette[4]!),
      ],
    });
  }, []);
  return theme;
}