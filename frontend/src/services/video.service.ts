/**
 * Video history service. All endpoints are JWT-protected.
 */
import type { Detection, Paginated, ThreatType, Video } from '@/types/domain';
import { api } from './api';

export interface ListVideosParams {
  limit?: number;
  offset?: number;
  search?: string;
  threat_type?: ThreatType | null;
}

export const videoService = {
  list(params: ListVideosParams = {}): Promise<Paginated<Video>> {
    const qs = new URLSearchParams();
    if (params.limit != null) qs.set('limit', String(params.limit));
    if (params.offset != null) qs.set('offset', String(params.offset));
    if (params.search) qs.set('search', params.search);
    if (params.threat_type) qs.set('threat_type', params.threat_type);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return api.get<Paginated<Video>>(`/videos${suffix}`);
  },

  get(id: string): Promise<Video> {
    return api.get<Video>(`/videos/${id}`);
  },

  listDetections(
    id: string,
    params: { limit?: number; offset?: number } = {},
  ): Promise<Paginated<Detection>> {
    const qs = new URLSearchParams();
    if (params.limit != null) qs.set('limit', String(params.limit));
    if (params.offset != null) qs.set('offset', String(params.offset));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return api.get<Paginated<Detection>>(`/videos/${id}/detections${suffix}`);
  },

  thumbnailUrl(id: string): string {
    // Return a URL string for direct <img> use; the api wrapper handles auth,
    // but <img> can't send headers — so we render through a fetch-into-blob
    // path via `thumbnailBlob` for authenticated cases.
    return `/videos/${id}/thumbnail`;
  },

  async thumbnailBlob(id: string): Promise<string> {
    const res = await api.get<Response>(`/videos/${id}/thumbnail`, { raw: true });
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },
};