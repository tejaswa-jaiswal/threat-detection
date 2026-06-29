/**
 * Route constants. Keep names stable — these are referenced by guards and
 * side-nav links.
 */

export const ROUTES = {
  login: '/login',
  dashboard: '/',
  live: '/live',
  history: '/history',
  analytics: '/analytics',
  settings: '/settings',
} as const;

export type RouteKey = keyof typeof ROUTES;