import { Play, Square, RefreshCw, Camera, CameraOff, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWsStore } from '@/stores/wsStore';
import { DetectionSocket } from '@/services/ws.service';
import { cn } from '@/utils/cn';

interface Props {
  streaming: boolean;
  cameraActive: boolean;
  onStart: () => void;
  onStop: () => void;
  onStartCamera: () => void;
  onStopCamera: () => void;
}

export function VideoControls({
  streaming,
  cameraActive,
  onStart,
  onStop,
  onStartCamera,
  onStopCamera,
}: Props) {
  const state = useWsStore((s) => s.state);
  const cancelReconnect = () => DetectionSocket.getInstance().cancelReconnect();

  const wsBusy = state === 'connecting' || state === 'reconnecting';
  const wsOpen = state === 'open';

  return (
    <div className="clay flex flex-wrap items-center gap-2 rounded-2xl p-3">
      {/* Camera control */}
      {!cameraActive ? (
        <Button onClick={onStartCamera} variant="outline" size="sm">
          <Camera className="h-4 w-4" />
          Enable camera
        </Button>
      ) : (
        <Button onClick={onStopCamera} variant="outline" size="sm">
          <CameraOff className="h-4 w-4" />
          Disable camera
        </Button>
      )}

      {/* Stream start/stop */}
      {!streaming ? (
        <Button onClick={onStart} size="sm" disabled={!cameraActive || wsBusy}>
          {wsBusy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting…
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Start detection
            </>
          )}
        </Button>
      ) : (
        <Button onClick={onStop} variant="destructive" size="sm">
          <Square className="h-4 w-4" />
          Stop
        </Button>
      )}

      {/* Reconnect cancel */}
      {state === 'reconnecting' ? (
        <Button onClick={cancelReconnect} variant="ghost" size="sm">
          <RefreshCw className="h-4 w-4" />
          Cancel reconnect
        </Button>
      ) : null}

      <div className="ml-auto flex items-center gap-2 text-xs text-[color:var(--color-muted-foreground)]">
        <span
          className={cn(
            'flex h-2 w-2 rounded-full',
            wsOpen ? 'bg-[color:var(--color-success)]' : wsBusy ? 'bg-[color:var(--color-warning)]' : 'bg-[color:var(--color-muted-foreground)]/40',
          )}
        />
        {wsOpen ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
        <span className="font-mono uppercase tracking-wider">{state}</span>
      </div>
    </div>
  );
}