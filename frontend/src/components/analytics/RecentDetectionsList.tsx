import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertOctagon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { analyticsService } from '@/services/analytics.service';
import { videoService } from '@/services/video.service';
import { THREAT_META, threatBgClass, threatTextClass } from '@/constants/threats';
import { fmtRelative } from '@/utils/time';
import { fmtConfidence } from '@/utils/format';
import { EmptyState } from '@/components/common/EmptyState';
import type { ThreatType } from '@/types/domain';

interface Props {
  limit?: number;
}

export function RecentDetectionsList({ limit = 8 }: Props) {
  const timeline = useQuery({
    queryKey: ['analytics', 'timeline', { bucket: 'hour', hours: 1 }],
    queryFn: () => analyticsService.timeline({ bucket: 'hour', hours: 1 }),
    refetchInterval: 30_000,
  });

  // We don't have a dedicated /recent endpoint; derive from the latest video's
  // detections when the timeline is empty. Otherwise show distribution as a
  // fallback headline.
  const distribution = useQuery({
    queryKey: ['analytics', 'distribution'],
    queryFn: analyticsService.distribution,
  });

  const recent = useQuery({
    queryKey: ['recent-detections', { limit }],
    queryFn: async () => {
      const vids = await videoService.list({ limit: 5 });
      const all: Array<{ id: number; threat_type: ThreatType; confidence: number; timestamp: string }> = [];
      for (const v of vids.items) {
        if (all.length >= limit) break;
        const det = await videoService.listDetections(v.video_id, { limit: 10 });
        for (const d of det.items) {
          if (all.length >= limit) break;
          all.push(d);
        }
      }
      return all.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
    },
    enabled: timeline.isFetched && (timeline.data?.items.length ?? 0) === 0,
  });

  const items = recent.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertOctagon className="h-4 w-4 text-[color:var(--color-destructive)]" />
          Recent detections
        </CardTitle>
        <CardDescription>
          Latest threats recorded across all sessions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recent.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={AlertOctagon}
            title={distribution.data ? 'No recent detections' : 'Loading…'}
            description="Start a live session to populate detection history."
          />
        ) : (
          <ul className="space-y-2">
            {items.map((d, i) => {
              const meta = THREAT_META[d.threat_type];
              const Icon = meta.icon;
              return (
                <motion.li
                  key={d.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="clay-inset flex items-center gap-3 rounded-xl px-3 py-2"
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${threatBgClass(d.threat_type)}/15`}>
                    <Icon className={`h-4 w-4 ${threatTextClass(d.threat_type)}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{meta.label}</span>
                      <span className="font-mono text-xs text-[color:var(--color-muted-foreground)]">
                        {fmtConfidence(d.confidence)}
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-[color:var(--color-muted-foreground)]">
                      {fmtRelative(d.timestamp)}
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}