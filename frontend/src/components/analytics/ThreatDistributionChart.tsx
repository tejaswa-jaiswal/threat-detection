import { useQuery } from '@tanstack/react-query';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { analyticsService } from '@/services/analytics.service';
import { THREAT_META } from '@/constants/threats';
import { useChartTheme } from './useChartTheme';

export function ThreatDistributionChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'distribution'],
    queryFn: analyticsService.distribution,
  });
  const theme = useChartTheme();

  const rows = data
    ? (Object.entries(data.by_threat) as Array<[keyof typeof THREAT_META, number]>)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({ name: THREAT_META[k].label, value: v, key: k }))
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Threat distribution</CardTitle>
        <CardDescription>Share of detections by category.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : rows.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-[color:var(--color-muted-foreground)]">
            No data yet
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rows}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={55}
                  paddingAngle={3}
                  stroke="var(--color-background)"
                  strokeWidth={2}
                >
                  {rows.map((r, i) => (
                    <Cell
                      key={r.key}
                      fill={theme.palette[i % theme.palette.length] ?? theme.palette[0]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: theme.card,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 12,
                    color: theme.text,
                    fontSize: 12,
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ color: theme.muted, fontSize: 12, paddingTop: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}