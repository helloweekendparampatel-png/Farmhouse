/**
 * Extract a human-readable message from API error responses.
 * Handles JSON bodies like `{ "message": "..." }` and plain text.
 */
export function parseApiErrorMessage(text: string, fallback = 'Something went wrong.'): string {
  const trimmed = (text ?? '').trim();
  if (!trimmed) return fallback;

  const looksJson =
    (trimmed.startsWith('{') && trimmed.includes('}')) || trimmed.startsWith('[');
  if (looksJson) {
    try {
      const j = JSON.parse(trimmed) as Record<string, unknown>;
      const msg = j.message;
      if (typeof msg === 'string' && msg.trim()) return msg.trim();
      const err = j.error;
      if (typeof err === 'string' && err.trim()) return err.trim();
      if (Array.isArray(j.errors)) {
        const first = j.errors.find((x): x is string => typeof x === 'string' && !!x.trim());
        if (first) return first.trim();
      }
      return fallback;
    } catch {
      return trimmed.length > 200 ? fallback : trimmed;
    }
  }

  return trimmed.length > 500 ? fallback : trimmed;
}

/** Normalize any thrown value to a short UI string (uses {@link parseApiErrorMessage}). */
export function errorMessageFromUnknown(err: unknown, fallback: string): string {
  const raw =
    err instanceof Error ? err.message : typeof err === 'string' ? err : String(err ?? '');
  return parseApiErrorMessage(raw, fallback);
}
