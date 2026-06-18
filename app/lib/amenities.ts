export type AmenityItem = { icon: string; name: string };

const DEFAULT_ICON = 'Sparkles';

/** Parse one stored amenity value which may be an object, a JSON string, or a plain string. */
function normalizeIconValue(iconRaw: unknown): string {
  if (typeof iconRaw === 'string' && iconRaw.trim()) {
    return iconRaw.trim();
  }
  if (typeof iconRaw === 'function' && iconRaw.name) {
    return iconRaw.name;
  }
  if (iconRaw && typeof iconRaw === 'object' && 'name' in iconRaw) {
    const name = String((iconRaw as { name?: unknown }).name ?? '').trim();
    if (name) return name;
  }
  return DEFAULT_ICON;
}

export function parseStoredAmenity(raw: unknown): AmenityItem {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const name = String((raw as { name?: unknown }).name ?? '').trim();
    const iconRaw = (raw as { icon?: unknown }).icon;
    const icon = normalizeIconValue(iconRaw);
    return { icon, name };
  }
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (t.startsWith('{') || t.startsWith('[')) {
      try {
        const o = JSON.parse(t) as { icon?: unknown; name?: unknown };
        const name = typeof o?.name === 'string' ? o.name.trim() : '';
        const icon = normalizeIconValue(o?.icon);
        return { icon, name };
      } catch {
        /* fall through */
      }
    }
    return { icon: DEFAULT_ICON, name: t };
  }
  return { icon: DEFAULT_ICON, name: '' };
}

/** Shapes accepted from admin forms or legacy clients. */
export type AmenityPayload = string | { icon?: string; name?: string } | { icon?: unknown; name?: string };

/** Normalize to an array of structured `AmenityItem` suitable for JSON storage. */
export function normalizeAmenitiesForStorage(input: unknown): AmenityItem[] {
  if (!Array.isArray(input)) return [];
  const out: AmenityItem[] = [];
  for (const item of input) {
    if (typeof item === 'string') {
      const parsed = parseStoredAmenity(item);
      if (parsed.name) out.push(parsed);
    } else if (item && typeof item === 'object') {
      const name = String((item as { name?: unknown }).name ?? '').trim();
      if (!name) continue;
      const iconRaw = (item as { icon?: unknown }).icon;
      const icon = normalizeIconValue(iconRaw);
      out.push({ icon, name });
    }
  }
  return out;
}
