export type AmenityItem = { icon: string; name: string };

const DEFAULT_ICON = 'Sparkles';

/** Parse one DB row: JSON `{icon,name}` or legacy plain text. */
export function parseStoredAmenity(raw: string): AmenityItem {
  const t = raw.trim();
  if (t.startsWith('{')) {
    try {
      const o = JSON.parse(t) as { icon?: unknown; name?: unknown };
      if (o && typeof o.name === 'string' && o.name.trim()) {
        return {
          icon: typeof o.icon === 'string' && o.icon.trim() ? o.icon.trim() : DEFAULT_ICON,
          name: o.name.trim(),
        };
      }
    } catch {
      /* fall through */
    }
  }
  if (t) return { icon: DEFAULT_ICON, name: t };
  return { icon: DEFAULT_ICON, name: '' };
}

/** Shapes accepted from admin forms or legacy clients. */
export type AmenityPayload = string | { icon?: string; name?: string };

/** Normalize to Prisma `String[]`: JSON strings for structured rows, plain strings preserved. */
export function normalizeAmenitiesForStorage(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const out: string[] = [];
  for (const item of input) {
    if (typeof item === 'string') {
      const s = item.trim();
      if (s) out.push(s);
    } else if (item && typeof item === 'object') {
      const name = String((item as { name?: string }).name ?? '').trim();
      if (!name) continue;
      const iconRaw = (item as { icon?: string }).icon;
      const icon = typeof iconRaw === 'string' && iconRaw.trim() ? iconRaw.trim() : DEFAULT_ICON;
      out.push(JSON.stringify({ icon, name }));
    }
  }
  return out;
}
