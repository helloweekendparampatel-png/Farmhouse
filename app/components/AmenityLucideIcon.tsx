'use client';

import type { ComponentType } from 'react';
import * as LucideIcons from 'lucide-react';

export function AmenityLucideIcon({ iconName, size = 18 }: { iconName: string; size?: number }) {
  const Icon = (
    LucideIcons as unknown as Record<string, ComponentType<{ size?: number; strokeWidth?: number }>>
  )[iconName];
  if (Icon) return <Icon size={size} strokeWidth={1.75} />;
  return <span className="amenity-icon-fallback">?</span>;
}
