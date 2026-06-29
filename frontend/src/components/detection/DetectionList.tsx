import { AnimatePresence } from 'framer-motion';
import { useWsStore } from '@/stores/wsStore';
import { DetectionCard } from './DetectionCard';
import { EmptyState } from '@/components/common/EmptyState';
import { ScanSearch } from 'lucide-react';

export function DetectionList() {
  const detections = useWsStore((s) => s.detections);

  if (detections.length === 0) {
    return (
      <EmptyState
        icon={ScanSearch}
        title="No detections yet"
        description="Detected threats will appear here in real time. Make sure your camera and detection session are both active."
      />
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {detections.map((d) => (
          <DetectionCard key={d.id} detection={d} />
        ))}
      </AnimatePresence>
    </div>
  );
}
