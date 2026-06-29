/**
 * Analytics service.
 */
import type {
  AnalyticsDistribution,
  AnalyticsSummary,
  TimelineResponse,
  TrendsResponse,
} from '@/types/domain';
import { api } from './api';

export interface TimelineParams {
  bucket?: 'hour' | 'day';
  hours?: number;
}

export const analyticsService = {
  summary(): Promise<AnalyticsSummary> {
    return api.get<AnalyticsSummary>('/analytics/summary');
  },
  distribution(): Promise<AnalyticsDistribution> {
    return api.get<AnalyticsDistribution>('/analytics/distribution');
  },
  timeline(params: TimelineParams = {}): Promise<TimelineResponse> {
    const qs = new URLSearchParams();
    if (params.bucket) qs.set('bucket', params.bucket);
    if (params.hours != null) qs.set('hours', String(params.hours));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return api.get<TimelineResponse>(`/analytics/timeline${suffix}`);
  },
  trends(days = 14): Promise<TrendsResponse> {
    return api.get<TrendsResponse>(`/analytics/trends?days=${days}`);
  },
};