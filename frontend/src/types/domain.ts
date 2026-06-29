/**
 * Domain types — match backend Pydantic schemas 1:1.
 *
 * These are the canonical shapes the UI consumes. Services return these from
 * TanStack Query hooks; stores hold snapshots of these.
 */

export type UserRole = 'admin' | 'operator' | 'viewer';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string; // ISO timestamp
}

export type ThreatType = 'Knife' | 'Gun' | 'Explosives' | 'Grenade';

export interface Video {
  video_id: string; // UUID
  video_name: string;
  video_path: string;
  upload_time: string; // ISO timestamp
  end_time: string | null; // ISO timestamp, null while session is live
  user_id: number | null;
  detection_count: number;
}

export interface Detection {
  id: number;
  video_id: string; // UUID
  threat_type: ThreatType;
  confidence: number; // 0..1
  timestamp: string; // ISO timestamp
  path_image: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface AnalyticsSummary {
  total_videos: number;
  total_detections: number;
  last_24h_detections: number;
  active_sessions: number;
}

export interface AnalyticsDistribution {
  by_threat: Record<ThreatType, number>;
}

export interface TimelineBucket {
  ts: string; // ISO timestamp
  Knife: number;
  Gun: number;
  Explosives: number;
  Grenade: number;
}

export interface TimelineResponse {
  bucket: 'hour' | 'day';
  items: TimelineBucket[];
}

export interface TrendPoint {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface TrendsResponse {
  items: TrendPoint[];
}

export interface SystemInfo {
  model: {
    weights: string;
    resolution: number;
    threshold: number;
    video_fps: number;
    jpeg_quality: number;
  };
  threats: Array<{ id: number; label: string; enum: ThreatType }>;
  server: {
    version: string;
    api: string;
    uptime_seconds: number;
  };
  user: User;
}