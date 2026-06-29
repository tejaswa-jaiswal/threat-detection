/**
 * Misc formatting helpers.
 */
import { formatDistanceToNow, parseISO, format as fmt } from 'date-fns';

export function fmtConfidence(c: number): string {
  return `${(c * 100).toFixed(0)}%`;
}

export function fmtCount(n: number): string {
  if (n < 1_000) return String(n);
  if (n < 1_000_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

export function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, Math.max(0, max - 1))}…`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || '?';
}

export function fmtRelative(iso: string): string {
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

export function fmtTime(input: string | number | Date, pattern = 'HH:mm:ss'): string {
  try {
    const d = typeof input === 'string' ? parseISO(input) : input;
    return fmt(d, pattern);
  } catch {
    return String(input);
  }
}