import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Activity, Clock, Film, AlertOctagon, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { analyticsService } from '@/services/analytics.service';
import { ROUTES } from '@/constants/routes';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { ConnectionIndicator } from '@/components/common/ConnectionIndicator';
import { THREAT_META, THREAT_LIST, threatTextClass, threatBgClass } from '@/constants/threats';

export function Dashboard() {
  const summary = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: analyticsService.summary,
    refetchInterval: 30_000,
  });
  const distribution = useQuery({
    queryKey: ['analytics', 'distribution'],
    queryFn: analyticsService.distribution,
    refetchInterval: 60_000,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Operational overview of your surveillance network."
        actions={
          <div className="flex items-center gap-2">
            <ConnectionIndicator />
            <Button asChild variant="glass" size="sm">
              <Link to={ROUTES.live}>
                Open Live <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        }
      />

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Film}
          label="Total sessions"
          value={summary.data?.total_videos}
          isLoading={summary.isLoading}
        />
        <StatCard
          icon={AlertOctagon}
          label="Detections"
          value={summary.data?.total_detections}
          accent="destructive"
          isLoading={summary.isLoading}
        />
        <StatCard
          icon={Clock}
          label="Last 24h"
          value={summary.data?.last_24h_detections}
          accent="warning"
          isLoading={summary.isLoading}
        />
        <StatCard
          icon={Activity}
          label="Active sessions"
          value={summary.data?.active_sessions}
          accent="success"
          isLoading={summary.isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Threat distribution</CardTitle>
            <CardDescription>All-time count by threat category.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {distribution.isLoading
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)
              : THREAT_LIST.map((t) => {
                  const count = distribution.data?.by_threat[t] ?? 0;
                  const total = distribution.data
                    ? Object.values(distribution.data.by_threat).reduce((a, b) => a + b, 0)
                    : 0;
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  const meta = THREAT_META[t];
                  const Icon = meta.icon;
                  return (
                    <div key={t} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${threatBgClass(t)}/15`}>
                            <Icon className={`h-3.5 w-3.5 ${threatTextClass(t)}`} />
                          </div>
                          <span className="font-medium">{meta.label}</span>
                        </div>
                        <span className="font-mono text-xs text-[color:var(--color-muted-foreground)]">
                          {count}
                        </span>
                      </div>
                      <div className="clay-inset h-2 overflow-hidden rounded-full">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className={`h-full rounded-full ${threatBgClass(t)}`}
                        />
                      </div>
                    </div>
                  );
                })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>System health and live indicators.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="Realtime stream">
              <ConnectionIndicator />
            </Row>
            <Row label="Backend">
              <StatusBadge variant="success" label="Online" pulse />
            </Row>
            <Row label="Model">
              <StatusBadge variant="default" label="RF-DETR" />
            </Row>
            <Button asChild className="mt-2 w-full" variant="default">
              <Link to={ROUTES.live}>
                Start live session
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent = 'default',
  isLoading,
}: {
  icon: typeof Activity;
  label: string;
  value: number | undefined;
  accent?: 'default' | 'destructive' | 'warning' | 'success';
  isLoading?: boolean;
}) {
  const accentColor: Record<typeof accent, string> = {
    default: 'text-[color:var(--color-foreground)]',
    destructive: 'text-[color:var(--color-destructive)]',
    warning: 'text-[color:var(--color-warning)]',
    success: 'text-[color:var(--color-success)]',
  };
  const glow: Record<typeof accent, string> = {
    default: '',
    destructive: 'glow-destructive',
    warning: '',
    success: 'glow-success',
  };
  return (
    <Card className={`${glow[accent]} clay-md`}>
      <CardContent className="flex items-start justify-between p-5">
        <div className="space-y-1.5">
          <p className="text-xs uppercase tracking-wider text-[color:var(--color-muted-foreground)]">
            {label}
          </p>
          {isLoading || value == null ? (
            <Skeleton className="h-9 w-20" />
          ) : (
            <p className={`text-3xl font-semibold tabular-nums ${accentColor[accent]}`}>
              {value.toLocaleString()}
            </p>
          )}
        </div>
        <div className="clay-inset flex h-10 w-10 items-center justify-center rounded-xl">
          <Icon className="h-5 w-5 text-[color:var(--color-muted-foreground)]" />
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[color:var(--color-muted-foreground)]">{label}</span>
      {children}
    </div>
  );
}
