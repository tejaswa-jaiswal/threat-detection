import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle, Film, Shield, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { analyticsService } from '@/services/analytics.service';
import { fmtCount } from '@/utils/format';

interface StatTileProps {
  icon: typeof AlertTriangle;
  label: string;
  value: number | string;
  tone: string;
  delay?: number;
}

function StatTile({ icon: Icon, label, value, tone, delay = 0 }: StatTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="h-full">
        <CardContent className="flex items-center gap-3 p-5">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-wider text-[color:var(--color-muted-foreground)]">
              {label}
            </div>
            <div className="font-mono text-2xl font-semibold tabular-nums">
              {fmtCount(typeof value === 'number' ? value : Number(value))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function AnalyticsSummaryCards() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: analyticsService.summary,
    refetchInterval: 30_000,
  });

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile
        icon={Film}
        label="Total videos"
        value={data.total_videos}
        tone="bg-[color:var(--color-chart-1)]/15 text-[color:var(--color-chart-1)]"
      />
      <StatTile
        icon={AlertTriangle}
        label="Total detections"
        value={data.total_detections}
        tone="bg-[color:var(--color-chart-2)]/15 text-[color:var(--color-chart-2)]"
        delay={0.05}
      />
      <StatTile
        icon={Shield}
        label="Active sessions"
        value={data.active_sessions}
        tone="bg-[color:var(--color-chart-3)]/15 text-[color:var(--color-chart-3)]"
        delay={0.1}
      />
      <StatTile
        icon={Activity}
        label="Last 24h"
        value={data.last_24h_detections}
        tone="bg-[color:var(--color-chart-4)]/15 text-[color:var(--color-chart-4)]"
        delay={0.15}
      />
    </div>
  );
}