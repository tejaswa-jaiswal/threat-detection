import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { VideoCard } from '@/components/history/VideoCard';
import { VideoFilters } from '@/components/history/VideoFilters';
import { Pagination } from '@/components/history/Pagination';
import { VideoDetailDialog } from '@/components/history/VideoDetailDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Film } from 'lucide-react';
import { videoService } from '@/services/video.service';
import { useDebounce } from '@/hooks/useDebounce';
import type { ThreatType, Video } from '@/types/domain';

const PAGE_SIZE = 12;

export function History() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('q') ?? '';
  const threat = (searchParams.get('threat') as ThreatType | null) ?? null;
  const page = Number(searchParams.get('page') ?? '1') || 1;

  const debouncedSearch = useDebounce(search, 300);
  const [openVideo, setOpenVideo] = useState<Video | null>(null);

  // Reset to page 1 when filters change.
  useEffect(() => {
    if (page !== 1) {
      setSearchParams((p) => {
        p.set('page', '1');
        return p;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, threat]);

  const list = useQuery({
    queryKey: ['videos', { search: debouncedSearch, threat, page }],
    queryFn: () =>
      videoService.list({
        search: debouncedSearch || undefined,
        threat_type: threat,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      }),
    placeholderData: (prev) => prev,
  });

  const total = list.data?.total ?? 0;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  function setParam<K extends string>(key: K, value: string | null) {
    setSearchParams(
      (p) => {
        if (value == null || value === '') p.delete(key);
        else p.set(key, value);
        return p;
      },
      { replace: true },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="History"
        description="Browse, search, and inspect past detection sessions."
      />

      <Card>
        <CardContent className="p-4">
          <VideoFilters
            search={search}
            onSearch={(s) => setParam('q', s || null)}
            threat={threat}
            onThreat={(t) => setParam('threat', t)}
          />
        </CardContent>
      </Card>

      {list.isError ? (
        <ErrorState
          title="Couldn't load videos"
          message={(list.error as Error)?.message ?? 'Unknown error'}
          onRetry={() => list.refetch()}
        />
      ) : list.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[16/14] w-full" />
          ))}
        </div>
      ) : list.data && list.data.items.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {list.data.items.map((v) => (
                <VideoCard key={v.video_id} video={v} onOpen={setOpenVideo} />
              ))}
            </AnimatePresence>
          </div>

          {totalPages > 1 ? (
            <Card>
              <CardContent className="p-4">
                <Pagination
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={total}
                  onPageChange={(p) => setParam('page', String(p))}
                />
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : (
        <EmptyState
          icon={Film}
          title={search || threat ? 'No matching videos' : 'No recordings yet'}
          description={
            search || threat
              ? 'Try clearing your filters to see more sessions.'
              : 'Start a live detection session to populate history.'
          }
        />
      )}

      <VideoDetailDialog video={openVideo} onOpenChange={(o) => !o && setOpenVideo(null)} />
    </div>
  );
}
