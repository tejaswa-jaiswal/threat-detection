import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, AlertOctagon, Image as ImageIcon, Download, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { videoService } from '@/services/video.service';
import { config } from '@/constants/config';
import { fmtDateTime, fmtRelative } from '@/utils/time';
import { fmtConfidence } from '@/utils/format';
import { THREAT_META, threatTextClass, threatBgClass } from '@/constants/threats';
import type { Video } from '@/types/domain';

interface Props {
  video: Video | null;
  onOpenChange: (open: boolean) => void;
}

export function VideoDetailDialog({ video, onOpenChange }: Props) {
  const detections = useQuery({
    queryKey: ['video', video?.video_id, 'detections'],
    queryFn: () => videoService.listDetections(video!.video_id, { limit: 200 }),
    enabled: !!video,
  });
  const [thumb, setThumb] = useState<string | null>(null);

  useEffect(() => {
    if (!video) {
      setThumb(null);
      return;
    }
    let active = true;
    videoService
      .thumbnailBlob(video.video_id)
      .then((url) => active && setThumb(url))
      .catch(() => active && setThumb(null));
    return () => {
      active = false;
    };
  }, [video]);

  if (!video) return null;

  return (
    <Dialog open={!!video} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="truncate" title={video.video_name}>
            {video.video_name}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              {fmtDateTime(video.upload_time)}
            </span>
            {video.end_time ? (
              <span className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Ended {fmtRelative(video.end_time)}
              </span>
            ) : (
              <Badge variant="warning">Active session</Badge>
            )}
            <span className="flex items-center gap-1.5">
              <AlertOctagon className="h-3 w-3" />
              {video.detection_count} detections
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]">
          <div className="clay-inset overflow-hidden rounded-xl">
            <div className="relative aspect-video w-full bg-[color:var(--color-muted)]/40">
              {thumb ? (
                <img src={thumb} alt="Detection thumbnail" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-[color:var(--color-muted-foreground)]">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}
            </div>
          </div>

          <ScrollArea className="clay-inset h-64 rounded-xl p-2">
            {detections.isLoading ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : detections.data?.items.length ? (
              <ul className="space-y-1">
                {detections.data.items.map((d) => {
                  const meta = THREAT_META[d.threat_type];
                  const Icon = meta.icon;
                  return (
                    <li
                      key={d.id}
                      className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-[color:var(--color-muted)]/40"
                    >
                      <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${threatBgClass(d.threat_type)}/15`}>
                        <Icon className={`h-3.5 w-3.5 ${threatTextClass(d.threat_type)}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{meta.label}</span>
                          <span className="font-mono text-xs text-[color:var(--color-muted-foreground)]">
                            {fmtConfidence(d.confidence)}
                          </span>
                        </div>
                        <div className="font-mono text-[11px] text-[color:var(--color-muted-foreground)]">
                          {fmtDateTime(d.timestamp)}
                        </div>
                      </div>
                      <Button asChild variant="ghost" size="icon" aria-label="Open image">
                        <a
                          href={`${config.apiUrl}/videos/${video.video_id}/thumbnail`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex h-full items-center justify-center p-4 text-sm text-[color:var(--color-muted-foreground)]">
                No detections recorded for this session.
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}