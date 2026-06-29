/**
 * Threat metadata. Centralized so the UI (icons, colors, labels) never drifts
 * from backend enums in `db.schemas.THREAT_TYPES`.
 */

import {
  Bomb,
  Crosshair,
  Flame,
  type LucideIcon,
  PocketKnife,
} from 'lucide-react';
import type { ThreatType } from '@/types/domain';

export interface ThreatMeta {
  type: ThreatType;
  label: string;
  icon: LucideIcon;
  /** CSS variable suffix for the threat color (defined in globals.css). */
  colorVar: 'threat-knife' | 'threat-gun' | 'threat-explosives' | 'threat-grenade';
  /** Short description for tooltips / accessible labels. */
  description: string;
}

export const THREAT_META: Record<ThreatType, ThreatMeta> = {
  Knife: {
    type: 'Knife',
    label: 'Knife',
    icon: PocketKnife,
    colorVar: 'threat-knife',
    description: 'Bladed weapon',
  },
  Gun: {
    type: 'Gun',
    label: 'Gun',
    icon: Crosshair,
    colorVar: 'threat-gun',
    description: 'Firearm',
  },
  Explosives: {
    type: 'Explosives',
    label: 'Explosives',
    icon: Flame,
    colorVar: 'threat-explosives',
    description: 'Explosive device',
  },
  Grenade: {
    type: 'Grenade',
    label: 'Grenade',
    icon: Bomb,
    colorVar: 'threat-grenade',
    description: 'Grenade',
  },
};

export const THREAT_LIST: ThreatType[] = ['Gun', 'Knife', 'Explosives', 'Grenade'];

/** Pull a Tailwind class referring to a threat color. */
export function threatTextClass(t: ThreatType): string {
  return `text-[color:var(--color-${THREAT_META[t].colorVar})]`;
}
export function threatBgClass(t: ThreatType): string {
  return `bg-[color:var(--color-${THREAT_META[t].colorVar})]`;
}
export function threatBorderClass(t: ThreatType): string {
  return `border-[color:var(--color-${THREAT_META[t].colorVar})]`;
}