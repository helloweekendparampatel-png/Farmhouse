/**
 * DB may store `/uploads/...` (relative). On Render that path hits the web app, not durable storage.
 * Set NEXT_PUBLIC_MEDIA_BASE_URL to your public object base (no trailing slash), e.g.
 * https://your-bucket.s3.ap-south-1.amazonaws.com
 * so `/uploads/abc.jpg` becomes a full URL to the same object key in S3.
 * Full http(s) URLs from the API are returned unchanged.
 */
const raw = process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.trim() ?? '';
const MEDIA_BASE = raw.replace(/\/+$/, '');

export function mediaSrc(href: string | null | undefined): string {
  if (href == null || href === '') return '';
  const h = href.trim();
  if (/^https?:\/\//i.test(h)) return h;
  if (MEDIA_BASE && h.startsWith('/uploads/')) return `${MEDIA_BASE}${h}`;
  return h;
}
