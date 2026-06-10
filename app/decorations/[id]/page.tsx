'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { errorMessageFromUnknown } from '../../lib/api-errors';
import { useAuth } from '../../lib/auth-context';
import { apiGet } from '../../lib/backend-api';
import { mediaSrc } from '../../lib/media-url';
import { HeaderLink, PageIntro, SectionCard, StatCard } from '../../ui/admin-ui';

type DecorationImage = { id: string; imageUrl: string };

type DecorationDetail = {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
  images?: DecorationImage[];
};

export default function DecorationDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const [row, setRow] = useState<DecorationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!row?.images?.length || lightboxIndex === null) return;
    const last = row.images.length - 1;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft')
        setLightboxIndex((i) => (typeof i === 'number' && i > 0 ? i - 1 : i));
      if (e.key === 'ArrowRight')
        setLightboxIndex((i) => (typeof i === 'number' && i < last ? i + 1 : i));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex, row, closeLightbox]);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setError(null);
      try {
        const data = await apiGet<DecorationDetail>(`/decorations/${params.id}`, token);
        setRow(data);
      } catch (err: unknown) {
        setError(errorMessageFromUnknown(err, 'Failed to load decoration'));
      }
    };
    void load();
  }, [token, params.id]);

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';

  return (
    <div className="page">
      <PageIntro
        eyebrow="Decoration"
        title={row?.title ?? 'Decoration'}
        description="Package media and image count as stored for listings."
        actions={
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <HeaderLink href="/decorations">Back to decorations</HeaderLink>
            {isAdmin && row ? (
              <HeaderLink href={`/decorations/${row.id}/edit`} variant="primary">
                Edit
              </HeaderLink>
            ) : null}
          </div>
        }
      />

      {error && <div className="error-banner">{error}</div>}

      {row && (
        <>
          <div className="stat-grid">
            <StatCard
              label="Gallery images"
              value={row.images?.length ?? 0}
              meta={row.thumbnailUrl ? 'Thumbnail set' : 'No thumbnail'}
            />
          </div>

          <SectionCard
            title="Thumbnail"
            description="Cover image used where this package appears in compact views."
          >
            {row.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaSrc(row.thumbnailUrl)}
                alt=""
                style={{ maxWidth: 280, borderRadius: 16, border: '1px solid var(--border)' }}
              />
            ) : (
              <p className="field-hint" style={{ margin: 0 }}>
                No thumbnail uploaded.
              </p>
            )}
          </SectionCard>

          <SectionCard
            title="Gallery"
            description="All images in this decoration package. Click a photo to enlarge."
          >
            {row.images && row.images.length > 0 ? (
              <div className="farm-detail-gallery">
                {row.images.map((img, index) => (
                  <button
                    key={img.id}
                    type="button"
                    className="farm-detail-gallery__cell"
                    onClick={() => setLightboxIndex(index)}
                    aria-label={`Open photo ${index + 1} of ${row.images!.length}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={mediaSrc(img.imageUrl)} alt="" loading="lazy" decoding="async" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="field-hint" style={{ margin: 0 }}>
                No gallery images yet.
              </p>
            )}
          </SectionCard>

          {lightboxIndex !== null &&
            row.images &&
            row.images.length > 0 &&
            lightboxIndex >= 0 &&
            lightboxIndex < row.images.length && (
              <div
                className="farm-photo-lightbox-backdrop"
                role="dialog"
                aria-modal="true"
                aria-label="Photo preview"
                onClick={closeLightbox}
              >
                <div className="farm-photo-lightbox-inner" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="farm-photo-lightbox-close"
                    onClick={closeLightbox}
                    aria-label="Close"
                  >
                    <X size={22} />
                  </button>
                  <button
                    type="button"
                    className="farm-photo-lightbox-nav"
                    disabled={lightboxIndex <= 0}
                    onClick={() => setLightboxIndex(lightboxIndex - 1)}
                    aria-label="Previous photo"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaSrc(row.images[lightboxIndex].imageUrl)} alt="" />
                  <button
                    type="button"
                    className="farm-photo-lightbox-nav"
                    disabled={lightboxIndex >= row.images.length - 1}
                    onClick={() => setLightboxIndex(lightboxIndex + 1)}
                    aria-label="Next photo"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>
              </div>
            )}
        </>
      )}
    </div>
  );
}
