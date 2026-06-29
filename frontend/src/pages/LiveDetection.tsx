import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ScanLine } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { VideoViewer } from '@/components/video/VideoViewer';
import { VideoControls } from '@/components/video/VideoControls';
import { DetectionList } from '@/components/detection/DetectionList';
import { ConnectionIndicator } from '@/components/common/ConnectionIndicator';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useWebcam } from '@/hooks/useWebcam';
import { useWebSocketSession } from '@/hooks/useWebSocket';
import { useWsStore } from '@/stores/wsStore';
import { fmtCount, fmtTime } from '@/utils/format';
import { fmtUptime } from '@/utils/time';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { DetectionSocket } from '@/services/ws.service';

export function LiveDetection() {
  const [streaming, setStreaming] = useState(false);
  const [annotatedFrame, setAnnotatedFrame] = useState<Blob | null>(null);
  const [videoName, setVideoName] = useState<string | null>(null);
  const loopStopRef = useRef<(() => void) | null>(null);

  const {
    videoRef,
    canvasRef,
    state: camState,
    error: camError,
    start: startCam,
    stop: stopCam,
    startCaptureLoop,
  } = useWebcam({ width: 1280, height: 720, fps: 10, quality: 0.8 });

  const state = useWsStore((s) => s.state);
  const stats = useWsStore((s) => s.stats);
  const user = useAuthStore((s) => s.user);
  const startedAt = useWsStore((s) => s.startedAt);

  // Subscribe to the WS session when videoName is set.
  useWebSocketSession({
    videoName: streaming ? videoName : null,
    onFrame: setAnnotatedFrame,
  });

  // Start the webcam-capture loop only when actively streaming.
  useEffect(() => {
    if (!streaming) return;
    const sock = DetectionSocket.getInstance();
    const stop = startCaptureLoop((blob) => {
      if (!blob) return;
      sock.sendFrame(blob);
    });
    loopStopRef.current = stop;
    return () => {
      stop();
      loopStopRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streaming]);

  const onStart = useCallback(async () => {
    if (camState !== 'streaming') {
      toast.error('Enable the camera first');
      return;
    }
    const name =
      (user?.name ? `${user.name}-` : 'session-') +
      new Date().toISOString().replace(/[:.]/g, '-');
    setVideoName(name);
    setStreaming(true);
  }, [camState, user]);

  const onStop = useCallback(() => {
    setStreaming(false);
    setAnnotatedFrame(null);
    setVideoName(null);
  }, []);

  const streamActive = state === 'open' && annotatedFrame != null;
  const cameraErrorMessage = camError
    ? camError.kind === 'NotAllowedError'
      ? 'Camera permission denied. Please allow camera access in your browser settings.'
      : camError.kind === 'NotFoundError'
        ? 'No camera was found on this device.'
        : camError.kind === 'NotReadableError'
          ? 'Camera is in use by another application.'
          : camError.message
    : undefined;

  return (
    <div className="flex h-full flex-col gap-4">
      <PageHeader
        title="Live Detection"
        description="Stream your camera through RF-DETR inference in real time."
        actions={<ConnectionIndicator />}
      />

      <div className="grid flex-1 gap-4 xl:grid-cols-[1fr_360px]">
        {/* Left: video */}
        <div className="flex min-w-0 flex-col gap-3">
          <VideoViewer
            webcamVideoRef={videoRef}
            annotatedFrame={annotatedFrame}
            cameraActive={camState === 'streaming'}
            streamActive={streamActive}
            cameraErrorMessage={cameraErrorMessage}
          />
          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
          <VideoControls
            streaming={streaming}
            cameraActive={camState === 'streaming'}
            onStart={onStart}
            onStop={onStop}
            onStartCamera={async () => {
              await startCam();
            }}
            onStopCamera={() => stopCam()}
          />
          <SessionMetrics startedAt={startedAt} stats={stats} />
        </div>

        {/* Right: detections */}
        <div className="flex flex-col gap-3">
          <Card className="flex flex-col overflow-hidden">
            <CardHeader className="border-b border-[color:var(--color-border)]/60">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ScanLine className="h-4 w-4 text-[color:var(--color-primary)]" />
                    Live detections
                  </CardTitle>
                  <p className="mt-1 text-xs text-[color:var(--color-muted-foreground)]">
                    Threats detected in the current session.
                  </p>
                </div>
                <StatusBadge
                  variant={state === 'open' ? 'success' : 'secondary'}
                  label={state === 'open' ? 'Live' : 'Idle'}
                  pulse={state === 'open'}
                />
              </div>
            </CardHeader>
            <CardContent className="max-h-[640px] flex-1 overflow-y-auto p-3">
              <DetectionList />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom: AI chat */}
      <Card className="flex h-[420px] flex-col overflow-hidden">
        <ChatWindow />
      </Card>
    </div>
  );
}

function SessionMetrics({
  startedAt,
  stats,
}: {
  startedAt: number | null;
  stats: { framesSent: number; framesReceived: number; fpsIn: number; fpsOut: number };
}) {
  const [_now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!startedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Metric label="Session" value={startedAt ? fmtTime(new Date(startedAt).toISOString()) : '—'} />
      <Metric
        label="Uptime"
        value={startedAt ? fmtUptime((Date.now() - startedAt) / 1000) : '—'}
      />
      <Metric label="Frames in" value={`${fmtCount(stats.framesReceived)} (${stats.fpsIn} fps)`} />
      <Metric label="Frames out" value={`${fmtCount(stats.framesSent)} (${stats.fpsOut} fps)`} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="clay-inset rounded-xl px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted-foreground)]">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-sm tabular-nums">{value}</div>
    </div>
  );
}
