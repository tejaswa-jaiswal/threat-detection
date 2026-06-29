/**
 * Time formatting helpers — built on date-fns for tree-shaken imports.
 */
import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';

export function fmtDate(iso: string | null | undefined, fallback = '—'): string {
  if (!iso) return fallback;
  try {
    return format(parseISO(iso), 'MMM d, yyyy');
  } catch {
    return fallback;
  }
}

export function fmtDateTime(iso: string | null | undefined, fallback = '—'): string {
  if (!iso) return fallback;
  try {
    return format(parseISO(iso), 'MMM d, yyyy · HH:mm:ss');
  } catch {
    return fallback;
  }
}

export function fmtTime(iso: string | null | undefined, fallback = '—'): string {
  if (!iso) return fallback;
  try {
    return format(parseISO(iso), 'HH:mm:ss');
  } catch {
    return fallback;
  }
}

export function fmtRelative(iso: string | null | undefined, fallback = '—'): string {
  if (!iso) return fallback;
  try {
    return formatDistanceToNowStrict(parseISO(iso), { addSuffix: true });
  } catch {
    return fallback;
  }
}

export function fmtUptime(seconds: number | null | undefined): string {
  if (seconds == null) return '—';
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
  if (seconds < 86_400) {
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  }
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3600);
  return `${days}d ${hours}h`;
}