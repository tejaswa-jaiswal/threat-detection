import { memo } from 'react';
import { motion } from 'framer-motion';
import { THREAT_META, threatBgClass, threatTextClass } from '@/constants/threats';
import { Badge } from '@/components/ui/badge';
import { fmtConfidence, fmtRelative } from '@/utils/format';
import type { LiveDetection } from '@/stores/wsStore';

interface Props {
  detection: LiveDetection;
}

function DetectionCardImpl({ detection }: Props) {
  const meta = THREAT_META[detection.threat_type];
  const Icon = meta.icon;
  const isHigh = detection.confidence >= 0.7;
  const ts = new Date(detection.ts);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className="clay group flex items-center gap-3 rounded-xl p-3"
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${threatBgClass(detection.threat_type)}/15`}>
        <Icon className={`h-4 w-4 ${threatTextClass(detection.threat_type)}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold">{meta.label}</span>
          {isHigh ? (
            <Badge variant="destructive" className="text-[10px]">
              High
            </Badge>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-2 text-[11px] text-[color:var(--color-muted-foreground)]">
          <span className="font-mono">{fmtConfidence(detection.confidence)}</span>
          <span className="font-mono">{fmtRelative(ts.toISOString())}</span>
        </div>
      </div>
    </motion.div>
  );
}

export const DetectionCard = memo(DetectionCardImpl);
