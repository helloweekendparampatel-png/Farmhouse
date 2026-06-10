'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFormik } from 'formik';
import { useRouter } from 'next/navigation';
import { Trash2, X } from 'lucide-react';
import { errorMessageFromUnknown } from '../../lib/api-errors';
import { useAuth } from '../../lib/auth-context';
import { uploadAdminImageFile, uploadAdminImageFiles } from '../../lib/admin-image-upload';
import {
  collectCreateFarmFieldErrors,
  type FarmFormStrings,
} from '../../lib/farm-validation';
import { apiPost } from '../../lib/backend-api';
import type { AmenityItem } from '../../lib/amenities';
import { IconPicker } from '../../components/IconPicker';
import { AmenityLucideIcon } from '../../components/AmenityLucideIcon';
import { FileUploadControl } from '../../components/FileUploadControl';
import { HeaderLink, PageIntro, SectionCard } from '../../ui/admin-ui';

function fileKey(f: File) {
  return `${f.name}-${f.size}-${f.lastModified}`;
}

type FarmFormValues = {
  name: string;
  location: string;
  description: string;
  price: string;
  originalPrice: string;
  rating: string;
  reviews: string;
  capacity: string;
  featuresText: string;
  facilitiesText: string;
  rulesText: string;
  weekdayPrice: string;
  weekendPrice: string;
  contactPhone: string;
  contactEmail: string;
  discount: string;
  isPopular: boolean;
};

const initialValues: FarmFormValues = {
  name: '',
  location: '',
  description: '',
  price: '',
  originalPrice: '',
  rating: '',
  reviews: '',
  capacity: '',
  featuresText: '',
  facilitiesText: '',
  rulesText: '',
  weekdayPrice: '',
  weekendPrice: '',
  contactPhone: '',
  contactEmail: '',
  discount: '',
  isPopular: false,
};

