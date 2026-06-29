import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { THREAT_META, THREAT_LIST, threatBgClass, threatTextClass } from '@/constants/threats';
import { analyticsService } from '@/services/analytics.service';
import { fmtCount } from '@/utils/format';

export function ThreatCountCard() {
  const distribution = useQuery({
    queryKey: ['analytics', 'distribution'],
    queryFn: analyticsService.distribution,
    refetchInterval: 60_000,
  });

  const counts = distribution.data?.by_threat ?? { Knife: 0, Gun: 0, Explosives: 0, Grenade: 0 };
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Threat count</CardTitle>
        <CardDescription>All-time detections per category.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {distribution.isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)
          : THREAT_LIST.map((t) => {
              const meta = THREAT_META[t];
              const Icon = meta.icon;
              const count = counts[t] ?? 0;
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={t} className="clay-inset rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${threatBgClass(t)}/15`}>
                        <Icon className={`h-4 w-4 ${threatTextClass(t)}`} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{meta.label}</div>
                        <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted-foreground)]">
                          {pct.toFixed(1)}% of all
                        </div>
                      </div>
                    </div>
                    <motion.div
                      key={count}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-right"
                    >
                      <div className="font-mono text-2xl font-semibold tabular-nums">
                        {fmtCount(count)}
                      </div>
                    </motion.div>
                  </div>
                </div>
              );
            })}
      </CardContent>
    </Card>
  );
}