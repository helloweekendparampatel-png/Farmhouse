'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { FileUploadControl } from '../../../components/FileUploadControl';
import { errorMessageFromUnknown } from '../../../lib/api-errors';
import { useAuth } from '../../../lib/auth-context';
import { uploadAdminImageFile, uploadAdminImageFiles } from '../../../lib/admin-image-upload';
import { apiGet, apiPatch } from '../../../lib/backend-api';
import { mediaSrc } from '../../../lib/media-url';
import { HeaderLink, PageIntro, SectionCard } from '../../../ui/admin-ui';

type DecorationImage = { id: string; imageUrl: string };

type DecorationDetail = {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
  images?: DecorationImage[];
};

export default function EditDecorationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const [loaded, setLoaded] = useState<DecorationDetail | null>(null);
  const [title, setTitle] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbRemoved, setThumbRemoved] = useState(false);
  const [newThumbFile, setNewThumbFile] = useState<File | null>(null);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const newThumbPreview = useMemo(
    () => (newThumbFile ? URL.createObjectURL(newThumbFile) : null),
    [newThumbFile],
  );
  const newGalleryPreviews = useMemo(
    () => newGalleryFiles.map((f) => URL.createObjectURL(f)),
    [newGalleryFiles],
  );

  useEffect(() => {
    return () => {
      if (newThumbPreview) URL.revokeObjectURL(newThumbPreview);
    };
  }, [newThumbPreview]);

  useEffect(() => {
    return () => {
      newGalleryPreviews.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [newGalleryPreviews]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && user && user.role !== 'ADMIN') {
      router.replace('/decorations');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setError(null);
      try {
        const data = await apiGet<DecorationDetail>(`/decorations/${params.id}`, token);
        setLoaded(data);
        setTitle(data.title);
        setThumbnailUrl(data.thumbnailUrl ?? null);
        setGalleryUrls(data.images?.map((i) => i.imageUrl) ?? []);
        setThumbRemoved(false);
        setNewThumbFile(null);
        setNewGalleryFiles([]);
      } catch (err: unknown) {
        setError(errorMessageFromUnknown(err, 'Failed to load decoration'));
      }
    };
    void load();
  }, [token, params.id]);

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      let mergedUrls = [...galleryUrls];
      if (newGalleryFiles.length > 0) {
        const newUrls = await uploadAdminImageFiles(token, newGalleryFiles, 'decorations');
        mergedUrls = [...mergedUrls, ...newUrls];
      }

      if (mergedUrls.length > 0 && mergedUrls.length < 10) {
        throw new Error('At least 10 gallery images are required when the gallery is not empty');
      }

      const body: {
        title: string;
        images: string[];
        thumbnailUrl?: string | null;
      } = { title, images: mergedUrls };

      if (newThumbFile) {
        body.thumbnailUrl = await uploadAdminImageFile(token, newThumbFile, 'decorations');
      } else if (thumbRemoved) {
        body.thumbnailUrl = null;
      }

      await apiPatch<DecorationDetail>(`/decorations/${params.id}`, token, body);

      router.push(`/decorations/${params.id}`);
      router.refresh();
    } catch (err: unknown) {
      setError(errorMessageFromUnknown(err, 'Failed to update decoration'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <PageIntro
        eyebrow="Decoration"
        title="Edit decoration"
        description="Update the title, cover image, and gallery. Replacing the gallery requires at least ten images if any remain."
        actions={<HeaderLink href={`/decorations/${params.id}`}>Back to detail</HeaderLink>}
      />

      {error && <div className="error-banner">{error}</div>}

      {loaded && (
        <SectionCard title="Edit package" description="Save changes to sync with the API.">
          <form onSubmit={handleSubmit} className="form-grid">
            <label className="full-width">
              <span className="field-label">Title</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>

            <div className="form-field full-width">
              <span className="field-label">Cover image</span>
              {!thumbRemoved && !newThumbFile && thumbnailUrl ? (
                <div className="preview-thumb-row">
                  <div className="preview-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={mediaSrc(thumbnailUrl)} alt="" />
                    <button
                      type="button"
                      className="preview-thumb-remove"
                      onClick={() => {
                        setThumbRemoved(true);
                        setThumbnailUrl(null);
                      }}
                      aria-label="Remove cover image"
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              ) : null}
              <FileUploadControl
                accept="image/*"
                prompt="Upload a new cover (optional)"
                hint="Replaces the current cover when you save."
                aria-label="New thumbnail"
                onFilesPicked={(files) => {
                  const f = files[0];
                  if (f) {
                    setNewThumbFile(f);
                    setThumbRemoved(false);
                  }
                }}
              />
              {newThumbFile && newThumbPreview ? (
                <div className="preview-thumb-row">
                  <div className="preview-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={newThumbPreview} alt="" />
                    <button
                      type="button"
                      className="preview-thumb-remove"
                      onClick={() => setNewThumbFile(null)}
                      aria-label="Discard new thumbnail"
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="form-field full-width">
              <span className="field-label">Gallery URLs (remove with ×)</span>
              <p className="field-hint" style={{ marginTop: 0 }}>
                Current images: {galleryUrls.length}. Add files below to append after upload. If the
                gallery is non-empty, you need at least 10 images total.
              </p>
              <div className="preview-thumb-row">
                {galleryUrls.map((url, i) => (
                  <div key={`${url}-${i}`} className="preview-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={mediaSrc(url)} alt="" />
                    <button
                      type="button"
                      className="preview-thumb-remove"
                      onClick={() => setGalleryUrls((prev) => prev.filter((_, idx) => idx !== i))}
                      aria-label="Remove image from gallery"
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                ))}
              </div>
              <FileUploadControl
                multiple
                accept="image/*"
                prompt="Add more images"
                hint="Uploaded on save and appended to the gallery."
                aria-label="Add gallery images"
                onFilesPicked={(picked) =>
                  setNewGalleryFiles((prev) => {
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
              {newGalleryFiles.length > 0 ? (
                <div className="preview-thumb-row">
                  {newGalleryFiles.map((file, i) => (
                    <div key={`${file.name}-${file.size}-${i}`} className="preview-thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={newGalleryPreviews[i]} alt="" />
                      <button
                        type="button"
                        className="preview-thumb-remove"
                        onClick={() =>
                          setNewGalleryFiles((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        aria-label={`Remove ${file.name}`}
                      >
                        <X size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="full-width farm-row-actions">
              <button type="submit" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </SectionCard>
      )}
    </div>
  );
}
