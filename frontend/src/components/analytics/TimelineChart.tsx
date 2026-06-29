import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { analyticsService } from '@/services/analytics.service';
import { format, parseISO } from 'date-fns';
import { useChartTheme } from './useChartTheme';
import { THREAT_LIST } from '@/constants/threats';

export function TimelineChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'timeline', { bucket: 'hour', hours: 24 }],
    queryFn: () => analyticsService.timeline({ bucket: 'hour', hours: 24 }),
    refetchInterval: 60_000,
  });
  const theme = useChartTheme();

  const rows =
    data?.items.map((b) => ({
      label: format(parseISO(b.ts), 'HH:mm'),
      Knife: b.Knife,
      Gun: b.Gun,
      Explosives: b.Explosives,
      Grenade: b.Grenade,
    })) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detection timeline</CardTitle>
        <CardDescription>Hourly detections over the last 24 hours, by category.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-72 w-full" />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
                <defs>
                  {THREAT_LIST.map((t, i) => (
                    <linearGradient key={t} id={`grad-${t}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={theme.palette[i]} stopOpacity={0.5} />
                      <stop offset="100%" stopColor={theme.palette[i]} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid stroke={theme.border} strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke={theme.muted}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                />
                <YAxis
                  stroke={theme.muted}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  width={32}
                />
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
                  wrapperStyle={{ color: theme.muted, fontSize: 12 }}
                />
                {THREAT_LIST.map((t, i) => (
                  <Area
                    key={t}
                    type="monotone"
                    dataKey={t}
                    stackId="1"
                    stroke={theme.palette[i]}
                    strokeWidth={2}
                    fill={`url(#grad-${t})`}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}