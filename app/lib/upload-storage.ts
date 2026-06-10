import { S3Client, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

/**
 * Production uploads: set on Render (or any host with ephemeral disk)
 * - S3_UPLOAD_BUCKET — bucket name (required to use S3)
 * - AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY — credentials
 * - AWS_REGION — e.g. ap-south-1 (default ap-south-1)
 * - S3_PUBLIC_BASE_URL — optional; full base for object URLs, e.g.
 *   https://my-bucket.s3.ap-south-1.amazonaws.com or a CloudFront URL.
 *   If omitted, URLs use virtual-hosted style:
 *   https://{bucket}.s3.{region}.amazonaws.com/{key}
 * - S3_ENDPOINT — optional; for S3-compatible APIs (R2, MinIO). When set,
 *   S3_PUBLIC_BASE_URL should be the public URL prefix for GET requests.
 *
 * Optional form field `folder`: photography | decorations | farms — objects are stored under
 * uploads/{folder}/... (S3 key and local path).
 *
 * Local dev: leave S3 unset to write under public/uploads and return /uploads/...
 *
 * Bucket policy must allow public GetObject on the uploads/* prefix (or use a CDN).
 * IAM user/role also needs s3:DeleteObject on uploads/* for removals.
 *
 * For rows still storing `/uploads/...`, set NEXT_PUBLIC_MEDIA_BASE_URL in the Next.js
 * build to the same public object origin (no trailing slash) so the UI resolves them.
 */

const DEFAULT_REGION = 'ap-south-1';

function stripTrailingSlash(s: string) {
  return s.replace(/\/+$/, '');
}

export function useS3Upload(): boolean {
  const bucket = process.env.S3_UPLOAD_BUCKET?.trim();
  const key = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secret = process.env.AWS_SECRET_ACCESS_KEY?.trim();
  return Boolean(bucket && key && secret);
}

function publicObjectUrl(bucket: string, region: string, objectKey: string): string {
  const base = process.env.S3_PUBLIC_BASE_URL?.trim();
  if (base) {
    return `${stripTrailingSlash(base)}/${objectKey}`;
  }
  return `https://${bucket}.s3.${region}.amazonaws.com/${objectKey}`;
}

/** Object keys we ever write (admin uploads). External image URLs won't match. */
export function s3ObjectKeyFromImageUrl(url: string): string | null {
  const u = url.trim();
  if (!u) return null;

  const publicBase = process.env.S3_PUBLIC_BASE_URL?.trim();
  if (publicBase) {
    const base = stripTrailingSlash(publicBase);
    const nu = u.replace(/\/+$/, '');
    if (nu.startsWith(base + '/') || nu === base) {
      const key =
        nu === base ? '' : decodeURIComponent(nu.slice(base.length + 1).replace(/^\/+/, ''));
      return key.startsWith('uploads/') ? key : null;
    }
  }

  if (u.startsWith('/uploads/')) {
    return decodeURIComponent(u.slice(1));
  }

  if (!/^https?:\/\//i.test(u)) return null;

  try {
    const parsed = new URL(u);
    const path = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
    if (!path.startsWith('uploads/')) return null;

    const bucket = process.env.S3_UPLOAD_BUCKET?.trim();
    if (!bucket) return null;
    const region = process.env.AWS_REGION?.trim() || DEFAULT_REGION;
    const expectedHosts = new Set([
      `${bucket}.s3.${region}.amazonaws.com`,
      `${bucket}.s3.amazonaws.com`,
      `${bucket}.s3.dualstack.${region}.amazonaws.com`,
    ]);
    if (expectedHosts.has(parsed.hostname)) return path;

    return null;
  } catch {
    return null;
  }
}

export async function deleteStoredImageFromS3(url: string): Promise<void> {
  if (!useS3Upload()) return;
  const key = s3ObjectKeyFromImageUrl(url);
  if (!key) return;
  const bucket = process.env.S3_UPLOAD_BUCKET!.trim();
  try {
    await getS3Client().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch (err) {
    console.error('[upload-storage] S3 DeleteObject failed', key, err);
  }
}

export async function deleteStoredImagesFromS3(urls: Iterable<string>): Promise<void> {
  const unique = [...new Set([...urls].map((s) => s.trim()).filter(Boolean))];
  await Promise.all(unique.map((u) => deleteStoredImageFromS3(u)));
}

/** URLs that were referenced before an update but not after (safe to remove from S3). */
export function removedImageUrlsAfterPatch(params: {
  oldThumbnailUrl: string | null | undefined;
  oldImageUrls: string[];
  newThumbnailUrl: string | null | undefined;
  /** When undefined, gallery is unchanged (use oldImageUrls). */
  newImageUrls: string[] | undefined;
}): string[] {
  const oldSet = new Set<string>();
  for (const x of params.oldImageUrls) oldSet.add(x);
  if (params.oldThumbnailUrl) oldSet.add(params.oldThumbnailUrl);

  const gallery =
    params.newImageUrls !== undefined ? params.newImageUrls : params.oldImageUrls;
  const newSet = new Set<string>();
  for (const x of gallery) newSet.add(x);
  const newThumb =
    params.newThumbnailUrl !== undefined ? params.newThumbnailUrl : params.oldThumbnailUrl;
  if (newThumb) newSet.add(newThumb);

  return [...oldSet].filter((u) => !newSet.has(u));
}

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    const region = process.env.AWS_REGION?.trim() || DEFAULT_REGION;
    const endpoint = process.env.S3_ENDPOINT?.trim();
    s3Client = new S3Client({
      region,
      ...(endpoint
        ? {
            endpoint,
            forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
          }
        : {}),
    });
  }
  return s3Client;
}

export async function uploadImageToS3(params: {
  body: Buffer;
  contentType: string;
  objectKey: string;
}): Promise<string> {
  const bucket = process.env.S3_UPLOAD_BUCKET!.trim();
  const region = process.env.AWS_REGION?.trim() || DEFAULT_REGION;

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.objectKey,
      Body: params.body,
      ContentType: params.contentType,
    }),
  );

  return publicObjectUrl(bucket, region, params.objectKey);
}
