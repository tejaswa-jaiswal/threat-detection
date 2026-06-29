import { useWsStore } from '@/stores/wsStore';
import { StatusBadge, type StatusVariant } from './StatusBadge';

interface Props {
  className?: string;
}

export function ConnectionIndicator({ className }: Props) {
  const state = useWsStore((s) => s.state);
  const attempt = useWsStore((s) => s.attempt);
  const lastError = useWsStore((s) => s.lastError);

  let variant: StatusVariant = 'secondary';
  let label = 'Disconnected';
  let pulse = false;

  if (state === 'connecting') {
    variant = 'warning';
    label = 'Connecting…';
  } else if (state === 'open') {
    variant = 'success';
    label = 'Live';
    pulse = true;
  } else if (state === 'reconnecting') {
    variant = 'warning';
    label = `Reconnecting (${attempt})`;
  } else if (lastError) {
    variant = 'destructive';
    label = 'Error';
  }

  return (
    <StatusBadge variant={variant} label={label} pulse={pulse} className={className} />
  );
}