export default function NewFarmPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();

  const [amenities, setAmenities] = useState<AmenityItem[]>([{ icon: 'Wifi', name: '' }]);
  const [activeIconIndex, setActiveIconIndex] = useState<number | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const thumbnailPreviewUrl = useMemo(
    () => (thumbnailFile ? URL.createObjectURL(thumbnailFile) : null),
    [thumbnailFile],
  );

  const photoPreviewUrls = useMemo(
    () => selectedFiles.map((f) => URL.createObjectURL(f)),
    [selectedFiles],
  );

  useEffect(() => {
    return () => {
      if (thumbnailPreviewUrl) URL.revokeObjectURL(thumbnailPreviewUrl);
      photoPreviewUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [thumbnailPreviewUrl, photoPreviewUrls]);

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && user && user.role !== 'ADMIN') {
      router.replace('/farms');
    }
  }, [user, loading, router]);

  const formik = useFormik({
    initialValues,
    validate: (values: FarmFormValues): Partial<Record<string, string>> => {
      const form: FarmFormStrings = {
        name: values.name,
        location: values.location,
        description: values.description,
        price: values.price,
        originalPrice: values.originalPrice,
        rating: values.rating,
        reviews: values.reviews,
        capacity: values.capacity,
        featuresText: values.featuresText,
        amenities,
        facilitiesText: values.facilitiesText,
        rulesText: values.rulesText,
        weekdayPrice: values.weekdayPrice,
        weekendPrice: values.weekendPrice,
        contactPhone: values.contactPhone,
        contactEmail: values.contactEmail,
        discount: values.discount,
      };
      return collectCreateFarmFieldErrors(form, {
        photoCount: selectedFiles.length,
        hasThumbnail: !!thumbnailFile,
      });
    },
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values: FarmFormValues) => {
      if (!token) return;
      setFormError(null);
      setSubmitting(true);
      try {
        let thumbnailImageUrl = '';
        let photoImageUrls: string[] = [];

        if (thumbnailFile) {
          try {
            thumbnailImageUrl = await uploadAdminImageFile(token, thumbnailFile, 'farms');
          } catch (err: unknown) {
            setFormError(errorMessageFromUnknown(err, 'Failed to upload thumbnail'));
            setSubmitting(false);
            return;
          }
        }

        if (selectedFiles.length > 0) {
          try {
            photoImageUrls = await uploadAdminImageFiles(token, selectedFiles, 'farms');
          } catch (err: unknown) {
            setFormError(errorMessageFromUnknown(err, 'Failed to upload images'));
            setSubmitting(false);
            return;
          }
        }

        const features = values.featuresText
          .split(/[,\n]/g)
          .map((s: string) => s.trim())
          .filter(Boolean);
        const amenitiesPayload = amenities
          .filter((a) => a.name.trim())
          .map((a) => ({ icon: a.icon, name: a.name.trim() }));
        const facilities = values.facilitiesText
          .split(/\n/g)
          .map((s: string) => s.trim())
          .filter(Boolean);
        const rules = values.rulesText
          .split(/\n/g)
          .map((s: string) => s.trim())
          .filter(Boolean);

        const pricing =
          values.weekdayPrice || values.weekendPrice
            ? {
                weekday: values.weekdayPrice ? { '24 Hours': values.weekdayPrice } : {},
                weekend: values.weekendPrice ? { '24 Hours': values.weekendPrice } : {},
              }
            : undefined;

        await apiPost('/farms', token, {
          farms: [
            {
              name: values.name.trim(),
              location: values.location.trim(),
              description: values.description.trim(),
              price: values.price.trim(),
              originalPrice: values.originalPrice.trim(),
              rating: values.rating.trim() ? Number(values.rating.trim()) : undefined,
              reviews: values.reviews.trim() ? Number(values.reviews.trim()) : undefined,
              capacity: values.capacity.trim(),
              features,
              amenities: amenitiesPayload,
              facilities,
              pricing,
              rules,
              contactPhone: values.contactPhone.trim(),
              contactEmail: values.contactEmail.trim(),
              isPopular: values.isPopular,
              discount: values.discount.trim() || undefined,
              weekdayPrice: values.weekdayPrice.trim(),
              weekendPrice: values.weekendPrice.trim(),
              thumbnailImageUrl,
              photoImageUrls,
            },
          ],
        });

        router.push('/farms');
      } catch (err: unknown) {
        setFormError(errorMessageFromUnknown(err, 'Failed to create farm'));
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    void formik.validateForm();
  }, [amenities, thumbnailFile, selectedFiles]);

  const fieldErrors = formik.errors as Record<string, string | undefined>;
  const fieldTouched = formik.touched as Record<string, boolean | undefined>;

  const showErr = (field: string) => {
    const msg = fieldErrors[field];
    if (!msg) return undefined;
    if (fieldTouched[field] || formik.submitCount > 0) return msg;
    return undefined;
  };

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  const err = showErr;

  return (
    <div className="page">
      <PageIntro
        eyebrow="Catalog"
        title="Create farmhouse"
        description="Enter a complete property profile. A single thumbnail and at least ten gallery images are required, with validation on every field."
        actions={<HeaderLink href="/farms">Back to list</HeaderLink>}
      />
      {formError && <div className="error-banner">{formError}</div>}

      <SectionCard
        title="Farm details"
        description="Required fields, formats (email, phone, prices, optional rating and reviews), and media rules are enforced client- and server-side."
      >
        <form onSubmit={formik.handleSubmit} className="form-grid full-width" noValidate>
          <label>
            <span className="field-label">
              Name <span className="field-required">*</span>
            </span>
            <input
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={err('name') ? 'field-error' : ''}
            />
            {err('name') && <span className="field-error-text">{err('name')}</span>}
          </label>
          <label>
            <span className="field-label">
              Location <span className="field-required">*</span>
            </span>
            <input
              name="location"
              value={formik.values.location}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={err('location') ? 'field-error' : ''}
            />
            {err('location') && <span className="field-error-text">{err('location')}</span>}
          </label>
          <label>
            <span className="field-label">
              Description <span className="field-required">*</span>
            </span>
            <textarea
              name="description"
              rows={3}
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={err('description') ? 'field-error' : ''}
            />
            {err('description') && <span className="field-error-text">{err('description')}</span>}
          </label>
          <label>
            <span className="field-label">
              Display Price <span className="field-required">*</span>
            </span>
            <input
              name="price"
              type="number"
              min={0}
              step={0.01}
              inputMode="decimal"
              value={formik.values.price}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={err('price') ? 'field-error' : ''}
            />
            {err('price') && <span className="field-error-text">{err('price')}</span>}
          </label>
          <label>
            <span className="field-label">
              Original Price <span className="field-required">*</span>
            </span>
            <input
              name="originalPrice"
              type="number"
              min={0}
              step={0.01}
              inputMode="decimal"
              value={formik.values.originalPrice}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={err('originalPrice') ? 'field-error' : ''}
            />
            {err('originalPrice') && (
              <span className="field-error-text">{err('originalPrice')}</span>
            )}
          </label>
          <label>
            <span className="field-label">Rating</span>
            <input
              name="rating"
              type="number"
              step={0.1}
              min={0}
              max={5}
              inputMode="decimal"
              value={formik.values.rating}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={err('rating') ? 'field-error' : ''}
            />
            {err('rating') && <span className="field-error-text">{err('rating')}</span>}
          </label>
          <label>
            <span className="field-label">Reviews Count</span>
            <input
              name="reviews"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={formik.values.reviews}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={err('reviews') ? 'field-error' : ''}
            />
            {err('reviews') && <span className="field-error-text">{err('reviews')}</span>}
          </label>
          <label>
            <span className="field-label">
              Capacity <span className="field-required">*</span>
            </span>
            <input
              name="capacity"
              type="number"
              min={1}
              max={99999}
              step={1}
              inputMode="numeric"
              value={formik.values.capacity}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={err('capacity') ? 'field-error' : ''}
            />
            {err('capacity') && <span className="field-error-text">{err('capacity')}</span>}
          </label>
          <label className="full-width">
            <span className="field-label">
              Features (comma or new line) <span className="field-required">*</span>
            </span>
            <textarea
              name="featuresText"
              rows={2}
              value={formik.values.featuresText}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={err('featuresText') ? 'field-error' : ''}
            />
            {err('featuresText') && <span className="field-error-text">{err('featuresText')}</span>}
          </label>
          <div className="full-width field-stack">
            <span className="field-label">
              Amenities <span className="field-required">*</span>
            </span>
            <p className="field-hint">Pick a Lucide icon and enter a label for each amenity.</p>
            <div className="amenity-rows">
              {amenities.map((item, idx) => (
                <div key={idx} className="amenity-row">
                  <button
                    type="button"
                    className={`amenity-icon-select${err('amenities') ? ' field-error' : ''}`}
                    onClick={() => setActiveIconIndex(idx)}
                  >
                    <span className="amenity-icon-preview">
                      <AmenityLucideIcon iconName={item.icon} size={20} />
                    </span>
                    <span className="amenity-icon-label">{item.icon}</span>
                  </button>
                  <input
                    value={item.name}
                    onChange={(e) => {
                      const v = e.target.value;
                      setAmenities((prev) =>
                        prev.map((a, i) => (i === idx ? { ...a, name: v } : a)),
                      );
                      void formik.setFieldTouched('amenities', true);
                    }}
                    onBlur={() => void formik.setFieldTouched('amenities', true)}
                    placeholder="Amenity name"
                    className={err('amenities') ? 'field-error' : ''}
                  />
                  <button
                    type="button"
                    className="amenity-row-remove"
                    onClick={() =>
                      setAmenities((prev) =>
                        prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx),
                      )
                    }
                    aria-label="Remove amenity"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="amenity-add-link"
              onClick={() => setAmenities((prev) => [...prev, { icon: 'Wifi', name: '' }])}
            >
              + Add amenity
            </button>
            {err('amenities') && <span className="field-error-text">{err('amenities')}</span>}
          </div>
          <label className="full-width">
            <span className="field-label">
              Facilities (one per line) <span className="field-required">*</span>
            </span>
            <textarea
              name="facilitiesText"
              rows={3}
              value={formik.values.facilitiesText}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={err('facilitiesText') ? 'field-error' : ''}
            />
            {err('facilitiesText') && (
              <span className="field-error-text">{err('facilitiesText')}</span>
            )}
          </label>
          <label className="full-width">
            <span className="field-label">
              Rules (one per line) <span className="field-required">*</span>
            </span>
            <textarea
              name="rulesText"
              rows={3}
              value={formik.values.rulesText}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={err('rulesText') ? 'field-error' : ''}
            />
            {err('rulesText') && <span className="field-error-text">{err('rulesText')}</span>}
          </label>
          <label>
            <span className="field-label">
              Weekday 24h Price <span className="field-required">*</span>
            </span>
            <input
              name="weekdayPrice"
              type="number"
              min={0}
              step={0.01}
              inputMode="decimal"
              value={formik.values.weekdayPrice}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={err('weekdayPrice') ? 'field-error' : ''}
            />
            {err('weekdayPrice') && <span className="field-error-text">{err('weekdayPrice')}</span>}
          </label>
          <label>
            <span className="field-label">
              Weekend 24h Price <span className="field-required">*</span>
            </span>
            <input
              name="weekendPrice"
              type="number"
              min={0}
              step={0.01}
              inputMode="decimal"
              value={formik.values.weekendPrice}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={err('weekendPrice') ? 'field-error' : ''}
            />
            {err('weekendPrice') && <span className="field-error-text">{err('weekendPrice')}</span>}
          </label>
          <label>
            <span className="field-label">
              Contact Phone <span className="field-required">*</span>
            </span>
            <input
              name="contactPhone"
              type="tel"
              autoComplete="tel"
              value={formik.values.contactPhone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={err('contactPhone') ? 'field-error' : ''}
            />
            {err('contactPhone') && <span className="field-error-text">{err('contactPhone')}</span>}
          </label>
          <label>
            <span className="field-label">
              Contact Email <span className="field-required">*</span>
            </span>
            <input
              name="contactEmail"
              type="email"
              autoComplete="email"
              value={formik.values.contactEmail}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={err('contactEmail') ? 'field-error' : ''}
            />
            {err('contactEmail') && <span className="field-error-text">{err('contactEmail')}</span>}
          </label>
          <label>
            <span className="field-label">Discount Label</span>
            <input
              name="discount"
              value={formik.values.discount}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className={err('discount') ? 'field-error' : ''}
            />
            {err('discount') && <span className="field-error-text">{err('discount')}</span>}
          </label>
          <label className="field-stack field-stack--checkbox">
            <span className="field-label">Popular</span>
            <span className="checkbox-field">
              <input
                name="isPopular"
                type="checkbox"
                checked={formik.values.isPopular}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              <span>Highlight this listing in the customer experience</span>
            </span>
          </label>
          <div className="form-field full-width">
            <span className="field-label">
              Thumbnail <span className="field-required">*</span>
            </span>
            <p className="field-hint">One image only — used as the listing preview card.</p>
            <FileUploadControl
              accept="image/*"
              prompt="Choose thumbnail image"
              hint="Single image only; choosing again replaces the current selection."
              hasError={!!err('thumbnail')}
              aria-label="Choose farm thumbnail"
              onFilesPicked={(list) => {
                const f = list[0];
                if (f?.type.startsWith('image/')) {
                  setThumbnailFile(f);
                  void formik.setFieldTouched('thumbnail', true);
                }
              }}
            />
            {thumbnailPreviewUrl && thumbnailFile && (
              <div style={{ marginTop: '0.65rem' }}>
                <p className="field-hint">Thumbnail preview — click × to remove.</p>
                <div className="photo-upload-preview-grid" style={{ maxWidth: 220 }}>
                  <div className="photo-upload-preview-item">
                    <button
                      type="button"
                      className="photo-upload-preview-remove"
                      onClick={() => {
                        setThumbnailFile(null);
                        void formik.setFieldTouched('thumbnail', true);
                      }}
                      aria-label="Remove thumbnail"
                    >
                      <X size={16} strokeWidth={2.5} />
                    </button>
                    <img
                      src={thumbnailPreviewUrl}
                      alt=""
                      className="photo-upload-preview-img"
                    />
                  </div>
                </div>
              </div>
            )}
            {err('thumbnail') && <span className="field-error-text">{err('thumbnail')}</span>}
          </div>

          <div className="form-field full-width">
            <span className="field-label">
              Gallery photos (at least 10) <span className="field-required">*</span>
            </span>
            <FileUploadControl
              multiple
              accept="image/*"
              prompt="Add listing photos — click or drop"
              hint="Select multiple images; add more in batches. Minimum 10 required to submit."
              hasError={!!err('photos')}
              aria-label="Choose farm listing photos"
              onFilesPicked={(list) => {
                if (!list.length) return;
                setSelectedFiles((prev) => {
                  const keys = new Set(prev.map(fileKey));
                  const next = [...prev];
                  for (const f of list) {
                    const k = fileKey(f);
                    if (!keys.has(k)) {
                      keys.add(k);
                      next.push(f);
                    }
                  }
                  return next;
                });
                void formik.setFieldTouched('photos', true);
              }}
            />
            {selectedFiles.length > 0 && (
              <>
                <p className="field-hint" style={{ marginTop: '0.65rem' }}>
                  {selectedFiles.length} image{selectedFiles.length === 1 ? '' : 's'} selected —
                  click × to remove one.
                </p>
                <div className="photo-upload-preview-grid">
                  {selectedFiles.map((file, index) => (
                    <div key={`${fileKey(file)}-${index}`} className="photo-upload-preview-item">
                      <button
                        type="button"
                        className="photo-upload-preview-remove"
                        onClick={() => {
                          setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
                          void formik.setFieldTouched('photos', true);
                        }}
                        aria-label={`Remove ${file.name}`}
                      >
                        <X size={16} strokeWidth={2.5} />
                      </button>
                      <img
                        src={photoPreviewUrls[index]}
                        alt=""
                        className="photo-upload-preview-img"
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
            {err('photos') && <span className="field-error-text">{err('photos')}</span>}
          </div>

          <div className="full-width farm-row-actions">
            <button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Farm'}
            </button>
          </div>
        </form>
      </SectionCard>

      {activeIconIndex !== null && amenities[activeIconIndex] && (
        <IconPicker
          value={amenities[activeIconIndex].icon}
          onChange={(iconName) => {
            setAmenities((prev) =>
              prev.map((a, i) => (i === activeIconIndex ? { ...a, icon: iconName } : a)),
            );
            setActiveIconIndex(null);
            void formik.setFieldTouched('amenities', true);
          }}
          onClose={() => setActiveIconIndex(null)}
        />
      )}
    </div>
  );
}
