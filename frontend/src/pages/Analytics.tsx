import { Suspense, lazy } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { CardSkeleton } from '@/components/common/LoadingSkeleton';
import { AnalyticsSummaryCards } from '@/components/analytics/AnalyticsSummaryCards';
import { ThreatCountCard } from '@/components/analytics/ThreatCountCard';
import { ThreatDistributionChart } from '@/components/analytics/ThreatDistributionChart';
import { RecentDetectionsList } from '@/components/analytics/RecentDetectionsList';

// Recharts and charts are heavy — load them only when this route mounts.
const TimelineChart = lazy(() =>
  import('@/components/analytics/TimelineChart').then((m) => ({ default: m.TimelineChart })),
);
const TrendsChart = lazy(() =>
  import('@/components/analytics/TrendsChart').then((m) => ({ default: m.TrendsChart })),
);

export function Analytics() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Visual summaries of detection activity across all sessions."
      />

      <AnalyticsSummaryCards />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<CardSkeleton className="h-72" />}>
            <TimelineChart />
          </Suspense>
        </div>
        <ThreatCountCard />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<CardSkeleton className="h-64" />}>
            <TrendsChart />
          </Suspense>
        </div>
        <RecentDetectionsList limit={8} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ThreatDistributionChart />
      </div>
    </div>
  );
}