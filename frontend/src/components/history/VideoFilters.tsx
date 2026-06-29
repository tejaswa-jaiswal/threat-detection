import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { THREAT_LIST, THREAT_META, threatBgClass, threatTextClass } from '@/constants/threats';
import { cn } from '@/utils/cn';
import type { ThreatType } from '@/types/domain';

interface Props {
  search: string;
  onSearch: (s: string) => void;
  threat: ThreatType | null;
  onThreat: (t: ThreatType | null) => void;
}

export function VideoFilters({ search, onSearch, threat, onThreat }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[16rem] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-muted-foreground)]" />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search by name…"
          className="pl-9"
          aria-label="Search videos"
        />
        {search ? (
          <button
            type="button"
            onClick={() => onSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-[color:var(--color-muted-foreground)] hover:bg-[color:var(--color-muted)]/40"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <FilterChip active={threat == null} onClick={() => onThreat(null)} label="All" />
        {THREAT_LIST.map((t) => {
          const meta = THREAT_META[t];
          const active = threat === t;
          return (
            <FilterChip
              key={t}
              active={active}
              onClick={() => onThreat(active ? null : t)}
              label={meta.label}
              dotClass={cn(threatBgClass(t), threatTextClass(t))}
            />
          );
        })}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  dotClass,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  dotClass?: string;
}) {
  return (
    <Button
      variant={active ? 'default' : 'outline'}
      size="sm"
      onClick={onClick}
      className="h-9"
    >
      {dotClass ? <span className={cn('h-2 w-2 rounded-full', dotClass)} /> : null}
      {label}
    </Button>
  );
}