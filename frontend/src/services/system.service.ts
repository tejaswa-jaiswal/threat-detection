/**
 * System info service. Used by Settings page.
 */
import type { SystemInfo } from '@/types/domain';
import { api } from './api';

export const systemService = {
  info(): Promise<SystemInfo> {
    return api.get<SystemInfo>('/system/info');
  },
};