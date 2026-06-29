import { memo, useEffect, useState } from 'react';
import { Film, AlertOctagon, Calendar, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { videoService } from '@/services/video.service';
import { fmtDateTime } from '@/utils/time';
import { truncate } from '@/utils/format';
import type { Video } from '@/types/domain';

interface Props {
  video: Video;
  onOpen: (video: Video) => void;
}

function VideoCardImpl({ video, onOpen }: Props) {
  const [thumb, setThumb] = useState<string | null>(null);
  const [thumbLoading, setThumbLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setThumbLoading(true);
    videoService
      .thumbnailBlob(video.video_id)
      .then((url) => {
        if (active) {
          setThumb(url);
          setThumbLoading(false);
        }
      })
      .catch(() => {
        if (active) setThumbLoading(false);
      });
    return () => {
      active = false;
    };
  }, [video.video_id]);

  useEffect(() => {
    return () => {
      if (thumb) URL.revokeObjectURL(thumb);
    };
  }, [thumb]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.18 }}
    >
      <Card className="clay-sm overflow-hidden transition-transform hover:-translate-y-0.5 hover:clay-lg">
        <div className="relative aspect-video w-full overflow-hidden bg-[color:var(--color-muted)]/40">
          {thumb ? (
            <img
              src={thumb}
              alt={video.video_name}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
          ) : thumbLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[color:var(--color-muted-foreground)]">
              <Film className="h-8 w-8" />
              <span className="text-xs">No thumbnail</span>
            </div>
          )}
          {video.detection_count > 0 ? (
            <div className="absolute right-2 top-2">
              <Badge variant="destructive" className="gap-1">
                <AlertOctagon className="h-3 w-3" />
                {video.detection_count}
              </Badge>
            </div>
          ) : (
            <div className="absolute right-2 top-2">
              <Badge variant="success" className="gap-1">
                Clean
              </Badge>
            </div>
          )}
          {video.end_time == null ? (
            <div className="absolute left-2 top-2">
              <Badge variant="warning" className="gap-1">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--color-warning)]" />
                Recording
              </Badge>
            </div>
          ) : null}
        </div>
        <CardContent className="space-y-3 p-4">
          <div className="space-y-1">
            <h3 className="truncate text-sm font-semibold" title={video.video_name}>
              {truncate(video.video_name, 48)}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-[color:var(--color-muted-foreground)]">
              <Calendar className="h-3 w-3" />
              {fmtDateTime(video.upload_time)}
            </div>
          </div>
          <Button
            variant="glass"
            size="sm"
            className="w-full"
            onClick={() => onOpen(video)}
          >
            <Eye className="h-3.5 w-3.5" />
            Open
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export const VideoCard = memo(VideoCardImpl);
