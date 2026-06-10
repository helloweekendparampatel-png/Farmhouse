/** Shorten text for dense tables; full copy belongs on detail pages. */
export function truncateForList(value: string | null | undefined, maxLen: number): string {
  const s = value?.trim();
  if (!s) return '—';
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen)}...`;
}

export function isTruncatedInList(value: string | null | undefined, maxLen: number): boolean {
  const s = value?.trim();
  return !!s && s.length > maxLen;
}
