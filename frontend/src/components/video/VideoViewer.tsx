import { useEffect, useMemo, useRef } from 'react';
import { Camera, CameraOff, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useFullscreen } from '@/hooks/useFullscreen';
import { cn } from '@/utils/cn';

interface Props {
  /** Reference to the hidden <video> element playing the webcam stream. */
  webcamVideoRef: React.RefObject<HTMLVideoElement | null>;
  /** When non-null, render this annotated JPEG instead of the webcam. */
  annotatedFrame: Blob | null;
  /** Whether the camera has been started. */
  cameraActive: boolean;
  /** Whether we're currently receiving frames (i.e., WS open). */
  streamActive: boolean;
  /** Camera error to display instead of the feed. */
  cameraErrorMessage?: string;
  className?: string;
}

export function VideoViewer({
  webcamVideoRef,
  annotatedFrame,
  cameraActive,
  streamActive,
  cameraErrorMessage,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { isFullscreen, toggle } = useFullscreen(containerRef);
  const frameUrl = useMemo(() => {
    if (!annotatedFrame) return null;
    return URL.createObjectURL(annotatedFrame);
  }, [annotatedFrame]);

  useEffect(() => {
    return () => {
      if (frameUrl) {
        URL.revokeObjectURL(frameUrl);
      }
    };
  }, [frameUrl]);

  const showPlaceholder = !frameUrl || !streamActive;

  return (
    <div
      ref={containerRef}
      className={cn(
        'clay relative aspect-video w-full overflow-hidden rounded-2xl bg-black',
        isFullscreen && 'rounded-none',
        className,
      )}
    >
      {/* The annotated frame */}
      <AnimatePresence mode="wait">
        {frameUrl ? (
          <motion.img
            key={frameUrl}
            src={frameUrl}
            alt="Annotated live feed"
            initial={{ opacity: 0.85 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.08 }}
            className="absolute inset-0 h-full w-full object-contain"
          />
        ) : null}
      </AnimatePresence>

      {/* Placeholder when no frames yet */}
      {showPlaceholder ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[color:var(--color-background)] via-[color:var(--color-card)] to-[color:var(--color-background)] text-center">
          {cameraErrorMessage ? (
            <>
              <div className="clay-inset flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--color-destructive)]/15 text-[color:var(--color-destructive)]">
                <CameraOff className="h-6 w-6" />
              </div>
              <p className="max-w-sm px-6 text-sm text-[color:var(--color-muted-foreground)]">
                {cameraErrorMessage}
              </p>
            </>
          ) : cameraActive ? (
            <>
              <div className="clay-inset flex h-14 w-14 items-center justify-center rounded-2xl text-[color:var(--color-primary)]">
                <Camera className="h-6 w-6" />
              </div>
              <p className="text-sm text-[color:var(--color-muted-foreground)]">
                Waiting for first annotated frame…
              </p>
            </>
          ) : (
            <>
              <div className="clay-inset flex h-14 w-14 items-center justify-center rounded-2xl text-[color:var(--color-muted-foreground)]">
                <CameraOff className="h-6 w-6" />
              </div>
              <p className="text-sm text-[color:var(--color-muted-foreground)]">
                Click <span className="font-medium text-[color:var(--color-foreground)]">Start</span> to
                begin streaming.
              </p>
            </>
          )}
        </div>
      ) : null}

      {/* Hidden offscreen video + capture canvas */}
      <video ref={webcamVideoRef} playsInline muted autoPlay className="hidden" />
      <canvas ref={canvasRef} className="hidden" />

      {/* Floating fullscreen button */}
      <div className="absolute right-3 top-3">
        <Button
          variant="glass"
          size="icon"
          onClick={toggle}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          className="h-9 w-9"
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>

      {/* Scanlines for that surveillance feel (subtle) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, transparent 1px, transparent 3px)',
        }}
      />
    </div>
  );
}
