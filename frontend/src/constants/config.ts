/**
 * App-wide configuration. Sourced from import.meta.env at build time.
 */

const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000';
const wsUrl = (import.meta.env.VITE_WS_URL as string | undefined) ?? 'ws://localhost:8000';

export const config = {
  apiUrl: apiUrl.replace(/\/$/, ''),
  wsUrl: wsUrl.replace(/\/$/, ''),
  isDev: import.meta.env.DEV,
  appName: 'Sentinel',
  appTagline: 'AI Threat Detection',
  /** Subprotocol header sent on WS upgrade to carry the JWT (preferred over
   *  query-string because it isn't surfaced in proxy logs / Referer). */
  wsSubprotocol: 'jwt',
} as const;