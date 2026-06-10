'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, Pencil, Trash2, X } from 'lucide-react';
import { FileUploadControl } from '../components/FileUploadControl';
import ConfirmDialog from '../ components/ConfirmDialog';
import { errorMessageFromUnknown } from '../lib/api-errors';
import { useAuth } from '../lib/auth-context';
import { uploadAdminImageFile, uploadAdminImageFiles } from '../lib/admin-image-upload';
import { apiDelete, apiGet, apiPost } from '../lib/backend-api';
import { mediaSrc } from '../lib/media-url';
import { PageIntro, SectionCard, StatCard } from '../ui/admin-ui';

type PhotographyImage = {
  id: string;
  imageUrl: string;
};

type Photo = {
  id: string;
  title: string;
  thumbnailUrl?: string;
  images?: PhotographyImage[];
};

export default function PhotographyPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [title, setTitle] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowDeletingId, setRowDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const thumbPreviewUrl = useMemo(
    () => (thumbnailFile ? URL.createObjectURL(thumbnailFile) : null),
    [thumbnailFile],
  );
  const imagePreviewUrls = useMemo(
    () => imageFiles.map((f) => URL.createObjectURL(f)),
    [imageFiles],
  );

  useEffect(() => {
    return () => {
      if (thumbPreviewUrl) URL.revokeObjectURL(thumbPreviewUrl);
    };
  }, [thumbPreviewUrl]);

  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [imagePreviewUrls]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  const loadPhotos = async (opts?: { bustCache?: boolean }) => {
    if (!token) return;
    try {
      const q = opts?.bustCache ? `?cb=${Date.now()}` : '';
      const data = await apiGet<Photo[]>(`/photography${q}`, token);
      setPhotos(data);
    } catch (err: any) {
      setError(errorMessageFromUnknown(err, 'Failed to load photography'));
    }
  };

  useEffect(() => {
    if (token) {
      void loadPhotos();
    }
  }, [token]);

  const deletePhoto = async () => {
    if (!token || !confirmDeleteId) return;
    setRowDeletingId(confirmDeleteId);
    setError(null);
    const deletedId = confirmDeleteId;
    try {
      await apiDelete(`/photography/${deletedId}`, token);
      setPhotos((prev) => prev.filter((p) => p.id !== deletedId));
      await loadPhotos({ bustCache: true });
      router.refresh();
    } catch (err: unknown) {
      setError(errorMessageFromUnknown(err, 'Failed to delete photography'));
      void loadPhotos({ bustCache: true });
    } finally {
      setRowDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      let finalThumbnailUrl: string | undefined = undefined;
      const finalImageUrls: string[] = [];

      if (thumbnailFile) {
        finalThumbnailUrl = await uploadAdminImageFile(token, thumbnailFile, 'photography');
      }

      if (imageFiles.length > 0) {
        if (imageFiles.length < 10) {
          throw new Error('At least 10 images are required');
        }
        const urls = await uploadAdminImageFiles(token, imageFiles, 'photography');
        finalImageUrls.push(...urls);
      }

      await apiPost<Photo>('/photography', token, {
        title,
        thumbnailUrl: finalThumbnailUrl,
        images: finalImageUrls,
      });
      setTitle('');
      setThumbnailFile(null);
      setImageFiles([]);
      await loadPhotos();
    } catch (err: any) {
      setError(errorMessageFromUnknown(err, 'Failed to create photography'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  const isAdmin = user.role === 'ADMIN';

  return (
    <div className="page">
      <PageIntro
        eyebrow="Media"
        title="Photography library"
        description="Register standalone visual assets with multi-image support."
      />
      {error && <div className="error-banner">{error}</div>}
      <div className="stat-grid">
        <StatCard
          label="Photo entries"
          value={photos.length}
          meta="Current photography rows loaded from the API."
        />
      </div>
      <section className="split-grid">
        <SectionCard title="Create photo" description="Add a standalone media record.">
          <form onSubmit={handleSubmit} className="form-grid">
            <label>
              <span className="field-label">Title</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <div className="form-field">
              <span className="field-label">Thumbnail image</span>
              <FileUploadControl
                accept="image/*"
                prompt="Drop an image or click to browse"
                hint="PNG, JPG, or WebP — used as the cover in lists."
                aria-label="Choose thumbnail image"
                onFilesPicked={(files) => {
                  const f = files[0];
                  if (f) setThumbnailFile(f);
                }}
              />
              {thumbnailFile && thumbPreviewUrl ? (
                <div className="preview-thumb-row">
                  <div className="preview-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbPreviewUrl} alt="" />
                    <button
                      type="button"
                      className="preview-thumb-remove"
                      onClick={() => setThumbnailFile(null)}
                      aria-label="Remove thumbnail"
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="form-field full-width">
              <span className="field-label">Gallery images (min 10)</span>
              <FileUploadControl
                multiple
                accept="image/*"
                prompt="Add images — click or drop"
                hint="Select multiple files; you can add more in batches. At least 10 total required."
                aria-label="Choose gallery images"
                onFilesPicked={(picked) =>
                  setImageFiles((prev) => {
                    const keys = new Set(prev.map((f) => `${f.name}-${f.size}`));
                    const next = [...prev];
                    for (const f of picked) {
                      const k = `${f.name}-${f.size}`;
                      if (!keys.has(k)) {
                        keys.add(k);
                        next.push(f);
                      }
                    }
                    return next;
                  })
                }
              />
              {imageFiles.length > 0 ? (
                <>
                  <p className="field-hint" style={{ marginTop: '0.35rem' }}>
                    {imageFiles.length} image{imageFiles.length === 1 ? '' : 's'} selected — use × to
                    remove.
                  </p>
                  <div className="preview-thumb-row">
                    {imageFiles.map((file, i) => (
                      <div
                        key={`${file.name}-${file.size}-${i}`}
                        className="preview-thumb"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imagePreviewUrls[i]} alt="" />
                        <button
                          type="button"
                          className="preview-thumb-remove"
                          onClick={() => setImageFiles((prev) => prev.filter((_, idx) => idx !== i))}
                          aria-label={`Remove ${file.name}`}
                        >
                          <X size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
            <div className="full-width farm-row-actions">
              <button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create photo'}
              </button>
            </div>
          </form>
        </SectionCard>
        <SectionCard
          title="Usage note"
          description="Photography is now a standalone module independent of farm IDs."
        >
          <div className="empty-panel">
            <h3>Visual Management</h3>
            <p>
              Provides robust file upload capabilities and local preview previews out of the box.
            </p>
          </div>
        </SectionCard>
      </section>

      <SectionCard title="Existing photos" description="A structured list of photography records.">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Thumbnail</th>
                <th>Total Images</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {photos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-state">
                    No photos found.
                  </td>
                </tr>
              ) : (
                photos.map((p) => (
                  <tr key={p.id}>
                    <td className="cell-title">{p.title}</td>
                    <td className="cell-subtle">
                      {p.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={mediaSrc(p.thumbnailUrl)}
                          alt="thumbnail"
                          style={{ height: 40, width: 40, objectFit: 'cover' }}
                        />
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{p.images?.length ?? 0}</td>
                    <td className="table-actions-cell">
                      <div className="table-actions">
                        <Link
                          href={`/photography/${p.id}`}
                          className="table-action-btn"
                          title="View entry"
                          aria-label="View entry"
                          prefetch
                        >
                          <Eye size={16} strokeWidth={2.25} />
                        </Link>
                        {isAdmin ? (
                          <>
                            <Link
                              href={`/photography/${p.id}/edit`}
                              className="table-action-btn"
                              title="Edit entry"
                              aria-label="Edit entry"
                              prefetch
                            >
                              <Pencil size={16} strokeWidth={2.25} />
                            </Link>
                            <button
                              type="button"
                              className="table-action-btn table-action-btn--danger"
                              title="Delete entry"
                              aria-label="Delete entry"
                              onClick={() => setConfirmDeleteId(p.id)}
                            >
                              <Trash2 size={16} strokeWidth={2.25} />
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <ConfirmDialog
        open={!!confirmDeleteId}
        title="Delete photography entry"
        description="This removes the library entry and its images from the system. This cannot be undone."
        confirmText="Delete"
        loading={rowDeletingId === confirmDeleteId}
        onConfirm={deletePhoto}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
