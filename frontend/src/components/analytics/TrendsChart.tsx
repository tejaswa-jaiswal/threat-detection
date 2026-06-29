import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { analyticsService } from '@/services/analytics.service';
import { format, parseISO } from 'date-fns';
import { useChartTheme } from './useChartTheme';

export function TrendsChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'trends', 14],
    queryFn: () => analyticsService.trends(14),
    refetchInterval: 5 * 60_000,
  });
  const theme = useChartTheme();

  const rows = data?.items ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detection trends</CardTitle>
        <CardDescription>Daily totals over the last 14 days.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
                <CartesianGrid stroke={theme.border} strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke={theme.muted}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tickFormatter={(d: string) => format(parseISO(d), 'MMM d')}
                />
                <YAxis
                  stroke={theme.muted}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  width={32}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: theme.card,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 12,
                    color: theme.text,
                    fontSize: 12,
                  }}
                  labelFormatter={(l: string) => format(parseISO(l), 'EEEE, MMM d')}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={theme.ring}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: theme.ring, stroke: theme.ring }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}