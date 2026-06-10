'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { errorMessageFromUnknown } from '../../lib/api-errors';
import { useAuth } from '../../lib/auth-context';
import { apiGet } from '../../lib/backend-api';
import { parseStoredAmenity } from '../../lib/amenities';
import { AmenityLucideIcon } from '../../components/AmenityLucideIcon';
import { mediaSrc } from '../../lib/media-url';
import { HeaderLink, PageIntro, SectionCard, StatCard } from '../../ui/admin-ui';

type FarmImageRow = { id: string; imageUrl: string; farmId: string };

type FarmDetail = {
  id: string;
  name: string;
  location?: string;
  description?: string;
  price?: string;
  originalPrice?: string;
  rating?: number;
  reviews?: number;
  capacity?: string;
  features: string[];
  amenities: string[];
  facilities: string[];
  pricing?: any;
  rules: string[];
  contactPhone?: string;
  contactEmail?: string;
  isPopular?: boolean;
  discount?: string;
  weekdayPrice?: string;
  weekendPrice?: string;
  thumbnailUrl?: string | null;
  images?: FarmImageRow[];
};

export default function FarmDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const [farm, setFarm] = useState<FarmDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  useEffect(() => {
    if (lightboxIndex === null || !farm?.images?.length) return;
    const last = farm.images.length - 1;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft')
        setLightboxIndex((i) => (typeof i === 'number' && i > 0 ? i - 1 : i));
      if (e.key === 'ArrowRight')
        setLightboxIndex((i) => (typeof i === 'number' && i < last ? i + 1 : i));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex, farm, closeLightbox]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setError(null);
      try {
        const data = await apiGet<FarmDetail>(`/farms/${params.slug}`, token);
        setFarm(data);
      } catch (err: any) {
        setError(errorMessageFromUnknown(err, 'Failed to load farm'));
      }
    };
    void load();
  }, [token, params.slug]);

  if (!user) return null;

  return (
    <div className="page">
      <PageIntro
        eyebrow="Listing detail"
        title={farm ? farm.name : 'Farm details'}
        description="Inspect the full property record, including amenities, media, pricing, and linked decorations."
        actions={<HeaderLink href="/farms">Back to farms</HeaderLink>}
      />

      {error && <div className="error-banner">{error}</div>}

      {farm && (
        <>
          <div className="stat-grid">
            <StatCard
              label="Popularity"
              value={farm.isPopular ? 'Popular' : 'Standard'}
              meta={farm.discount || 'No discount label'}
            />
          </div>

          {farm.thumbnailUrl ? (
            <SectionCard
              title="Thumbnail"
              description="Primary preview image for this listing."
            >
              <img
                src={mediaSrc(farm.thumbnailUrl)}
                alt=""
                style={{ maxWidth: 320, width: '100%', height: 'auto', borderRadius: 12, display: 'block' }}
                loading="eager"
                decoding="async"
              />
            </SectionCard>
          ) : null}

          <SectionCard
            title="Photos"
            description="Listing images as shown to guests. Click a photo to view it larger."
          >
            {farm.images && farm.images.length > 0 ? (
              <div className="farm-detail-gallery">
                {farm.images.map((img, index) => (
                  <button
                    key={img.id}
                    type="button"
                    className="farm-detail-gallery__cell"
                    onClick={() => setLightboxIndex(index)}
                    aria-label={`Open photo ${index + 1} of ${farm.images!.length}`}
                  >
                    <img src={mediaSrc(img.imageUrl)} alt="" loading="lazy" decoding="async" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="field-hint" style={{ margin: 0 }}>
                No images are attached to this listing yet.
              </p>
            )}
          </SectionCard>

          <SectionCard
            title="Property overview"
            description="Core listing details and customer-facing commercial information."
          >
            <div className="details-grid">
              <div className="detail-card">
                <strong>Location</strong>
                <span>{farm.location || '—'}</span>
              </div>
              <div className="detail-card">
                <strong>Description</strong>
                <span>{farm.description || '—'}</span>
              </div>
              <div className="detail-card">
                <strong>Display price</strong>
                <span>{farm.price || '—'}</span>
              </div>
              <div className="detail-card">
                <strong>Original price</strong>
                <span>{farm.originalPrice || '—'}</span>
              </div>
              <div className="detail-card">
                <strong>Rating / Reviews</strong>
                <span>
                  {farm.rating !== undefined ? farm.rating : '—'}{' '}
                  {farm.reviews !== undefined ? `(${farm.reviews} reviews)` : ''}
                </span>
              </div>
              <div className="detail-card">
                <strong>Capacity</strong>
                <span>{farm.capacity || '—'}</span>
              </div>
              <div className="detail-card">
                <strong>Weekday 24h</strong>
                <span>{farm.weekdayPrice || '—'}</span>
              </div>
              <div className="detail-card">
                <strong>Weekend 24h</strong>
                <span>{farm.weekendPrice || '—'}</span>
              </div>
              <div className="detail-card">
                <strong>Contact</strong>
                <span>
                  {farm.contactPhone || farm.contactEmail
                    ? `${farm.contactPhone ?? ''} ${farm.contactEmail ?? ''}`.trim()
                    : '—'}
                </span>
              </div>
            </div>
          </SectionCard>

          <section className="list-grid">
            <SectionCard
              title="Features & amenities"
              description="Customer-facing property highlights."
            >
              <div className="list-grid">
                <div className="list-panel">
                  <h3>Features</h3>
                  {farm.features && farm.features.length > 0 ? (
                    <div className="pill-list">
                      {farm.features.map((f) => (
                        <span key={f} className="pill">
                          {f}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p>—</p>
                  )}
                </div>
                <div className="list-panel">
                  <h3>Amenities</h3>
                  {(() => {
                    const rows =
                      farm.amenities
                        ?.map((raw, i) => ({ ...parseStoredAmenity(raw), i }))
                        .filter((a) => a.name) ?? [];
                    return rows.length > 0 ? (
                      <div className="pill-list">
                        {rows.map(({ icon, name, i }) => (
                          <span key={`${name}-${i}`} className="pill pill--amenity">
                            <AmenityLucideIcon iconName={icon} size={16} />
                            {name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p>—</p>
                    );
                  })()}
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Facilities & rules"
              description="Operational details and guest constraints."
            >
              <div className="list-grid">
                <div className="list-panel">
                  <h3>Facilities</h3>
                  {farm.facilities && farm.facilities.length > 0 ? (
                    <ul>
                      {farm.facilities.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>—</p>
                  )}
                </div>
                <div className="list-panel">
                  <h3>Rules</h3>
                  {farm.rules && farm.rules.length > 0 ? (
                    <ul>
                      {farm.rules.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>—</p>
                  )}
                </div>
              </div>
            </SectionCard>
          </section>

          {lightboxIndex !== null &&
            farm.images &&
            farm.images.length > 0 &&
            lightboxIndex >= 0 &&
            lightboxIndex < farm.images.length && (
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
                  <img src={mediaSrc(farm.images[lightboxIndex].imageUrl)} alt="" />
                  <button
                    type="button"
                    className="farm-photo-lightbox-nav"
                    disabled={lightboxIndex >= farm.images.length - 1}
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
