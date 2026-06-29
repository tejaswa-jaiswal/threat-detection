/**
 * Settings — profile (read-only), backend status, model info, connection info,
 * system info. Theme toggle removed from v1 (single dark theme).
 */
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Cpu,
  Eye,
  Mail,
  Server,
  ShieldCheck,
  User as UserIcon,
  Hash,
  Gauge,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/layout/PageHeader';
import { ConnectionIndicator } from '@/components/common/ConnectionIndicator';
import { useAuthStore } from '@/stores/authStore';
import { useWsStore } from '@/stores/wsStore';
import { systemService } from '@/services/system.service';
import { config } from '@/constants/config';
import { fmtUptime } from '@/utils/time';
import { fmtDateTime } from '@/utils/time';

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserIcon;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex items-center gap-2 text-sm text-[color:var(--color-muted-foreground)]">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="font-mono text-sm">{value ?? '—'}</div>
    </div>
  );
}

function ProfileCard() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserIcon className="h-4 w-4" />
          Profile
        </CardTitle>
        <CardDescription>Your account details (read-only).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <InfoRow icon={UserIcon} label="Name" value={user.name} />
        <InfoRow icon={Mail} label="Email" value={user.email} />
        <InfoRow
          icon={ShieldCheck}
          label="Role"
          value={<span className="capitalize">{user.role}</span>}
        />
        <InfoRow icon={Hash} label="User ID" value={user.id} />
        <InfoRow icon={Activity} label="Member since" value={fmtDateTime(user.created_at)} />
      </CardContent>
    </Card>
  );
}

function BackendCard() {
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [pinging, setPinging] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const measure = async () => {
    setPinging(true);
    setLastError(null);
    const t0 = performance.now();
    try {
      const r = await fetch(`${config.apiUrl}/health`, { credentials: 'omit' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setLatencyMs(Math.round(performance.now() - t0));
    } catch (err) {
      setLastError(err instanceof Error ? err.message : 'Ping failed');
      setLatencyMs(null);
    } finally {
      setPinging(false);
    }
  };

  useEffect(() => {
    void measure();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-4 w-4" />
          Backend
        </CardTitle>
        <CardDescription>Connection to the FastAPI server.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <InfoRow
          icon={Server}
          label="API URL"
          value={<span className="break-all text-xs">{config.apiUrl}</span>}
        />
        <InfoRow
          icon={Eye}
          label="WebSocket URL"
          value={<span className="break-all text-xs">{config.wsUrl}</span>}
        />
        <InfoRow
          icon={Activity}
          label="Health"
          value={
            lastError ? (
              <span className="text-[color:var(--color-destructive)]">{lastError}</span>
            ) : latencyMs == null ? (
              <span className="text-[color:var(--color-muted-foreground)]">…</span>
            ) : (
              <span className="text-[color:var(--color-chart-2)]">OK · {latencyMs} ms</span>
            )
          }
        />
        <div className="flex justify-end pt-2">
          <button
            onClick={measure}
            disabled={pinging}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-[color:var(--color-muted-foreground)] transition-colors hover:text-[color:var(--color-foreground)] disabled:opacity-50"
          >
            {pinging ? 'Pinging…' : 'Re-test'}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function ModelCard() {
  const { data, isLoading } = useQuery({
    queryKey: ['system', 'info'],
    queryFn: systemService.info,
    refetchInterval: 60_000,
  });

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            Model
          </CardTitle>
          <CardDescription>Inference configuration.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-4 w-4" />
          Model
        </CardTitle>
        <CardDescription>Inference configuration.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <InfoRow
          icon={Cpu}
          label="Weights"
          value={<span className="text-xs">{data.model.weights}</span>}
        />
        <InfoRow icon={Gauge} label="Resolution" value={`${data.model.resolution}px`} />
        <InfoRow icon={Gauge} label="Threshold" value={data.model.threshold.toFixed(2)} />
        <InfoRow icon={Gauge} label="Video FPS" value={data.model.video_fps} />
        <InfoRow icon={Gauge} label="JPEG quality" value={data.model.jpeg_quality} />
        <Separator className="my-2" />
        <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted-foreground)]">
          Threats
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {data.threats.map((t) => (
            <span
              key={t.id}
              className="rounded-lg bg-[color:var(--color-card)] px-2 py-1 font-mono text-xs"
            >
              {t.enum}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ConnectionCard() {
  const wsState = useWsStore((s) => s.state);
  const attempt = useWsStore((s) => s.attempt);
  const startedAt = useWsStore((s) => s.startedAt);
  const lastError = useWsStore((s) => s.lastError);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          WebSocket connection
        </CardTitle>
        <CardDescription>Live state of the detection socket.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[color:var(--color-muted-foreground)]">State</span>
          <ConnectionIndicator />
        </div>
        <InfoRow icon={Activity} label="Reconnect attempts" value={attempt} />
        <InfoRow
          icon={Activity}
          label="Session started"
          value={startedAt ? fmtDateTime(new Date(startedAt).toISOString()) : '—'}
        />
        {lastError && (
          <InfoRow
            icon={Activity}
            label="Last error"
            value={<span className="text-[color:var(--color-destructive)]">{lastError}</span>}
          />
        )}
        <div className="rounded-lg bg-[color:var(--color-card)] p-3 font-mono text-[11px] leading-relaxed text-[color:var(--color-muted-foreground)]">
          subprotocol: <span className="text-[color:var(--color-foreground)]">"{config.wsSubprotocol}"</span>
          {'\n'}state: <span className="text-[color:var(--color-foreground)]">{wsState}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function SystemCard() {
  const { data, isLoading } = useQuery({
    queryKey: ['system', 'info'],
    queryFn: systemService.info,
    refetchInterval: 30_000,
  });

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            System
          </CardTitle>
          <CardDescription>Backend runtime metrics.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-4 w-4" />
          System
        </CardTitle>
        <CardDescription>Backend runtime metrics.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        <InfoRow icon={Server} label="Server version" value={data.server.version} />
        <InfoRow icon={Hash} label="API version" value={data.server.api} />
        <InfoRow
          icon={Activity}
          label="Uptime"
          value={
            <motion.span
              key={data.server.uptime_seconds}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
            >
              {fmtUptime(data.server.uptime_seconds)}
            </motion.span>
          }
        />
      </CardContent>
    </Card>
  );
}

export function Settings() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Profile, backend connection, model configuration, and system metrics."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ProfileCard />
        <BackendCard />
        <ModelCard />
        <ConnectionCard />
        <SystemCard />
      </div>
    </div>
  );
}